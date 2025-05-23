// src/modules/terrain.js
import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";

// --- Module State ---
const terrainMeshes = {}; // Stores currently active terrain chunks { 'i_j': mesh }
let _dynamicTerrainTexture = null; // Texture for dynamic chunks
let _noiseSettings = {
	enabled: true, // Whether to generate noise height
	heightScale: 5, // Vertical scale of the noise
};
const _terrainSize = 100; // Width and height of each terrain chunk
const _terrainSegments = 32; // Segments for noise terrain geometry (adjust for performance/detail)
const _viewDistanceChunks = 3; // Render distance in chunks (e.g., 3 = 7x7 grid centered on player)
const perlin = new ImprovedNoise(); // Noise generator instance

// --- Private Helper Functions ---

/**
 * Creates terrain geometry with optional Perlin noise height variation.
 * Based on the user-provided function, adapted to return geometry.
 * @param {number} width
 * @param {number} height
 * @param {number} widthSegments
 * @param {number} heightSegments
 * @param {boolean} applyNoise - Whether to apply Perlin noise height.
 * @param {number} heightScale - Vertical scale for noise.
 * @returns {THREE.BufferGeometry}
 */
function _createTerrainGeometry(width, height, widthSegments, heightSegments, applyNoise, heightScale) {
	const geometry = new THREE.BufferGeometry();
	const vertexCount = (widthSegments + 1) * (heightSegments + 1);
	const indexCount = widthSegments * heightSegments * 6;

	const vertices = new Float32Array(vertexCount * 3);
	const indices = new (vertexCount > 65535 ? Uint32Array : Uint16Array)(indexCount);
	const uvs = new Float32Array(vertexCount * 2);

	let vertexIndex = 0;
	let uvIndex = 0;
	for (let i = 0; i <= heightSegments; i++) {
		const yPos = (i / heightSegments - 0.5) * height; // Centered
		for (let j = 0; j <= widthSegments; j++) {
			const xPos = (j / widthSegments - 0.5) * width; // Centered

			vertices[vertexIndex++] = xPos;
			vertices[vertexIndex++] = 0; // Initial height is 0
			vertices[vertexIndex++] = yPos;

			uvs[uvIndex++] = j / widthSegments;
			uvs[uvIndex++] = i / heightSegments;
		}
	}

	let indexIndex = 0;
	for (let i = 0; i < heightSegments; i++) {
		for (let j = 0; j < widthSegments; j++) {
			const a = i * (widthSegments + 1) + j;
			const b = a + 1;
			const c = (i + 1) * (widthSegments + 1) + j;
			const d = c + 1;

			// Swapped order for triangle 1
			indices[indexIndex++] = a;
			indices[indexIndex++] = c;
			indices[indexIndex++] = b;
			// Swapped order for triangle 2
			indices[indexIndex++] = b;
			indices[indexIndex++] = c;
			indices[indexIndex++] = d;
		}
	}

	geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
	geometry.setIndex(new THREE.BufferAttribute(indices, 1));
	geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

	if (applyNoise) {
		const noiseZ = Math.random() * 100; // Random offset for variation per chunk
		const positionAttribute = geometry.getAttribute("position");

		for (let i = 0; i < positionAttribute.count; i++) {
			const x = positionAttribute.getX(i);
			const z = positionAttribute.getZ(i); // Use Z from geometry, not Y

			let noiseValue = 0;
			let frequency = 0.02; // Adjusted frequency for visual scale
			let amplitude = heightScale;
			const persistence = 0.5;
			const lacunarity = 2.0;
			const octaves = 4;

			for (let k = 0; k < octaves; k++) {
				noiseValue += perlin.noise(x * frequency + noiseZ, z * frequency + noiseZ, noiseZ) * amplitude;
				frequency *= lacunarity;
				amplitude *= persistence;
			}

			// Simple falloff towards edges to help stitching (optional)
			const edgeFalloff = 0.1;
			const maxDist = width / 2;
			const dist = Math.sqrt(x * x + z * z);
			//const falloff = Math.smoothstep(maxDist, maxDist * (1 - edgeFalloff), dist);

			//positionAttribute.setY(i, noiseValue * falloff);
			// --- 修改后的代码 (选项 2 - 线性衰减) ---
			const falloffStart = maxDist * (1 - edgeFalloff); // Distance where falloff begins
			let falloff = 1.0; // Assume full height initially
			if (dist > falloffStart) {
				// Calculate linear interpolation from 1 down to 0 between falloffStart and maxDist
				falloff = 1.0 - (dist - falloffStart) / (maxDist - falloffStart);
				falloff = Math.max(0, falloff); // Ensure falloff doesn't go below 0
			}
			positionAttribute.setY(i, noiseValue * falloff);
		}
		positionAttribute.needsUpdate = true;
	}

	geometry.computeVertexNormals(); // Compute normals after height modification
	return geometry;
}

// --- Exported Functions ---

/**
 * Creates the static central floor plane.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {object} textures - Object containing texture references, expecting grassColor, grassAO, grassNormal, grassRoughness.
 */
export function createStaticFloor(scene, textures) {
	if (!scene || !textures?.grassColor) {
		console.error("Scene and grass textures must be provided for static floor.");
		return null;
	}

	const floorGeometry = new THREE.PlaneGeometry(100, 100); // Original size
	// Need UV2 for AO map
	floorGeometry.setAttribute("uv2", new THREE.Float32BufferAttribute(floorGeometry.attributes.uv.array, 2));

	// Ensure textures repeat
	const repeatValue = 8; // Original repeat value
	textures.grassColor.repeat.set(repeatValue, repeatValue);
	textures.grassAO.repeat.set(repeatValue, repeatValue);
	textures.grassNormal.repeat.set(repeatValue, repeatValue);
	textures.grassRoughness.repeat.set(repeatValue, repeatValue);

	textures.grassColor.wrapS = textures.grassColor.wrapT = THREE.RepeatWrapping;
	textures.grassAO.wrapS = textures.grassAO.wrapT = THREE.RepeatWrapping;
	textures.grassNormal.wrapS = textures.grassNormal.wrapT = THREE.RepeatWrapping;
	textures.grassRoughness.wrapS = textures.grassRoughness.wrapT = THREE.RepeatWrapping;

	const floorMaterial = new THREE.MeshStandardMaterial({
		map: textures.grassColor,
		aoMap: textures.grassAO,
		normalMap: textures.grassNormal,
		roughnessMap: textures.grassRoughness,
	});

	const floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.castShadow = false; // Typically, a large flat ground plane doesn't need to cast shadows on itself or other large objects from typical light angles
	floor.receiveShadow = true;
	floor.rotation.x = -Math.PI * 0.5; // Rotate to be horizontal
	floor.position.y = 0.01; // Slightly above 0 to avoid z-fighting if physics ground is exactly at 0
	scene.add(floor);

	console.log("Static floor created.");
	return floor;
}

/**
 * Initializes the dynamic terrain system state.
 * @param {THREE.Texture} dynamicTexture - Texture to use for dynamic chunks.
 * @param {boolean} initialNoiseEnabled - Start with noise generation enabled?
 * @param {number} initialHeightScale - Initial noise height scale.
 */
export function initDynamicTerrain(dynamicTexture, initialNoiseEnabled = true, initialHeightScale = 5) {
	if (!dynamicTexture) {
		console.error("Dynamic terrain texture must be provided.");
		return;
	}
	_dynamicTerrainTexture = dynamicTexture;
	_dynamicTerrainTexture.wrapS = THREE.RepeatWrapping;
	_dynamicTerrainTexture.wrapT = THREE.RepeatWrapping;
	// _dynamicTerrainTexture.repeat.set(1, 1); // Adjust repeat per chunk if needed

	_noiseSettings.enabled = initialNoiseEnabled;
	_noiseSettings.heightScale = initialHeightScale;
	console.log("Dynamic terrain system initialized.");
}

/**
 * Updates the settings for noise generation on dynamic terrain.
 * @param {boolean} enabled - Enable/disable noise height.
 * @param {number} scale - Set the vertical scale for noise.
 */
export function updateTerrainSettings(enabled, scale) {
	const changed = _noiseSettings.enabled !== enabled || _noiseSettings.heightScale !== scale;
	_noiseSettings.enabled = enabled;
	_noiseSettings.heightScale = scale;

	// If settings changed, might need to regenerate existing chunks (complex)
	// For simplicity now, only new chunks will use new settings.
	// Or, could force removal of all chunks to regenerate on next update.
	if (changed) {
		console.log("Terrain settings updated. Regeneration might be needed for existing chunks.");
		// Consider clearing terrainMeshes here if full regeneration is desired on change
		// for (const key in terrainMeshes) {
		//     scene.remove(terrainMeshes[key]);
		//     delete terrainMeshes[key];
		// }
	}
}

/**
 * Updates the dynamic terrain chunks based on camera position.
 * Creates new chunks and removes old ones outside the view distance.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {THREE.Vector3} cameraPosition - Current camera world position.
 */
export function updateDynamicTerrain(scene, cameraPosition) {
	if (!_dynamicTerrainTexture || !scene || !cameraPosition) {
		// console.warn("Dynamic terrain not initialized or missing args.");
		return;
	}

	const camX = Math.floor(cameraPosition.x / _terrainSize);
	const camZ = Math.floor(cameraPosition.z / _terrainSize);
	const vd = _viewDistanceChunks;

	const currentChunks = {}; // Keep track of chunks that should be visible

	// Create/update terrain chunks in range
	for (let i = camX - vd; i <= camX + vd; i++) {
		for (let j = camZ - vd; j <= camZ + vd; j++) {
			// --- ADD THIS CHECK ---
			// Skip the central chunk (0, 0) where the static floor is
			if ((i === 0, 1 && j === 0)) {
				continue; // Go to the next iteration of the inner loop
			}
			// --- END OF CHECK ---

			const key = `${i}_${j}`;
			currentChunks[key] = true; // Mark this chunk as needed

			// Skip the very central chunk (0_0) if the static floor exists
			// and dynamic terrain should surround it. Adjust condition if needed.
			// if (i === 0 && j === 0) continue;

			if (!(key in terrainMeshes)) {
				// --- Create New Chunk ---
				const geometry = _createTerrainGeometry(
					_terrainSize,
					_terrainSize,
					_terrainSegments,
					_terrainSegments,
					_noiseSettings.enabled,
					_noiseSettings.heightScale
				);

				const material = new THREE.MeshStandardMaterial({
					map: _dynamicTerrainTexture,
					// side: THREE.DoubleSide // If terrain has steep slopes or underside visible
				});

				const terrainChunk = new THREE.Mesh(geometry, material);
				terrainChunk.position.set(i * _terrainSize, 0, j * _terrainSize);
				// Rotation is handled by the geometry creation being XZ plane
				// terrainChunk.rotation.x = -Math.PI / 2; // Don't rotate mesh if geometry is XZ

				terrainChunk.receiveShadow = true;
				terrainChunk.castShadow = true; // Noise terrain might cast shadows, ensure this is true

				scene.add(terrainChunk);
				terrainMeshes[key] = terrainChunk; // Store reference
			}
			// Make sure it's visible (if previously hidden)
			if (terrainMeshes[key]) terrainMeshes[key].visible = true;
		}
	}

	// Remove chunks outside the view range
	for (const key in terrainMeshes) {
		if (!currentChunks[key]) {
			scene.remove(terrainMeshes[key]);
			// Optional: Dispose geometry and material if memory is critical
			// terrainMeshes[key].geometry.dispose();
			// terrainMeshes[key].material.dispose();
			delete terrainMeshes[key];
		}
	}
}

/**
 * Toggles the visibility of all managed dynamic terrain chunks.
 * @param {boolean} visible - Set visibility state.
 */
export function setDynamicTerrainVisibility(visible) {
	for (const key in terrainMeshes) {
		if (terrainMeshes[key]) {
			terrainMeshes[key].visible = visible;
		}
	}
}
