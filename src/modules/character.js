// src/modules/character.js
import * as THREE from "three";
import * as CANNON from "cannon-es";
// 导入体力系统相关函数
import { canJump, consumeStamina } from "./debug.js";

// --- Private Variables ---
// These will hold the created objects, accessed via the returned object
let character = null;
let characterBody = null;
let head = null;
let bodyContainer = null;
let body = null;
let leftArm = null;
let leftHand = null;
let rightArm = null;
let rightHand = null;
let leftThigh = null;
let leftLeg = null;
let rightThigh = null;
let rightLeg = null;
// 添加新的私有变量
let isGrounded = false;
let lastJumpTime = 0;
const jumpCooldown = 300; // 跳跃冷却时间(毫秒)
const groundCheckDistance = 0.35; // 地面检测距离
// --- 新增：动画角色物理材质 ---
let animatedCharacterMaterial = null;

// --- Exported Function ---

/**
 * Creates the player character's visual model and physics body.
 *
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {CANNON.World} world - The Cannon.js physics world.
 * @param {CANNON.Vec3} initialPosition - The starting position for the character.
 * @returns {object} An object containing the character's visual mesh, physics body, and animated parts.
 *                   { character: THREE.Object3D, characterBody: CANNON.Body, parts: object }
 */
export function createCharacter(scene, world, initialPosition = new CANNON.Vec3(0, 3, 16)) {
	if (!scene || !world) {
		console.error("Scene and World must be provided to createCharacter.");
		return null;
	}

	// --- Physics Body ---
	const characterShape = new CANNON.Box(new CANNON.Vec3(0.24, 0.3, 0.24)); // Half-extents matching visual approx.
	
	// 创建低摩擦的物理材质
	const characterMaterial = new CANNON.Material({ friction: 0.01, restitution: 0.1 });
	
	characterBody = new CANNON.Body({
		mass: 70, // Mass in kg (adjust as needed for realistic physics)
		position: initialPosition,
		shape: characterShape,
		fixedRotation: true, // Prevent character from tipping over
		linearDamping: 0.5, // 降低线性阻尼，减少移动阻力
		material: characterMaterial // 使用低摩擦材质
	});
	world.addBody(characterBody);
	
	// 创建角色与地面之间的接触材质
	// 确保 world.defaultMaterial 有名字，或者创建一个新的地面材质
	if (!world.defaultMaterial.name) world.defaultMaterial.name = "defaultMaterial";
	const characterGroundContact = new CANNON.ContactMaterial(
		characterMaterial,
		world.defaultMaterial,
		{
			friction: 0.01, // 非常低的摩擦系数
			restitution: 0.1, // 低弹性
			contactEquationStiffness: 1e6, // 增加接触刚度
			contactEquationRelaxation: 3 // 降低接触松弛
		}
	);
	world.addContactMaterial(characterGroundContact);

	// --- Visual Model (THREE.Object3D) ---
	character = new THREE.Object3D();
	// Set initial visual position to match physics body (important!)
	character.position.copy(characterBody.position);
	scene.add(character);

	// Use a standard material for simplicity, can be customized later
	const material = new THREE.MeshNormalMaterial(); // Simple Normal Material

	// Head
	const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
	head = new THREE.Mesh(headGeo, material);
	head.castShadow = true;
	head.receiveShadow = true;
	head.position.y = 1.44; // Position relative to character container's origin (bottom center)
	character.add(head);

	// Body Container (for Y-axis rotation during strafing)
	bodyContainer = new THREE.Object3D();
	// bodyContainer's origin matches character's origin
	character.add(bodyContainer);

	// Body
	const bodyGeo = new THREE.BoxGeometry(0.48, 0.72, 0.24);
	body = new THREE.Mesh(bodyGeo, material);
	body.castShadow = true;
	body.receiveShadow = true;
	body.position.y = 0.84; // Center of the body relative to character origin
	bodyContainer.add(body); // Add body to the container

	// Arms (Pivot point is shoulder)
	// Left Arm
	leftArm = new THREE.Object3D(); // Pivot (shoulder joint)
	leftArm.position.set(-0.3, 1.18, 0); // Position shoulder relative to body container origin
	const leftHandGeo = new THREE.BoxGeometry(0.12, 0.78, 0.12);
	leftHand = new THREE.Mesh(leftHandGeo, material); // Represents the whole arm for simplicity
	leftHand.castShadow = true;
	leftHand.receiveShadow = true;
	leftHand.position.y = -0.39; // Position hand relative to shoulder pivot (center of geometry offset down)
	leftArm.add(leftHand);
	bodyContainer.add(leftArm);

	// Right Arm
	rightArm = new THREE.Object3D(); // Pivot (shoulder joint)
	rightArm.position.set(0.3, 1.18, 0); // Position shoulder relative to body container origin
	const rightHandGeo = new THREE.BoxGeometry(0.12, 0.78, 0.12);
	rightHand = new THREE.Mesh(rightHandGeo, material);
	rightHand.castShadow = true;
	rightHand.receiveShadow = true;
	rightHand.position.y = -0.39; // Position hand relative to shoulder pivot
	rightArm.add(rightHand);
	bodyContainer.add(rightArm);

	// Legs (Pivot point is hip)
	// Left Leg
	leftThigh = new THREE.Object3D(); // Pivot (hip joint)
	leftThigh.position.set(-0.12, 0.48, 0); // Position hip relative to body container origin
	const leftLegGeo = new THREE.BoxGeometry(0.18, 0.84, 0.18);
	leftLeg = new THREE.Mesh(leftLegGeo, material); // Represents the whole leg
	leftLeg.castShadow = true;
	leftLeg.receiveShadow = true;
	leftLeg.position.y = -0.42; // Position leg relative to hip pivot
	leftThigh.add(leftLeg);
	bodyContainer.add(leftThigh);

	// Right Leg
	rightThigh = new THREE.Object3D(); // Pivot (hip joint)
	rightThigh.position.set(0.12, 0.48, 0); // Position hip relative to body container origin
	const rightLegGeo = new THREE.BoxGeometry(0.18, 0.84, 0.18);
	rightLeg = new THREE.Mesh(rightLegGeo, material);
	rightLeg.castShadow = true;
	rightLeg.receiveShadow = true;
	rightLeg.position.y = -0.42; // Position leg relative to hip pivot
	rightThigh.add(rightLeg);
	bodyContainer.add(rightThigh);

	console.log("Character created at:", initialPosition);

	// Return references needed by other modules (especially animation)
	return {
		character: character, // The main THREE.Object3D container
		characterBody: characterBody, // The CANNON.Body physics object
		parts: {
			// References to animatable parts
			head: head,
			bodyContainer: bodyContainer, // For strafing rotation
			leftArm: leftArm, // Pivot for left arm swing
			rightArm: rightArm, // Pivot for right arm swing
			leftThigh: leftThigh, // Pivot for left leg swing
			rightThigh: rightThigh, // Pivot for right leg swing
		},
	};
}

// --- 新增：创建动画角色物理体的函数 ---
/**
 * Creates the physics body for the animated character model.
 * Uses a Box shape.
 *
 * @param {CANNON.World} world - The Cannon.js physics world.
 * @param {CANNON.Vec3} initialPosition - The starting position for the character's **bottom center**.
 * @param {object} [options] - Optional parameters.
 * @param {number} [options.mass=70] - Mass of the character.
 * @param {number} [options.width=0.6] - Full width (X-axis) of the physics box.
 * @param {number} [options.height=0.3] - Full height (Y-axis) of the physics box.
 * @param {number} [options.depth=0.6] - Full depth (Z-axis) of the physics box.
 * @param {number} [options.linearDamping=0.2] - Linear damping for the body (Lowered default).
 * @returns {CANNON.Body | null} The created Cannon.js body, or null if world is missing.
 */
export function createAnimatedCharacterPhysics(world, initialPosition, options = {}) {
	if (!world) {
		console.error("World must be provided to createAnimatedCharacterPhysics.");
		return null;
	}

	// --- 修改：调整默认阻尼，并从 options 获取完整尺寸 ---
	const {
		mass = 70,
        width = 0.6, // Default full width
        height = 0.5, // Default full height - !!调整这个值以匹配你的模型!!
        depth = 0.6, // Default full depth
		linearDamping = 0.2, // Lowered default linear damping
	} = options;
    // --- 结束修改 ---

	// --- Physics Body ---
    // 定义 Box 的半尺寸 (half extents)
    const halfExtents = new CANNON.Vec3(
        width / 2,
        height / 2,
        depth / 2
    );
    const characterShape = new CANNON.Box(halfExtents);

    // --- 新增：调整初始位置，使其成为物理体的中心点 ---
    const bodyCenterPosition = new CANNON.Vec3(
        initialPosition.x,
        initialPosition.y + halfExtents.y, // Y = 脚底位置 + 半高
        initialPosition.z
    );
    // --- 结束新增 ---

	// 创建动画角色的物理材质 (逻辑不变)
	if (!animatedCharacterMaterial) {
		animatedCharacterMaterial = new CANNON.Material("animatedCharacterMaterial");
		animatedCharacterMaterial.friction = 0.01;
		animatedCharacterMaterial.restitution = 0.1;
	}


	const animatedBody = new CANNON.Body({
		mass: mass,
		position: bodyCenterPosition, // <-- 使用调整后的中心位置
		shape: characterShape,
		fixedRotation: true,
		linearDamping: linearDamping,
		material: animatedCharacterMaterial
	});

	// ... (添加接触材质的逻辑不变) ...
    // 创建动画角色与地面之间的接触材质
	if (!world.defaultMaterial.name) world.defaultMaterial.name = "defaultMaterial";
	const animatedCharacterGroundContact = new CANNON.ContactMaterial(
		animatedCharacterMaterial,
		world.defaultMaterial,
		{
			friction: 0.01,
			restitution: 0.1,
			contactEquationStiffness: 1e6,
			contactEquationRelaxation: 3
		}
	);
	// 检查是否已存在相同的接触材质，避免重复添加 (逻辑不变)
	let found = false;
	for (const cm of world.contactmaterials) {
		if ((cm.materials[0] === animatedCharacterMaterial && cm.materials[1] === world.defaultMaterial) ||
			(cm.materials[1] === animatedCharacterMaterial && cm.materials[0] === world.defaultMaterial)) {
			found = true;
			break;
		}
	}
	if (!found) {
		world.addContactMaterial(animatedCharacterGroundContact);
	}


	console.log("Animated character physics body configured. Center at:", bodyCenterPosition); // Log the center position

	// 返回创建的物理体
	return animatedBody;
}

/**
 * Updates the character's visual position and rotation to match its physics body.
 * Should be called within the main animation loop.
 * Also handles basic jump logic based on velocity.
 *
 * @param {THREE.Object3D} charObject - The character's visual THREE.Object3D.
 * @param {CANNON.Body} charBody - The character's CANNON.Body.
 * @returns {boolean} Whether the character is currently considered 'inAir'.
 */
export function updateCharacterPhysicsSync(charObject, charBody) {
	if (!charObject || !charBody) return false;

	// Copy position from physics body to visual mesh
	charObject.position.copy(charBody.position);
	// Do NOT copy rotation if fixedRotation=true and controlled by camera (like FPS)
	// charObject.quaternion.copy(charBody.quaternion); // Only if physics controls rotation

	// 使用射线检测地面，更精确地判断是否在地面上
	const start = charBody.position.clone();
	const end = start.clone();
	end.y -= groundCheckDistance;
	
	// 创建射线
	const ray = new CANNON.Ray(start, end);
	ray.mode = CANNON.Ray.CLOSEST;
	ray.skipBackfaces = true;
	
	// 执行射线检测
	const result = new CANNON.RaycastResult();
	ray.intersectWorld(charBody.world, { result });
	
	// 更新地面状态
	isGrounded = result.hasHit;

	// 如果使用垂直速度判断，可以作为备用检测
	const verticalVelocityThreshold = 0.1; // 小容差值
	const inAir = !isGrounded && Math.abs(charBody.velocity.y) > verticalVelocityThreshold;

	return inAir;
}

/**
 * 检查角色是否在地面上
 * @returns {boolean} 角色是否在地面上
 */
export function isCharacterGrounded() {
	return isGrounded;
}

/**
 * Applies a jump impulse to the character's physics body.
 * @param {CANNON.Body} charBody - The character's physics body.
 * @param {number} jumpVelocity - The upward velocity to apply.
 * @returns {boolean} Whether the jump was successful
 */
export function characterJump(charBody, jumpVelocity = 6) {
	if (!charBody) return false;
	
	const now = performance.now();
	
	// 只有在地面上且跳跃冷却结束时才能跳跃
	if (isGrounded && now - lastJumpTime > jumpCooldown) {
		// 检查是否有足够的体力跳跃
		if (canJump()) {
			charBody.velocity.y = jumpVelocity;
			lastJumpTime = now;
			return true;
		} else {
			// 体力不足，无法跳跃
			console.log("体力不足，无法跳跃");
			return false;
		}
	}
	
	return false;
}

// Temporary vectors to avoid creating them every frame
const _worldDirection = new THREE.Vector3();
const _horizontalForward = new THREE.Vector3();
const _horizontalRight = new THREE.Vector3();
const _worldUp = new THREE.Vector3(0, 1, 0); // World's UP direction
const _inputVelocity = new THREE.Vector3();
const _currentVelocity = new THREE.Vector3();

/**
 * Applies movement forces/velocity to the character based on input keys and camera direction.
 * Movement is projected onto the horizontal plane (XZ).
 * To be called in the animation loop.
 *
 * @param {object} keys - An object indicating which keys are currently pressed (e.g., keys['KeyW']).
 * @param {CANNON.Body} charBody - The character's physics body.
 * @param {THREE.Camera} camera - The main camera to get direction.
 * @param {number} currentSpeed - The current movement speed (units per second).
 * @param {number} deltaTime - Time since last frame in seconds.
 * @param {boolean} isSprinting - Whether the character is sprinting.
 */
export function moveCharacter(keys, charBody, camera, currentSpeed, deltaTime, isSprinting = false) {
	if (!charBody || !camera) return;

	// Get camera's world direction
	camera.getWorldDirection(_worldDirection);

	// Project forward direction onto the horizontal plane (XZ)
	_horizontalForward.copy(_worldDirection);
	_horizontalForward.y = 0; // Remove vertical component
	_horizontalForward.normalize(); // Make it a unit vector

	// Calculate the right direction vector (perpendicular to forward, on the horizontal plane)
	// Use cross product: UP x FORWARD = RIGHT
	_horizontalRight.crossVectors(_worldUp, _horizontalForward);
	// No need to normalize _horizontalRight as _worldUp and _horizontalForward are orthogonal unit vectors

	// Reset input velocity
	_inputVelocity.set(0, 0, 0);

	// Add velocity components based on keys
	if (keys["KeyW"]) {
		_inputVelocity.add(_horizontalForward);
	}
	if (keys["KeyS"]) {
		_inputVelocity.sub(_horizontalForward); // Subtract for backward movement
	}
	if (keys["KeyA"]) {
		_inputVelocity.add(_horizontalRight); // Subtract right vector for left strafe
	}
	if (keys["KeyD"]) {
		_inputVelocity.sub(_horizontalRight); // Add right vector for right strafe
	}

	// Normalize the combined horizontal input velocity if there is movement
	// This ensures consistent speed even when moving diagonally
	if (_inputVelocity.lengthSq() > 0) {
		// Check length squared for efficiency
		_inputVelocity.normalize();
	}

	// 获取当前水平速度
	_currentVelocity.set(charBody.velocity.x, 0, charBody.velocity.z);
	
	// 计算目标速度
	const targetVelocity = _inputVelocity.clone().multiplyScalar(currentSpeed);
	
	// 根据是否在地面上使用不同的加速度和减速度
	// 修改这些值以解决地面移动速度问题
	const acceleration = isGrounded ? 10.0 : 2.0; // 增加地面加速度
	const deceleration = isGrounded ? 5.0 : 1.0; // 增加地面减速度
	
	// 如果有输入，直接设置速度而不是平滑过渡
	if (_inputVelocity.lengthSq() > 0) {
		// 有输入时，更直接地设置目标速度
		if (isGrounded) {
			// 在地面上时，更直接地设置速度
			charBody.velocity.x = targetVelocity.x * 0.9 + charBody.velocity.x * 0.1;
			charBody.velocity.z = targetVelocity.z * 0.9 + charBody.velocity.z * 0.1;
		} else {
			// 在空中时，使用平滑过渡
			charBody.velocity.x += (targetVelocity.x - charBody.velocity.x) * acceleration * deltaTime;
			charBody.velocity.z += (targetVelocity.z - charBody.velocity.z) * acceleration * deltaTime;
		}
	} else {
		// 无输入时，逐渐减速
		charBody.velocity.x *= (1 - deceleration * deltaTime);
		charBody.velocity.z *= (1 - deceleration * deltaTime);
	}
	
	// 限制最大水平速度
	_currentVelocity.set(charBody.velocity.x, 0, charBody.velocity.z);
	if (_currentVelocity.length() > currentSpeed) {
		_currentVelocity.normalize().multiplyScalar(currentSpeed);
		charBody.velocity.x = _currentVelocity.x;
		charBody.velocity.z = _currentVelocity.z;
	}

	// NOTE: charBody.velocity.y is controlled by gravity and the jump function,
	// so we don't modify it here.
}
