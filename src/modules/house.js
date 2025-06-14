// src/modules/house.js
import * as THREE from "three";
import * as CANNON from "cannon-es";
import * as TWEEN from "@tweenjs/tween.js"; // Import TWEEN

// --- Private Variables ---
let door, doorPivot, doorBody;
let doorOpen = false;
let characterRef = null; // To store reference to the character object
let currentDoorTween = null; // To store the active tween

// --- Texture Loading (Helper within the module) ---
function loadHouseTextures(textureLoader) {
	if (!textureLoader) {
		console.error("TextureLoader not provided to loadHouseTextures.");
		return {};
	}
	return {
		doorColor: textureLoader.load("textures/door/color.jpg"),
		doorAlpha: textureLoader.load("textures/door/alpha.jpg"),
		doorAO: textureLoader.load("textures/door/ambientOcclusion.jpg"),
		doorHeight: textureLoader.load("textures/door/height.jpg"),
		doorNormal: textureLoader.load("textures/door/normal.jpg"),
		doorMetalness: textureLoader.load("textures/door/metalness.jpg"),
		doorRoughness: textureLoader.load("textures/door/roughness.jpg"),
		bricksColor: textureLoader.load("textures/bricks/color.jpg"),
		bricksAO: textureLoader.load("textures/bricks/ambientOcclusion.jpg"),
		bricksNormal: textureLoader.load("textures/bricks/normal.jpg"),
		bricksRoughness: textureLoader.load("textures/bricks/roughness.jpg"),
	};
}

// --- Physics Body Creation (Helper) ---
function createWallBody(world, position, size) {
	if (!world) {
		console.error("Physics world not provided to createWallBody.");
		return;
	}
	const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
	const body = new CANNON.Body({
		mass: 0, // Static
		position: new CANNON.Vec3(position.x, position.y, position.z),
		shape: shape,
	});
	world.addBody(body);
}

// --- Exported Functions ---

export function createHouse(scene, world, textureLoader) {
	const house = new THREE.Group();
	house.name = "HouseGroup"; // Add name for debugging
	const textures = loadHouseTextures(textureLoader);

	// --- Walls ---
	const wallMaterial = new THREE.MeshStandardMaterial({
		map: textures.bricksColor,
		aoMap: textures.bricksAO,
		normalMap: textures.bricksNormal,
		roughnessMap: textures.bricksRoughness,
	});
	const backWallGeo = new THREE.BoxGeometry(16, 10, 0.2);
	const sideWallGeo = new THREE.BoxGeometry(7, 10, 0.2);
	const frontMidGeo = new THREE.BoxGeometry(2.3, 6.5, 0.2);
	const verticalWallGeo = new THREE.BoxGeometry(0.2, 10, 16);
	const backWall = new THREE.Mesh(backWallGeo, wallMaterial);
	backWall.castShadow = true; backWall.receiveShadow = true;
	backWall.position.set(0, 5, -8); house.add(backWall);
	const frontWallLeft = new THREE.Mesh(sideWallGeo, wallMaterial);
	frontWallLeft.castShadow = true; frontWallLeft.receiveShadow = true;
	frontWallLeft.position.set(-4.6, 5, 8); house.add(frontWallLeft);
	const frontWallMid = new THREE.Mesh(frontMidGeo, wallMaterial);
	frontWallMid.castShadow = true; frontWallMid.receiveShadow = true;
	frontWallMid.position.set(0, 6.75, 8); house.add(frontWallMid);
	const frontWallRight = new THREE.Mesh(sideWallGeo, wallMaterial);
	frontWallRight.castShadow = true; frontWallRight.receiveShadow = true;
	frontWallRight.position.set(4.6, 5, 8); house.add(frontWallRight);
	const leftWall = new THREE.Mesh(verticalWallGeo, wallMaterial);
	leftWall.castShadow = true; leftWall.receiveShadow = true;
	leftWall.position.set(-8, 5, 0); house.add(leftWall);
	const rightWall = new THREE.Mesh(verticalWallGeo, wallMaterial);
	rightWall.castShadow = true; rightWall.receiveShadow = true;
	rightWall.position.set(8, 5, 0); house.add(rightWall);
	const wallsData = [
		{ position: backWall.position, size: { x: 16, y: 10, z: 0.2 } },
		{ position: frontWallLeft.position, size: { x: 7, y: 10, z: 0.2 } },
		{ position: { x: 0, y: 6.75, z: 8 }, size: { x: 2.3, y: 6.5, z: 0.2 } }, // Above door
		{ position: frontWallRight.position, size: { x: 7, y: 10, z: 0.2 } },
		{ position: leftWall.position, size: { x: 0.2, y: 10, z: 16 } },
		{ position: rightWall.position, size: { x: 0.2, y: 10, z: 16 } },
	];
	wallsData.forEach(wall => createWallBody(world, wall.position, wall.size));

	// --- Roof ---
	const roof = new THREE.Mesh(
		new THREE.ConeGeometry(11.5, 4, 4), // Adjusted radius based on 16 width walls
		new THREE.MeshStandardMaterial({ color: "#b35f45" })
	);
	roof.castShadow = true;
	roof.receiveShadow = true;
	roof.rotation.y = Math.PI * 0.25;
	roof.position.y = 10 + 2;
	house.add(roof);

	// --- Door ---
	// Dimensions from original script
	const doorWidth = 2.2; // Changed doorWidth
	const doorHeight = 4;
	const newDoorThickness = 0.15; // New constant for door thickness
	let doorDepth = newDoorThickness; // Use let if it might be reassigned, or const if not. Assuming const is fine.
	const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, newDoorThickness); // Use new thickness for visual
	doorGeometry.setAttribute("uv2", new THREE.Float32BufferAttribute(doorGeometry.attributes.uv.array, 2));

	const uMin = 0.225;
    const uMax = 0.775;
    const uvAttribute = doorGeometry.attributes.uv;
    // Loop for vertex indices 16 to 23 (front and back faces)
    // Standard BoxGeometry UVs for faces are laid out sequentially.
    // +Z face (front) might be vertices 16,17,18,19.
    // -Z face (back) might be vertices 20,21,22,23.
    for (let vertexIndex = 16; vertexIndex <= 23; vertexIndex++) {
        let currentU = uvAttribute.getX(vertexIndex);
        // Check if U is close to 0 (left edge of texture)
        if (Math.abs(currentU - 0.0) < 0.01) {
            uvAttribute.setX(vertexIndex, uMin);
        }
        // Check if U is close to 1 (right edge of texture)
        else if (Math.abs(currentU - 1.0) < 0.01) { // Use 'else if' to avoid setting uMax if already set to uMin (e.g. if original U was exactly 0)
            uvAttribute.setX(vertexIndex, uMax);
        }
    }
    uvAttribute.needsUpdate = true;

	const doorMaterial = new THREE.MeshStandardMaterial({
		map: textures.doorColor,
    transparent: true, // Re-enable transparency
    alphaMap: textures.doorAlpha, // Restore alphaMap
		aoMap: textures.doorAO,
    displacementMap: textures.doorHeight, // Keep map but scale is 0
    displacementScale: 0, // Keep displacementScale at 0 for now
		normalMap: textures.doorNormal,
		metalnessMap: textures.doorMetalness,
    roughnessMap: textures.doorRoughness,
	});
	door = new THREE.Mesh(doorGeometry, doorMaterial);
	door.castShadow = true;
	door.receiveShadow = true;
	door.name = "HouseDoorMesh"; // Add name

	// Pivot Point (Hinge) - Position at the left edge of the door opening
	// Opening center x=0, width=4 -> left edge = -2
	// Opening bottom y=0 (relative to house base, assuming house base is at y=0)
	// Opening z=8 (front wall plane)
	// Pivot Y needs to match door bottom edge. If door height is 4, bottom edge is at y=0.
	const pivotPosition = new THREE.Vector3(-1.1, doorHeight / 2, 8.0); // Pivot at bottom-left corner, on the wall plane
	doorPivot = new THREE.Object3D();
	doorPivot.name = "DoorPivot";
	doorPivot.position.copy(pivotPosition);
	scene.add(doorPivot); // Add pivot directly to the scene

	// Position door relative to the pivot
	// Door's visual center needs to be offset by half its width from the pivot along X
	// And half its height along Y. Z offset should be minimal (half visual depth).
	door.position.set(doorWidth / 2, 0, 0); // Center the door relative to pivot, Z is now 0
	doorPivot.add(door); // Add door to pivot

	// Door Physics Body
	// Shape dimensions are HALF SIZES
	const doorShape = new CANNON.Box(new CANNON.Vec3(doorWidth / 2, doorHeight / 2, doorDepth / 2)); // Use actual depth for physics
	doorBody = new CANNON.Body({
		mass: 0, // Static body - its position/rotation is driven by animation, not physics simulation
		shape: doorShape,
	});
	doorBody.name = "HouseDoorBody";

	// Set initial physics state to match visual state *after* adding to pivot
	// We need the world position/rotation of the door mesh itself
	const initialDoorWorldPos = new THREE.Vector3();
	door.getWorldPosition(initialDoorWorldPos); // Get center of door mesh in world space
	const initialDoorWorldQuat = new THREE.Quaternion();
	door.getWorldQuaternion(initialDoorWorldQuat); // Get rotation of door mesh in world space

	doorBody.position.copy(initialDoorWorldPos);
	doorBody.quaternion.copy(initialDoorWorldQuat);
	world.addBody(doorBody);

	console.log("House created.");
	scene.add(house); // Add main house group last
	return house;
}

export function setupDoorInteraction(character) {
	if (!character) {
		console.error("Character ref needed for setupDoorInteraction.");
		return;
	}
	characterRef = character;
	// Ensure listener isn't added multiple times
	document.removeEventListener("keydown", handleDoorKeyDown);
	document.addEventListener("keydown", handleDoorKeyDown);
	console.log("Door interaction listener added.");
}

// --- Internal Helper Functions ---

function handleDoorKeyDown(event) {
	if (!characterRef || !door || !doorPivot || !doorBody) return;

	if (event.key === 'e' || event.key === 'E') {
		// Use door pivot for distance check - makes sense for interacting with the hinge area
		const doorPivotWorldPosition = new THREE.Vector3();
		doorPivot.getWorldPosition(doorPivotWorldPosition);

        // Character position should be updated each frame in animate.js
        const charPos = characterRef.position; // Assuming characterRef has up-to-date position

		const distance = doorPivotWorldPosition.distanceTo(charPos);
		const interactionDistance = 5.0; // Increased interaction distance slightly (original was 5)

		if (distance <= interactionDistance) {
			toggleDoor();
		} else {
             // DEBUG LOG 4 was here, now removed
        }
	}
}

function toggleDoor() {
	if (typeof TWEEN === "undefined") {
		console.error("TWEEN library is not available.");
		return;
	}

    // Stop the previous tween if it's still running to prevent conflicts
    if (currentDoorTween) {
        currentDoorTween.stop();
    }

    // Target Y rotation for the PIVOT (original code rotated 90 deg)
	const targetRotationY = doorOpen ? 0 : Math.PI / 2; // 90 degrees outwards

    currentDoorTween = new TWEEN.Tween(doorPivot.rotation)
        .to({ y: targetRotationY }, 500) // 500ms duration
        .onUpdate(() => {
            if (doorBody && door) {
                const doorWorldPosition = new THREE.Vector3();
                door.getWorldPosition(doorWorldPosition);
                const doorWorldQuaternion = new THREE.Quaternion();
                door.getWorldQuaternion(doorWorldQuaternion);
                doorBody.position.copy(doorWorldPosition);
                doorBody.quaternion.copy(doorWorldQuaternion);
            }
        })
        .onComplete(() => {
            currentDoorTween = null; // Clear the tween when it's done
        }); // Semicolon here, .start() is moved

    TWEEN.add(currentDoorTween); // Explicitly add the tween to the default group
    currentDoorTween.start();    // Now start the tween

	doorOpen = !doorOpen; // Toggle state AFTER starting animation
}

export function removeDoorInteraction() {
	document.removeEventListener("keydown", handleDoorKeyDown);
	characterRef = null;
	console.log("Door interaction listener removed.");
}

export function updateHouseTweens(time) {
	if (typeof TWEEN !== "undefined") {
		TWEEN.update(time);
	}
}