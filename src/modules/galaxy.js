// src/modules/galaxy.js
import * as THREE from "three";
// Import shaders using raw-loader (configured in webpack)
import galaxyVertexShader from "../shaders/galaxy/vertex.glsl";
import galaxyFragmentShader from "../shaders/galaxy/fragment.glsl";

// --- Module State ---
let geometry = null;
let material = null;
let points = null; // The THREE.Points object
let rendererRef = null; // Reference to the main renderer

const parameters = {
	count: 200000,
	size: 0.005,
	radius: 5,
	branches: 3,
	spin: 1, // Spin is used implicitly in shader time uniform
	randomness: 0.2,
	randomnessPower: 3,
	insideColor: "#ff6030",
	outsideColor: "#1b3984",
};

// --- Exported Functions ---

/**
 * Initializes the galaxy module with a reference to the renderer.
 * @param {THREE.WebGLRenderer} renderer - The main WebGL renderer instance.
 */
export function initGalaxy(renderer) {
	if (!renderer) {
		console.error("Renderer must be provided to initGalaxy.");
		return;
	}
	rendererRef = renderer;
	console.log("Galaxy module initialized.");
}

/**
 * Generates or regenerates the galaxy points object.
 * Adds the points object to the scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 */
export function generateGalaxy(scene) {
	if (!scene) {
		console.error("Scene must be provided to generateGalaxy.");
		return;
	}
	if (!rendererRef) {
		console.error("Galaxy module not initialized. Call initGalaxy() first.");
		return;
	}

	// --- Cleanup previous galaxy ---
	if (points !== null) {
		if (geometry) geometry.dispose();
		if (material) material.dispose();
		scene.remove(points);
		geometry = null;
		material = null;
		points = null;
		console.log("Previous galaxy disposed.");
	}

	// --- Geometry ---
	geometry = new THREE.BufferGeometry();

	const positions = new Float32Array(parameters.count * 3);
	const randomness = new Float32Array(parameters.count * 3); // Renamed from aRandomness for clarity
	const colors = new Float32Array(parameters.count * 3);
	const scales = new Float32Array(parameters.count * 1); // Renamed from aScale

	const insideColor = new THREE.Color(parameters.insideColor);
	const outsideColor = new THREE.Color(parameters.outsideColor);

	for (let i = 0; i < parameters.count; i++) {
		const i3 = i * 3;

		// Position
		const radius = Math.random() * parameters.radius;
		const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

		// Calculate random offsets
		const randomX =
			Math.pow(Math.random(), parameters.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			parameters.randomness *
			radius;
		const randomY =
			Math.pow(Math.random(), parameters.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			parameters.randomness *
			radius;
		const randomZ =
			Math.pow(Math.random(), parameters.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			parameters.randomness *
			radius;

		// Base position on branch + radius
		positions[i3] = Math.cos(branchAngle) * radius;
		// positions[i3 + 1] = 0; // Base Y position (randomness adds Y variation) // <--- REMOVE THIS LINE
		positions[i3 + 1] = 1; // Set base Y position directly in the attribute // <--- ADD THIS LINE (like working code)
		positions[i3 + 2] = Math.sin(branchAngle) * radius;

		// Store randomness attribute
		randomness[i3] = randomX;
		randomness[i3 + 1] = randomY;
		randomness[i3 + 2] = randomZ;

		// Color (lerp based on distance from center)
		const mixedColor = insideColor.clone();
		mixedColor.lerp(outsideColor, radius / parameters.radius);
		colors[i3] = mixedColor.r;
		colors[i3 + 1] = mixedColor.g;
		colors[i3 + 2] = mixedColor.b;

		// Scale (random scale for each point)
		scales[i] = Math.random();
	}

	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 3)); // Pass randomness to shader
	geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3)); // Pass color to shader
	geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1)); // Pass scale to shader

	// --- Material ---
	material = new THREE.ShaderMaterial({
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		vertexColors: true, // Use colors defined in geometry attributes
		uniforms: {
			uTime: { value: 0 },
			uSize: { value: 30 * rendererRef.getPixelRatio() }, // Keep the corrected uSize
		},
		vertexShader: galaxyVertexShader, // From imported file
		fragmentShader: galaxyFragmentShader, // From imported file
	});

	// --- Points ---
	points = new THREE.Points(geometry, material);
	// points.position.y = 1; // Set base Y position for the entire galaxy system // <--- REMOVE THIS LINE
	scene.add(points);
	console.log("Galaxy generated and added to scene.");
}

/**
 * Updates the galaxy's time uniform for animation.
 * Should be called in the main animation loop.
 * @param {number} elapsedTime - The total elapsed time since the start.
 */
export function updateGalaxy(elapsedTime) {
	if (material) {
		// Check if material exists
		material.uniforms.uTime.value = elapsedTime;
	}
}

/**
 * Updates a specific galaxy parameter and regenerates the galaxy if needed.
 * Useful for connecting to a GUI.
 * @param {string} key - The parameter name (e.g., 'count', 'radius').
 * @param {*} value - The new value for the parameter.
 * @param {THREE.Scene} scene - The scene to regenerate the galaxy in.
 */
export function updateGalaxyParameter(key, value, scene) {
	if (parameters.hasOwnProperty(key)) {
		parameters[key] = value;
		// Regenerate the galaxy if a parameter affecting geometry/color changes
		// if (key !== "size") { // <--- REMOVE THIS LINE (Size now doesn't directly affect uSize uniform here)
		if (key !== "size" && key !== "spin") { // Regenerate unless it's size or spin (spin only affects uTime implicitly) // <--- MODIFY THIS LINE
			// Size only affects the uniform, no need to regen geometry // <--- This comment is now slightly inaccurate, size param is unused here
			generateGalaxy(scene);
		// } else if (material && rendererRef) { // <--- REMOVE THIS BLOCK
			// Update size uniform directly if only size changes
			// material.uniforms.uSize.value = parameters.size * 30 * rendererRef.getPixelRatio();
		}
	} else {
		console.warn(`Galaxy parameter "${key}" does not exist.`);
	}
}

/**
 * Gets the current galaxy parameters.
 * Useful for initializing a GUI.
 * @returns {object} The current parameters object.
 */
export function getGalaxyParameters() {
	return parameters;
}
