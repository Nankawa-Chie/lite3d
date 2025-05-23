// src/modules/css3d.js
import * as THREE from "three";
import { CSS3DRenderer, CSS3DSprite } from "three/examples/jsm/renderers/CSS3DRenderer.js";

// --- Module State ---
let cssRenderer;
let cssCamera;
let cssScene; // A dedicated scene for CSS3D objects might be cleaner
let iframeElement;
let cssSprite;
let containerElement; // The HTML element to contain the CSS3D renderer output

// --- Internal Variables ---
const iframeInitialPosition = { x: 0, y: 0, z: 0 }; // Relative to CSS scene origin
const iframeHiddenYOffset = -1000; // How far down to move when "hidden"

// --- Exported Functions ---

/**
 * Initializes the CSS3D system, creates the renderer, camera, scene, and iframe sprite.
 * Appends the renderer's DOM element to the specified container.
 * @param {HTMLElement} container - The HTML DOM element to contain the CSS3D output.
 * @param {string} iframeSrc - The source URL for the iframe.
 * @param {object} initialSize - Object with { width, height } of the initial window/container.
 */
export function initCSS3D(container, iframeSrc, initialSize) {
	if (!container || !iframeSrc || !initialSize) {
		console.error("Container element, iframe source, and initial size required for initCSS3D.");
		return;
	}
	containerElement = container;

	// --- CSS3D Renderer ---
	cssRenderer = new CSS3DRenderer();
	cssRenderer.setSize(initialSize.width, initialSize.height);
	// Renderer's DOM element styles are crucial for correct overlay
	cssRenderer.domElement.style.position = "absolute";
	cssRenderer.domElement.style.top = "0px";
	cssRenderer.domElement.style.left = "0px";
	// Ensure it doesn't capture mouse events meant for WebGL canvas below
	cssRenderer.domElement.style.pointerEvents = "none"; // Start with no pointer events
	container.appendChild(cssRenderer.domElement);

	// --- CSS3D Scene ---
	// Using a separate scene prevents CSS objects from interfering with WebGL scene logic (like raycasting)
	cssScene = new THREE.Scene();

	// --- Iframe Element ---
	iframeElement = document.createElement("iframe");
	iframeElement.src = iframeSrc;
	iframeElement.className = "iphone"; // Apply original class for styling
	// Allow pointer events specifically on the iframe itself when it's visible
	iframeElement.style.pointerEvents = "auto";
	iframeElement.style.border = "none"; // Remove default border

	// --- CSS3D Sprite ---
	cssSprite = new CSS3DSprite(iframeElement);
	// Position the sprite in the CSS scene
	// The Z position determines its apparent size/distance
	cssSprite.position.set(iframeInitialPosition.x, iframeInitialPosition.y, iframeInitialPosition.z);
	// Scale can also be used if needed, but position is typical for CSS3D
	// cssSprite.scale.set(0.5, 0.5, 0.5);
	cssScene.add(cssSprite);

	// --- CSS3D Camera ---
	// FOV affects perspective distortion, near/far define render range
	cssCamera = new THREE.PerspectiveCamera(75, initialSize.width / initialSize.height, 0.1, 1000);
	// Position the camera to view the sprite
	// The distance needs to be calculated based on desired appearance, FOV, and sprite size/position
	// Let's position it somewhat close to the sprite (e.g., z = 500)
	// Adjust this value to make the iframe appear larger/smaller
	cssCamera.position.set(0, 0, 650);
	// Look at the center of the CSS scene or the sprite's initial position
	cssCamera.lookAt(cssScene.position); // Look at 0,0,0

	// --- Setup Keyboard Listener ---
	document.addEventListener("keyup", _handleCSS3DKeys);

	console.log("CSS3D system initialized.");
}

/**
 * Renders the CSS3D scene. Should be called in the main animation loop *after* the WebGL render.
 */
export function renderCSS3D() {
	if (cssRenderer && cssScene && cssCamera) {
		cssRenderer.render(cssScene, cssCamera);
	}
}

/**
 * Updates the CSS3D renderer and camera dimensions on window resize.
 * @param {number} width - New width.
 * @param {number} height - New height.
 */
export function resizeCSS3D(width, height) {
	if (cssRenderer && cssCamera) {
		cssRenderer.setSize(width, height);
		cssCamera.aspect = width / height;
		cssCamera.updateProjectionMatrix();
	}
	// Adjust iframe style if needed (e.g., for fullscreen class)
	_updateIframeStyleForFullscreen();
}

/**
 * Toggles the visibility of the iframe by moving its CSS3DSprite.
 */
export function toggleCSS3DVisibility() {
	if (!cssSprite) return;

	const currentY = cssSprite.position.y;
	const targetY =
		Math.abs(currentY - iframeInitialPosition.y) < 1 // Check if close to initial Y
			? iframeHiddenYOffset // Hide it
			: iframeInitialPosition.y; // Show it

	// Could add a TWEEN animation here for smooth transition if desired
	cssSprite.position.y = targetY;
	console.log(`CSS3D Sprite visibility toggled to Y: ${targetY}`);
}

/**
 * Cleans up CSS3D resources and removes the renderer element.
 */
export function disposeCSS3D() {
	document.removeEventListener("keyup", _handleCSS3DKeys);

	if (cssSprite && cssScene) {
		cssScene.remove(cssSprite);
		// cssSprite.dispose(); // CSS3DSprite might not have a dispose method
		cssSprite = null;
	}
	if (iframeElement) {
		iframeElement.remove(); // Remove from memory
		iframeElement = null;
	}
	if (cssRenderer && cssRenderer.domElement) {
		containerElement.removeChild(cssRenderer.domElement);
		cssRenderer = null;
	}
	cssScene = null;
	cssCamera = null;
	containerElement = null;
	console.log("CSS3D system disposed.");
}

// --- Internal Helper Functions ---

function _handleCSS3DKeys(e) {
	// Use Numpad1 as in original script to toggle visibility
	if (e.code === "Numpad1") {
		toggleCSS3DVisibility();
	}
}

// Helper to manage the fullscreen class on the iframe container if needed
// This depends on how fullscreen is implemented in controlsAndResize.js
function _updateIframeStyleForFullscreen() {
	if (iframeElement) {
		const isFullscreen = !!document.fullscreenElement;
		if (isFullscreen) {
			iframeElement.classList.add("iphone-fullscreen"); // Add class from style.css
		} else {
			iframeElement.classList.remove("iphone-fullscreen"); // Remove class
		}
	}
}

// Listen to fullscreen changes to update style
document.addEventListener("fullscreenchange", _updateIframeStyleForFullscreen);
