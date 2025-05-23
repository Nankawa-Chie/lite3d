// src/modules/planets.js
import * as THREE from "three";
import * as CANNON from "cannon-es";

// --- Private Variables ---
let _textureLoader = null; // Store texture loader reference
const planets = []; // Array to hold created planet objects { mesh, body, name }
const planetData = [
	// Configuration for each planet
	// Format: name, radius, textureFile, options (optional: emissive, normal, specular, atmosphere, ring, physicsMass)
	{
		name: "Sun",
		radius: 109 ,
		textureFile: "8k_sun.jpg",
		options: { emissive: 0xffff00, emissiveIntensity: 0.3, physicsMass: 0 /* Static */ },
	},
	{ name: "Mercury", radius: 0.383, textureFile: "8k_mercury.jpg" },
	{
		name: "Venus",
		radius: 0.949,
		textureFile: "8k_venus_surface.jpg",
		options: { atmosphere: "4k_venus_atmosphere.jpg" },
	},
	{
		name: "Earth",
		radius: 1,
		textureFile: "8k_earth_daymap.jpg",
		options: {
			normal: "8k_earth_normal_map.png",
			specular: "8k_earth_specular_map.png",
			atmosphere: "8k_earth_clouds.jpg",
		},
	},
	{ name: "Moon", radius: 0.27, textureFile: "8k_moon.jpg" },
	{ name: "Mars", radius: 0.532, textureFile: "8k_mars.jpg" },
	{ name: "Jupiter", radius: 11.209 * 0.2, textureFile: "8k_jupiter.jpg" }, // Scaled down jupiter/saturn
	{ name: "Saturn", radius: 9.449 * 0.2, textureFile: "8k_saturn.jpg", options: { ring: "8k_saturn_ring_alpha.png" } },
	{ name: "Uranus", radius: 4.007, textureFile: "2k_uranus.jpg" },
	{ name: "Neptune", radius: 3.883, textureFile: "2k_neptune.jpg" },
	{ name: "Eris", radius: 0.18, textureFile: "4k_eris_fictional.jpg" },
];
const textureBasePath = "textures/SolarSystem/"; // Base path for solar system textures

// --- Helper Function ---

/**
 * Creates a single planet (mesh and optional physics body).
 * @param {object} data - Planet configuration data from planetData array.
 * @param {CANNON.World} [world] - Optional physics world to add the body to.
 * @returns {object|null} Object { mesh, body, name } or null if texture loader missing.
 */
function _createPlanet(data, world) {
	if (!_textureLoader) {
		console.error("TextureLoader not initialized for planets.");
		return null;
	}

	const options = data.options || {};

	// Material setup
	const materialProperties = {};
	materialProperties.map = _textureLoader.load(textureBasePath + data.textureFile);
	if (options.emissive) materialProperties.emissive = new THREE.Color(options.emissive);
	if (options.emissiveIntensity) materialProperties.emissiveIntensity = options.emissiveIntensity;
	if (options.normal) materialProperties.normalMap = _textureLoader.load(textureBasePath + options.normal);
	if (options.specular) materialProperties.specularMap = _textureLoader.load(textureBasePath + options.specular);

	const material = new THREE.MeshPhongMaterial(materialProperties); // Phong for lighting interactions

	// Geometry
	const geometry = new THREE.SphereGeometry(data.radius, 64, 64); // Increased segments for better quality

	// Mesh
	const mesh = new THREE.Mesh(geometry, material);
	mesh.name = data.name; // Assign name for identification
	mesh.castShadow = true;
	mesh.receiveShadow = true;

	// Atmosphere (if applicable)
	if (options.atmosphere) {
		const atmosphereMaterial = new THREE.MeshPhongMaterial({
			map: _textureLoader.load(textureBasePath + options.atmosphere),
			transparent: true,
			opacity: data.name === "Venus" ? 0.6 : 0.4, // Different opacity for Venus/Earth
			depthWrite: false, // Render clouds after solid planet
			blending: THREE.AdditiveBlending, // Nice effect for clouds
		});
		const atmosphereGeometry = new THREE.SphereGeometry(data.radius * 1.02, 64, 64); // Slightly larger
		const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
		atmosphereMesh.name = data.name + " Atmosphere";
		mesh.add(atmosphereMesh); // Add as child
	}

	// Ring (if applicable - Saturn)
	if (options.ring) {
		const ringMaterial = new THREE.MeshPhongMaterial({
			map: _textureLoader.load(textureBasePath + options.ring),
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.7,
			depthWrite: false,
		});
		const ringGeometry = new THREE.RingGeometry(data.radius * 1.2, data.radius * 2.5, 64); // Adjust inner/outer radii
		const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
		ringMesh.name = data.name + " Ring";
		ringMesh.rotation.x = -0.5 * Math.PI; // Rotate flat
		mesh.add(ringMesh); // Add as child
	}

	// Physics Body (Optional)
	let body = null;
	if (world) {
		const shape = new CANNON.Sphere(data.radius);
		const mass = options.physicsMass !== undefined ? options.physicsMass : 1; // Default mass 1, 0 for sun
		body = new CANNON.Body({
			mass: mass,
			shape: shape,
			// material: new CANNON.Material(...) // Optional
		});
		// Initial position will be set later
		world.addBody(body);
	}

	return { mesh, body, name: data.name };
}

// --- Exported Functions ---

/**
 * Initializes the planet module with a TextureLoader instance.
 * @param {THREE.TextureLoader} textureLoader - The Three.js TextureLoader.
 */
export function initPlanets(textureLoader) {
	_textureLoader = textureLoader;
	console.log("Planet module initialized.");
}

/**
 * Creates all planets defined in planetData and adds them to the scene.
 * Optionally creates physics bodies and adds them to the world.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {CANNON.World} [world] - Optional physics world for creating bodies.
 * @returns {Array<object>} Array of created planet objects { mesh, body, name }.
 */
export function createAllPlanets(scene, world) {
	if (!_textureLoader) {
		console.error("Planet module not initialized. Call initPlanets() first.");
		return [];
	}

	// Clear previous planets if recreating
	planets.forEach((p) => {
		if (p.mesh) scene.remove(p.mesh);
		if (p.body && world) world.removeBody(p.body);
	});
	planets.length = 0; // Clear the array

	planetData.forEach((data) => {
		const planet = _createPlanet(data, world);
		if (planet) {
			scene.add(planet.mesh);
			planets.push(planet);
		}
	});

	console.log(`Created ${planets.length} planets.`);
	return planets; // Return the array of created objects
}

/**
 * Randomly positions the created planets (both mesh and body) within given bounds.
 * @param {number} xzMin - Minimum X/Z coordinate.
 * @param {number} xzMax - Maximum X/Z coordinate.
 * @param {number} yMin - Minimum Y coordinate.
 * @param {number} yMax - Maximum Y coordinate.
 * @param {string[]} [exclude=[]] - Array of planet names to exclude from random positioning (e.g., ['Sun']).
 */
export function randomizePlanetPositions(xzMin, xzMax, yMin, yMax, exclude = ["Sun", "Earth"]) {
	planets.forEach((planet) => {
		if (exclude.includes(planet.name)) {
			// Set fixed positions for excluded planets if desired
			if (planet.name === "Sun") {
				planet.mesh.position.set(0, 150, -150); // Example fixed pos
			} else if (planet.name === "Earth") {
				planet.mesh.position.set(-100, 5, 0); // Original earth pos
			}
			// Update physics body if it exists
			if (planet.body) {
				planet.body.position.copy(planet.mesh.position);
				planet.body.velocity.set(0, 0, 0); // Reset velocity
				planet.body.angularVelocity.set(0, 0, 0);
			}
			return; // Skip random positioning
		}

		const x = Math.random() * (xzMax - xzMin) + xzMin;
		const z = Math.random() * (xzMax - xzMin) + xzMin;
		const y = Math.random() * (yMax - yMin) + yMin;

		planet.mesh.position.set(x, y, z);
		if (planet.body) {
			planet.body.position.set(x, y, z);
			// Reset velocity when randomizing position
			planet.body.velocity.set(0, 0, 0);
			planet.body.angularVelocity.set(0, 0, 0);
		}
	});
	console.log("Randomized planet positions (excluding:", exclude, ")");
}

/**
 * Updates the visual mesh positions/rotations of planets to match their physics bodies.
 * Call this in the animation loop if planets have physics simulation.
 */
export function updatePlanetPhysicsSync() {
	planets.forEach((planet) => {
		if (planet.mesh && planet.body && planet.body.mass > 0) {
			// Only sync dynamic bodies
			planet.mesh.position.copy(planet.body.position);
			planet.mesh.quaternion.copy(planet.body.quaternion);
		}
	});
}
