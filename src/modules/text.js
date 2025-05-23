// src/modules/text.js
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"; // For potential bubble improvement
// Consider using ExtrudeGeometry for bubbles if RoundedBoxGeometry is not suitable
// import { ExtrudeGeometry } from 'three/src/geometries/ExtrudeGeometry.js';
// import { Shape } from 'three/src/extras/core/Shape.js';

// --- Module State ---
let fontLoaderRef = null; // Reference to the FontLoader instance
let loadedFonts = {}; // Cache loaded fonts { fontName: font }
let textures = {
	// Store needed texture/material references
	matcap_8: null, // For main text
	matcap_7: null, // For dialogue bubbles/avatars?
	leftAvatar: null,
	rightAvatar: null,
};

// --- Font Loading ---

/**
 * Loads a font if not already loaded.
 * @param {string} fontName - A key name for the font (e.g., 'sevillana', 'ma_shan').
 * @param {string} fontPath - The path to the font JSON file.
 * @returns {Promise<THREE.Font>} A promise that resolves with the loaded font.
 */
function _loadFont(fontName, fontPath) {
	return new Promise((resolve, reject) => {
		if (!fontLoaderRef) {
			return reject("FontLoader not initialized in text module.");
		}
		if (loadedFonts[fontName]) {
			return resolve(loadedFonts[fontName]); // Return cached font
		}
		fontLoaderRef.load(
			fontPath,
			(font) => {
				loadedFonts[fontName] = font;
				console.log(`Font "${fontName}" loaded from ${fontPath}`);
				resolve(font);
			},
			undefined, // onProgress
			(error) => {
				console.error(`Failed to load font "${fontName}":`, error);
				reject(error);
			}
		);
	});
}

// --- Text Creation Helpers ---

/**
 * Creates a centered 3D text mesh.
 * @param {string} textContent - The string content.
 * @param {THREE.Font} font - The loaded font object.
 * @param {THREE.Material} material - The material for the text.
 * @param {object} options - TextGeometry options (size, height, etc.).
 * @returns {THREE.Mesh} The created text mesh.
 */
function _createTextMesh(textContent, font, material, options) {
	const textGeometry = new TextGeometry(textContent, { font, ...options });
	textGeometry.computeBoundingBox();
	textGeometry.center(); // Center the geometry
	const textMesh = new THREE.Mesh(textGeometry, material);
	textMesh.castShadow = true; // Optional: Text can cast shadows
	return textMesh;
}

// --- Dialogue Bubble Helper (Using ExtrudeGeometry for rounded corners) ---
function _createRoundedBubbleGeometry(width, height, radius, depth) {
	const shape = new THREE.Shape();
	const halfWidth = width / 2;
	const halfHeight = height / 2;

	// Move to top left start point
	shape.moveTo(-halfWidth + radius, halfHeight);
	// Line to top right corner start
	shape.lineTo(halfWidth - radius, halfHeight);
	// Quadratic curve for top right corner
	shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth, halfHeight - radius);
	// Line to bottom right corner start
	shape.lineTo(halfWidth, -halfHeight + radius);
	// Quadratic curve for bottom right corner
	shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth - radius, -halfHeight);
	// Line to bottom left corner start
	shape.lineTo(-halfWidth + radius, -halfHeight);
	// Quadratic curve for bottom left corner
	shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth, -halfHeight + radius);
	// Line to top left corner start
	shape.lineTo(-halfWidth, halfHeight - radius);
	// Quadratic curve for top left corner
	shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth + radius, halfHeight);

	const extrudeSettings = {
		depth: depth,
		bevelEnabled: false, // Keep it flat
	};
	return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

// --- Exported Functions ---

/**
 * Initializes the text module.
 * @param {FontLoader} fontLoaderInstance - The THREE.FontLoader instance.
 * @param {object} requiredTextures - Object containing needed textures: { matcap_8, matcap_7, leftAvatar, rightAvatar }.
 */
export function initTextSystem(fontLoaderInstance, requiredTextures) {
	if (!fontLoaderInstance || !requiredTextures) {
		console.error("FontLoader and textures required for initTextSystem.");
		return;
	}
	fontLoaderRef = fontLoaderInstance;
	textures.matcap_8 = requiredTextures.matcap_8;
	textures.matcap_7 = requiredTextures.matcap_7;
	textures.leftAvatar = requiredTextures.leftAvatar;
	textures.rightAvatar = requiredTextures.rightAvatar;

	if (!textures.matcap_8 || !textures.matcap_7 || !textures.leftAvatar || !textures.rightAvatar) {
		console.error("One or more required textures are missing in initTextSystem.");
		// Clear refs to prevent partial initialization issues
		textures.matcap_8 = null;
		textures.matcap_7 = null;
		textures.leftAvatar = null;
		textures.rightAvatar = null;
		return;
	}
	console.log("Text system initialized.");
}

/**
 * Creates the main name text ("Nankawa Chie").
 * @param {THREE.Group} parentGroup - The group to attach the text to (e.g., house).
 */
export async function createNameText(parentGroup) {
	if (!parentGroup || !textures.matcap_8) {
		console.error("Parent group and matcap_8 needed for name text.");
		return;
	}
	try {
		const font = await _loadFont("sevillana", "fonts/Sevillana_Regular.json");
		const material = textures.matcap_8; // Use pre-loaded matcap
		const textMesh = _createTextMesh("Nankawa Chie", font, material, {
			size: 0.5,
			height: 0.2,
			curveSegments: 12,
			bevelEnabled: true,
			bevelThickness: 0.03,
			bevelSize: 0.02,
			bevelOffset: 0,
			bevelSegments: 5,
		});
		textMesh.position.set(0, 4.2, -7.8); // Original position
		parentGroup.add(textMesh);
		console.log("Name text created.");
	} catch (error) {
		console.error("Could not create name text:", error);
	}
}

/**
 * Creates the multi-line poem text.
 * @param {THREE.Group} parentGroup - The group to attach the text to (e.g., house).
 */
export async function createPoemText(parentGroup) {
	if (!parentGroup || !textures.matcap_8) {
		console.error("Parent group and matcap_8 needed for poem text.");
		return;
	}
	try {
		const font = await _loadFont("ma_shan", "fonts/Ma_Shan_Zheng_Regular.json");
		const material = textures.matcap_8;
		const textContent = "辞戎隐野数十载\n浅草清池怨艾声\n烟花易逝情难却\n繁华落尽见真宵";
		const textMesh = _createTextMesh(textContent, font, material, {
			size: 0.5,
			height: 0.1, // Flatter text
			curveSegments: 6,
			bevelEnabled: false,
		});

		// Adjust position based on original code (slightly off center?)
		textMesh.position.set(-5, 5.2, -7.8); // Original position
		// textMesh.geometry.computeBoundingBox(); // Re-compute box after creation
		// textMesh.position.x -= (textMesh.geometry.boundingBox.max.x - textMesh.geometry.boundingBox.min.x) * 0.5; // Center X?
		parentGroup.add(textMesh);
		console.log("Poem text created.");
	} catch (error) {
		console.error("Could not create poem text:", error);
	}
}

/**
 * Creates the English quote text on the opposite wall.
 * @param {THREE.Group} parentGroup - The group to attach the text to (e.g., house).
 */
export async function createQuoteText(parentGroup) {
	if (!parentGroup || !textures.matcap_8) {
		console.error("Parent group and matcap_8 needed for quote text.");
		return;
	}
	try {
		const font = await _loadFont("ma_shan", "fonts/Ma_Shan_Zheng_Regular.json"); // Reuse font
		const material = textures.matcap_8;
		const textContent =
			"Staring the stars, watching the moon\n" +
			"Hoping that one day they'll lead me to you\n" +
			"Wait every night 'cause if a star falls\n" +
			"I'll wish to go back to the times that I loved";
		const textMesh = _createTextMesh(textContent, font, material, {
			size: 0.4, // Slightly smaller
			height: 0.05, // Flatter
			curveSegments: 6,
			bevelEnabled: false,
		});
		textMesh.position.set(-7.9, 5, 0); // Position on opposite wall (-X side)
		textMesh.rotation.y = Math.PI / 2; // Rotate to face inwards
		parentGroup.add(textMesh);
		console.log("Quote text created.");
	} catch (error) {
		console.error("Could not create quote text:", error);
	}
}

/**
 * Creates the dialogue elements (main text and bubbles with avatars).
 * @param {THREE.Group} parentGroup - The group to attach the elements to (e.g., house).
 */
export async function createDialogueElements(parentGroup) {
	if (!parentGroup || !textures.matcap_8 || !textures.matcap_7 || !textures.leftAvatar || !textures.rightAvatar) {
		console.error("Parent group, matcaps, and avatar textures needed for dialogue.");
		return;
	}
	try {
		const font = await _loadFont("ma_shan", "fonts/Ma_Shan_Zheng_Regular.json"); // Reuse font
		const textMaterial = textures.matcap_8;
		const bubbleMaterial = textures.matcap_7; // Use matcap_7 for bubbles

		// 1. Main Dialogue Text
		const mainTextContent = "你曾是我地狱般噩梦人生中，一段美好的梦境。";
		const mainTextMesh = _createTextMesh(mainTextContent, font, textMaterial, {
			size: 0.4,
			height: 0.05,
			curveSegments: 6,
			bevelEnabled: false,
		});
		mainTextMesh.position.set(7.9, 5, 0); // Position on wall (+X side)
		mainTextMesh.rotation.y = -Math.PI / 2; // Rotate to face inwards
		parentGroup.add(mainTextMesh);

		// 2. Dialogue Bubble Function
		const createDialogueBubble = (dialogueText, avatarTexture, isLeft, yOffset) => {
			const dialogueGroup = new THREE.Group();

			// Bubble Geometry & Mesh
			const bubbleWidth = 1.8;
			const bubbleHeight = 0.5;
			const bubbleRadius = 0.15;
			const bubbleDepth = 0.03;
			const bubbleGeometry = _createRoundedBubbleGeometry(bubbleWidth, bubbleHeight, bubbleRadius, bubbleDepth);
			const bubbleMesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);

			// Dialogue Text inside Bubble
			const bubbleTextMesh = _createTextMesh(dialogueText, font, textMaterial, {
				// Text inside uses matcap_8
				size: 0.2,
				height: 0.01, // Very flat
				curveSegments: 4,
				bevelEnabled: false,
			});
			// Position text slightly in front of bubble background
			bubbleTextMesh.position.z = bubbleDepth / 2 + 0.005;
			bubbleMesh.add(bubbleTextMesh);

			// Avatar Mesh
			const avatarSize = 0.6;
			const avatarGeometry = new THREE.PlaneGeometry(avatarSize, avatarSize);
			// Ensure avatar texture is MeshBasicMaterial if it has transparency
			const avatarMaterial = new THREE.MeshBasicMaterial({
				map: avatarTexture,
				transparent: true,
				side: THREE.DoubleSide,
			});
			const avatarMesh = new THREE.Mesh(avatarGeometry, avatarMaterial);

			// Positioning Avatar and Bubble within the group
			const horizontalOffset = 1.2; // Distance from center to avatar
			const bubbleGap = 0.1; // Gap between avatar and bubble
			if (isLeft) {
				avatarMesh.position.x = -horizontalOffset;
				bubbleMesh.position.x = -horizontalOffset + avatarSize / 2 + bubbleGap + bubbleWidth / 2;
			} else {
				avatarMesh.position.x = horizontalOffset;
				bubbleMesh.position.x = horizontalOffset - avatarSize / 2 - bubbleGap - bubbleWidth / 2;
			}
			dialogueGroup.add(avatarMesh);
			dialogueGroup.add(bubbleMesh);

			// Position the entire dialogue group
			dialogueGroup.position.set(7.9, yOffset, 0); // On the wall
			dialogueGroup.rotation.y = -Math.PI / 2; // Face inwards

			parentGroup.add(dialogueGroup);

			// Optional: Add entrance animation (using GSAP or TWEEN if available)
			// Example with TWEEN (assuming TWEEN is updated elsewhere)
			/*
             dialogueGroup.scale.set(0.1, 0.1, 0.1);
             dialogueGroup.position.y -= 0.5;
             new TWEEN.Tween(dialogueGroup.scale)
                 .to({ x: 1, y: 1, z: 1 }, 800)
                 .easing(TWEEN.Easing.Back.Out)
                 .start();
             new TWEEN.Tween(dialogueGroup.position)
                 .to({ y: yOffset }, 800)
                 .easing(TWEEN.Easing.Back.Out)
                 .start();
            */
		};

		// 3. Create Left and Right Bubbles
		createDialogueBubble("左方发言", textures.leftAvatar, true, 4.0); // Adjust Y positions
		createDialogueBubble("右方发言", textures.rightAvatar, false, 3.1);

		console.log("Dialogue elements created.");
	} catch (error) {
		console.error("Could not create dialogue elements:", error);
	}
}
