// src/modules/skybox.js
import * as THREE from "three";

// --- Module State ---
let skyboxMesh = null;
let sceneRef = null;
let textureLoaderRef = null; // Store the texture loader instance

// Video-specific state
let videoElement = null;
let videoTexture = null;
let currentTextureType = "image"; // 'image', 'gif', or 'video'

const config = {
	enabled: true,
	followCamera: true,
	texturePath: "textures/SolarSystem/8k_stars_milky_way.jpg", // Default static texture
	radius: 400, // Default radius
};

// --- Private Helper: Dispose current texture/video ---
function _disposeCurrentMap() {
	if (!skyboxMesh || !skyboxMesh.material) return;

	const currentMap = skyboxMesh.material.map;
	if (currentMap) {
		// Check if it's a VideoTexture by checking for a video element source
		if (currentMap.image instanceof HTMLVideoElement) {
			const video = currentMap.image;
			video.pause();
			video.removeAttribute("src"); // Important to release file handle
			video.load(); // Request load (effectively clears buffer)
			console.log("Cleaned up previous video element for skybox.");
			// videoTexture variable might be same as currentMap, nullify separately if needed
			videoTexture = null;
			videoElement = null; // Ensure video element ref is cleared
		}
		currentMap.dispose(); // Dispose the texture object itself
		console.log("Disposed previous skybox map.");
	}

	skyboxMesh.material.map = null; // Remove map from material
	currentTextureType = "image"; // Reset type
}

// --- Exported Functions ---

/**
 * Initializes and creates the skybox.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {THREE.TextureLoader} textureLoader - The TextureLoader instance.
 * @param {object} [initialConfig] - Optional initial configuration overrides.
 */
export function initSkybox(scene, textureLoader, initialConfig) {
	if (!scene || !textureLoader) {
		console.error("Scene and TextureLoader required for initSkybox.");
		return;
	}
	sceneRef = scene;
	textureLoaderRef = textureLoader; // Store loader reference

	// Merge initial config
	if (initialConfig) {
		Object.assign(config, initialConfig);
	}

	// Create Material (Map will be loaded later by updateSkyboxTexture)
	const skyboxMaterial = new THREE.MeshBasicMaterial({
		side: THREE.BackSide,
		map: null, // Start with no map
		// Force shader recompilation on map change might help sometimes
		// needsUpdate: true
	});

	// Create Geometry
	const skyboxGeometry = new THREE.SphereGeometry(config.radius, 64, 64); // Use high segments

	// Create Mesh
	skyboxMesh = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
	skyboxMesh.name = "Skybox";
	skyboxMesh.visible = config.enabled; // Set initial visibility

	// Add to Scene
	sceneRef.add(skyboxMesh);

	// Load initial texture specified in config
	updateSkyboxTexture(config.texturePath, "image"); // Assume initial is image

	console.log("Skybox initialized.");
}

/**
 * Updates the skybox texture based on a path/URL or Data URL.
 * Handles images, GIFs (static), and videos.
 * @param {string} source - Path, URL, or Data URL for the texture.
 * @param {string} fileTypeHint - 'image', 'gif', or 'video'. Helps determine loading method.
 */
export function updateSkyboxTexture(source, fileTypeHint) {
	if (!skyboxMesh || !skyboxMesh.material || !textureLoaderRef) {
		console.error("Skybox not ready or TextureLoader missing for texture update.");
		return;
	}

	// 1. Dispose the previous texture/video
	_disposeCurrentMap();

	console.log(`Updating skybox texture. Type hint: ${fileTypeHint}, Source: ${source.substring(0, 100)}...`);

	// 2. Load new texture based on type
	if (fileTypeHint === "video") {
		currentTextureType = "video";

		// Create video element dynamically
		videoElement = document.createElement("video");
		videoElement.setAttribute("playsinline", ""); // For iOS
		videoElement.autoplay = true;
		videoElement.muted = true; // Mute needed for most autoplay scenarios
		videoElement.loop = true;
		videoElement.src = source;
		videoElement.crossOrigin = "anonymous"; // Often needed

		videoElement.oncanplay = () => {
			// Wait until it *can* play
			videoElement
				.play()
				.then(() => {
					console.log("Video skybox started playing.");
				})
				.catch((e) => {
					console.warn("Video skybox autoplay failed:", e);
				});
		};
		videoElement.onerror = (e) => {
			console.error("Error loading video source for skybox:", e, videoElement.error);
			_disposeCurrentMap(); // Clean up on error
		};

		// Create VideoTexture AFTER setting up the video element
		videoTexture = new THREE.VideoTexture(videoElement);
		videoTexture.minFilter = THREE.LinearFilter;
		videoTexture.magFilter = THREE.LinearFilter;
		videoTexture.format = THREE.RGBAFormat; // Use RGBA for video

		skyboxMesh.material.map = videoTexture;
		skyboxMesh.material.needsUpdate = true; // Important!
	} else {
		// Treat as image (JPG, PNG, static GIF)
		currentTextureType = "image";
		textureLoaderRef.load(
			source,
			(texture) => {
				// Ensure skybox hasn't been disposed or type changed during load
				if (skyboxMesh && skyboxMesh.material && currentTextureType === "image") {
					// texture.mapping = THREE.EquirectangularReflectionMapping; // Set mapping IF source is equirectangular
					skyboxMesh.material.map = texture;
					skyboxMesh.material.needsUpdate = true; // Important!
					console.log("Image/GIF texture loaded for skybox.");
				} else {
					console.log("Skybox state changed during image load, disposing texture.");
					texture.dispose();
				}
			},
			undefined, // onProgress
			(error) => {
				console.error("Failed to load skybox image/gif texture:", error);
				if (skyboxMesh && skyboxMesh.material) {
					skyboxMesh.material.map = null; // Clear map on error
					skyboxMesh.material.needsUpdate = true;
				}
			}
		);
	}
}

/**
 * Updates the skybox visibility, position, and video texture state.
 * Call this in the animation loop.
 * @param {THREE.Vector3} cameraPosition - The current world position of the main camera.
 */
export function updateSkybox(cameraPosition) {
	if (!skyboxMesh) return;

	// Update visibility based on config
	if (config.enabled !== skyboxMesh.visible) {
		skyboxMesh.visible = config.enabled;
	}
	if (!config.enabled) return;

	// Update position if following camera
	if (config.followCamera && cameraPosition) {
		skyboxMesh.position.copy(cameraPosition);
	}

	// Update video texture if it exists and is playing
	// Check readyState >= 2 (HAVE_CURRENT_DATA) to avoid errors before video data is available
	if (
		currentTextureType === "video" &&
		videoTexture &&
		videoElement &&
		videoElement.readyState >= 2 &&
		!videoElement.paused
	) {
		// videoTexture automatically updates, no need for needsUpdate = true here
		// unless specific render targets or effects require it.
	}
}

/**
 * Updates a specific skybox configuration parameter.
 * @param {string} key - The parameter name ('enabled', 'followCamera').
 * @param {*} value - The new value.
 */
export function updateSkyboxConfig(key, value) {
	if (config.hasOwnProperty(key)) {
		config[key] = value;

		// Apply immediate changes
		if (key === "enabled" && skyboxMesh) {
			skyboxMesh.visible = value;
			// Stop video if disabling skybox? Optional.
			if (!value && currentTextureType === "video" && videoElement) {
				videoElement.pause();
			}
		} else if (key === "followCamera" && skyboxMesh && !value) {
			// If stopped following, reset position to origin? Optional.
			// skyboxMesh.position.set(0, 0, 0);
		}
		console.log(`Skybox config "${key}" updated to:`, value);
	} else {
		console.warn(`Invalid skybox config key: "${key}"`);
	}
}

/**
 * Gets the current skybox configuration.
 * @returns {object} The configuration object.
 */
export function getSkyboxConfig() {
	return config;
}

/**
 * Cleans up skybox resources.
 */
export function disposeSkybox() {
	_disposeCurrentMap(); // Use helper to dispose current map/video

	if (skyboxMesh) {
		sceneRef?.remove(skyboxMesh);
		skyboxMesh.geometry?.dispose();
		skyboxMesh.material?.dispose(); // Dispose the material itself
		skyboxMesh = null;
	}
	sceneRef = null;
	textureLoaderRef = null; // Clear loader ref
	console.log("Skybox disposed.");
}
