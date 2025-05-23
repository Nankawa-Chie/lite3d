// src/modules/lighting.js
import * as THREE from "three";

// --- Private Variables ---
let ghost1, ghost2, ghost3; // Store ghost lights locally

// --- Exported Functions ---

/**
 * Sets up the main scene lighting (ambient, directional, door light).
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {THREE.Group} house - The house group to attach the door light to.
 */
export function setupLighting(scene, house) {
	// Ambient light (暖色调)
	const ambientLight = new THREE.AmbientLight("#FFDAB9", 0.7); // 稍微降低环境光强度，让平行光更突出
	scene.add(ambientLight);

	// Directional light (冷色调) - Moonlight
	const moonLight = new THREE.DirectionalLight("#b9d5ff", 0.8); // 增强月光强度
	moonLight.castShadow = true;
	moonLight.shadow.mapSize.width = 1024; // 提高阴影贴图分辨率
	moonLight.shadow.mapSize.height = 1024; // 提高阴影贴图分辨率
	moonLight.shadow.camera.near = 0.5; // 调整阴影相机近平面
	moonLight.shadow.camera.far = 50;    // 增大阴影相机远平面，覆盖更大范围
	moonLight.shadow.camera.left = -30;  // 调整阴影相机视锥体大小
	moonLight.shadow.camera.right = 30;
	moonLight.shadow.camera.top = 30;
	moonLight.shadow.camera.bottom = -30;
	moonLight.shadow.bias = -0.001; // 调整阴影偏移，减少条纹现象
	moonLight.position.set(10, 15, 5); // 调整光源位置，使其更像月光
	scene.add(moonLight);

	// Optional: Light helpers (Keep commented out unless debugging)
	// const moonLightHelper = new THREE.DirectionalLightHelper(moonLight);
	// scene.add(moonLightHelper);
	// const shadowHelper = new THREE.CameraHelper(moonLight.shadow.camera);
	// scene.add(shadowHelper);

	// Door light
	const doorLight = new THREE.PointLight("#ff7d46", 1.5, 10); // 增强门灯强度和范围
	doorLight.castShadow = true;
	doorLight.shadow.mapSize.width = 512; // 提高门灯阴影贴图分辨率
	doorLight.shadow.mapSize.height = 512;
	doorLight.shadow.camera.near = 0.1;
	doorLight.shadow.camera.far = 10;
	doorLight.shadow.bias = -0.005; // 调整阴影偏移
	doorLight.position.set(0, 2.2, 2.7); // 调整门灯位置，使其更贴近门
	house.add(doorLight); // Add to house group
}

/**
 * Sets up the ghost point lights.
 * @param {THREE.Scene} scene - The main Three.js scene.
 */
export function setupGhostLights(scene) {
	ghost1 = new THREE.PointLight("#ff00ff", 3, 3);
	ghost1.castShadow = true;
	ghost1.shadow.mapSize.width = 256;
	ghost1.shadow.mapSize.height = 256;
	ghost1.shadow.camera.far = 7;
	scene.add(ghost1);

	ghost2 = new THREE.PointLight("#00ffff", 3, 3);
	ghost2.castShadow = true;
	ghost2.shadow.mapSize.width = 256;
	ghost2.shadow.mapSize.height = 256;
	ghost2.shadow.camera.far = 7;
	scene.add(ghost2);

	ghost3 = new THREE.PointLight("#ff7800", 3, 3);
	ghost3.castShadow = true;
	ghost3.shadow.mapSize.width = 256;
	ghost3.shadow.mapSize.height = 256;
	ghost3.shadow.camera.far = 7;
	scene.add(ghost3);

	// No need to return the lights if the update function accesses them directly
	// return { ghost1, ghost2, ghost3 };
}

/**
 * Updates the positions of the ghost lights based on elapsed time.
 * Should be called within the main animation loop.
 * @param {number} elapsedTime - The total elapsed time since the start.
 */
export function updateGhostLights(elapsedTime) {
	if (!ghost1 || !ghost2 || !ghost3) return; // Ensure lights are initialized

	const ghost1Angle = elapsedTime * 0.5;
	ghost1.position.x = Math.cos(ghost1Angle) * 4;
	ghost1.position.z = Math.sin(ghost1Angle) * 4;
	ghost1.position.y = Math.sin(elapsedTime * 3);

	const ghost2Angle = -elapsedTime * 0.32;
	ghost2.position.x = Math.cos(ghost2Angle) * 5;
	ghost2.position.z = Math.sin(ghost2Angle) * 5;
	ghost2.position.y = Math.sin(elapsedTime * 4) + Math.sin(elapsedTime * 2.5);

	const ghost3Angle = -elapsedTime * 0.18;
	ghost3.position.x = Math.cos(ghost3Angle) * (7 + Math.sin(elapsedTime * 0.32));
	ghost3.position.z = Math.sin(ghost3Angle) * (7 + Math.sin(elapsedTime * 0.5));
	ghost3.position.y = Math.sin(elapsedTime * 4) + Math.sin(elapsedTime * 2.5);
}
