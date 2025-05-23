// src/modules/graves.js
import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
// FontLoader is part of the THREE namespace in recent versions,
// but if using an older example structure, it might be separate.
// Assuming it's accessed via THREE.FontLoader based on the original script.

/**
 * Creates the graves and adds them to the scene.
 * Requires a pre-loaded FontLoader instance and the font file path.
 *
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {THREE.FontLoader} fontLoader - An instance of THREE.FontLoader.
 * @param {string} fontPath - The path to the font file (e.g., 'fonts/helvetiker_regular.typeface.json').
 */
export function createGraves(scene, fontLoader, fontPath) {
	if (!scene || !fontLoader || !fontPath) {
		console.error("Missing arguments for createGraves (scene, fontLoader, fontPath)");
		return;
	}

	fontLoader.load(
		fontPath,
		(font) => {
			// --- Graves Group ---
			const graves = new THREE.Group();
			// scene.add(graves); // Add the group to the scene immediately

			// --- Grave Geometry and Material ---
			const graveGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.1); // Use BoxGeometry as in original
			const graveMaterial = new THREE.MeshStandardMaterial({
				color: "#727272",
			});

			// --- Text Material ---
			const textMaterial = new THREE.MeshStandardMaterial({
				color: "#ffffff",
			});

			// --- Create Individual Graves ---
			const numberOfGraves = 50;
			const placementRadiusMin = 3; // Minimum distance from origin (0,0)
			const placementRadiusMax = 7; // Maximum distance from origin (0,0) (half of 14)
			const placementOffsetZ = 20; // Z offset for the graves area
			const graveBaseY = 0.3; // Base Y position for graves

			for (let i = 0; i < numberOfGraves; i++) {
				let x, z;
				// Generate random positions ensuring they are outside the minimum radius
				do {
					// Scale random values to the max radius, then center around 0
					x = (Math.random() - 0.5) * placementRadiusMax * 2;
					z = (Math.random() - 0.5) * placementRadiusMax * 2;
				} while (Math.sqrt(x * x + z * z) < placementRadiusMin);

				// Create the grave mesh
				const grave = new THREE.Mesh(graveGeometry, graveMaterial);
				grave.castShadow = true;

				// Position the grave
				grave.position.set(x, graveBaseY, z + placementOffsetZ);

				// Apply random rotation
				grave.rotation.z = (Math.random() - 0.5) * 0.4;
				grave.rotation.y = (Math.random() - 0.5) * 0.4;

				// Create the "RIP" text geometry
				const textGeometry = new TextGeometry("RIP", {
					font: font,
					size: 0.2,
					height: 0.02,
					curveSegments: 4,
					bevelEnabled: true,
					bevelThickness: 0.02,
					bevelSize: 0.01,
					bevelOffset: 0,
					bevelSegments: 3,
				});
				textGeometry.computeBoundingBox();
				// Center the text geometry based on its bounding box
				textGeometry.center(); // Simpler centering method

				// Create the text mesh
				const text = new THREE.Mesh(textGeometry, textMaterial);
				// Position the text slightly in front of the grave
				text.position.z = 0.06; // Relative to the grave's local Z axis
				text.castShadow = true; // Text can also cast shadows if needed
				grave.add(text); // Add text as a child of the grave

				// Add the completed grave to the graves group
				graves.add(grave);
			}
			console.log(`${numberOfGraves} graves created.`);
		},
		// onProgress callback (optional)
		undefined,
		// onError callback
		(error) => {
			console.error("An error happened during font loading for graves:", error);
		}
	);
}
