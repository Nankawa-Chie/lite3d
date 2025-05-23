// src/modules/minimap.js
import * as THREE from "three";

// --- Module State ---
let miniMapCamera = null;
// --- 修改：移除 characterRef，添加 characterDatasRef 和 controlsUpdaterRef ---
// let characterRef = null; // 旧的单一引用
let characterDatasRef = null; // 存储 { blocky: {...}, milkAnimated: {...} }
let controlsUpdaterRef = null; // 引用 controlsUpdater 获取活动角色
// --- 结束修改 ---
let rendererRef = null; // Reference to the main WebGLRenderer
let sceneRef = null; // Reference to the main scene

// Trail State
const trailPoints = []; // Array to store { position: Vector3, timestamp: number }
const trailMaxAge = 3000; // Duration in milliseconds (3 seconds)
const trailUpdateInterval = 100; // Add a point every 100ms
let lastTrailUpdateTime = 0;
let trailLine = null; // THREE.Line object
let trailGeometry = null; // THREE.BufferGeometry
let trailMaterial = null; // THREE.LineDashedMaterial

// --- Configuration ---
const miniMapConfig = {
	enabled: true, // Is the minimap currently visible?
	size: {
		// Size in pixels
		width: 310,
		height: 310,
	},
	position: {
		// Position from top-left corner in pixels
		left: 10,
		top: 10,
	},
	viewRange: 50, // Orthographic view size (units width/height visible)
	zoom: 1.0, // Multiplier for viewRange (allows zooming)
	cameraHeight: 100, // How high above the character the camera sits
	followCharacter: true, // Should the camera follow the character?
	rotateWithCharacter: false, // Should the map rotate? (Usually false for minimaps)
	trailEnabled: true,
	trailColor: 0x00ffff, // Cyan color for the trail
	trailDashSize: 0.2,
	trailGapSize: 0.1,
	trailYOffset: 0.02, // Draw trail slightly above the ground plane
};

// --- 新增：临时变量 ---
const _activeCharacterPosition = new THREE.Vector3();
const _activeCharacterRotation = new THREE.Euler();

// --- Exported Functions ---

/**
 * Initializes the minimap system.
 * @param {THREE.WebGLRenderer} renderer - The main WebGL renderer.
 * @param {THREE.Scene} scene - The main scene.
 * @param {object} characterDatas - Object containing data for all characters. e.g., { blocky: {...}, milkAnimated: {...} }
 * @param {object} controlsUpdater - Reference to the controls module { ..., getActiveCharacterBody }
 * @param {object} [initialConfig] - Optional initial configuration overrides.
 */
export function initMiniMap(renderer, scene, characterDatas, controlsUpdater, initialConfig) { // <--- 修改参数
	// --- 修改：更新检查逻辑 ---
	if (!renderer || !scene || !characterDatas || !controlsUpdater) {
		console.error("Renderer, Scene, CharacterDatas, and ControlsUpdater required for initMiniMap.");
		return;
	}
	// --- 新增：检查 controlsUpdater 是否有 getActiveCharacterBody ---
	if (typeof controlsUpdater.getActiveCharacterBody !== 'function') {
		console.error("controlsUpdater must provide getActiveCharacterBody function for Minimap.");
		return;
	}
	rendererRef = renderer;
	sceneRef = scene;
	characterDatasRef = characterDatas; // 存储所有角色数据
	controlsUpdaterRef = controlsUpdater; // 存储 controlsUpdater 引用
	// --- 结束修改 ---

	// Merge initial config if provided
	if (initialConfig) {
		Object.assign(miniMapConfig, initialConfig);
	}

	// --- Create Orthographic Camera ---
	// Calculate initial bounds based on size and aspect ratio
	const aspect = miniMapConfig.size.width / miniMapConfig.size.height;
	const viewHeight = miniMapConfig.viewRange / miniMapConfig.zoom;
	const viewWidth = viewHeight * aspect;

	miniMapCamera = new THREE.OrthographicCamera(
		-viewWidth / 2,
		viewWidth / 2, // left, right
		viewHeight / 2,
		-viewHeight / 2, // top, bottom
		0.1,
		1000 // near, far
	);

	// --- 修改：设置初始相机位置（尝试使用 Blocky 或第一个可用的角色）---
	let initialTargetPosition = new THREE.Vector3(0, 0, 0); // Default fallback
	const initialActiveBody = controlsUpdaterRef.getActiveCharacterBody();
	let initialVisual = null;
	if (initialActiveBody) {
		if (characterDatasRef.blocky && initialActiveBody === characterDatasRef.blocky.characterBody) {
			initialVisual = characterDatasRef.blocky.character;
		} else if (characterDatasRef.milkAnimated && initialActiveBody === characterDatasRef.milkAnimated.characterBody) {
			initialVisual = characterDatasRef.milkAnimated.model;
		}
	}
	// 如果找不到当前活动的，尝试用 blocky
	if (!initialVisual && characterDatasRef.blocky && characterDatasRef.blocky.character) {
		initialVisual = characterDatasRef.blocky.character;
		console.warn("Minimap init: Active character visual not found, using Blocky as initial target.");
	}
	// 如果连 blocky 都没有，用 milkAnimated
	else if (!initialVisual && characterDatasRef.milkAnimated && characterDatasRef.milkAnimated.model) {
		initialVisual = characterDatasRef.milkAnimated.model;
		console.warn("Minimap init: Active/Blocky character visual not found, using MilkAnimated as initial target.");
	}

	if (initialVisual) {
		initialVisual.getWorldPosition(initialTargetPosition);
	} else {
		console.warn("Minimap init: Could not find any character visual for initial camera position.");
	}

	// Set initial position and orientation (looking straight down)
	miniMapCamera.position.set(
		initialTargetPosition.x,
		initialTargetPosition.y + miniMapConfig.cameraHeight, // 使用目标Y + 高度
		initialTargetPosition.z
	);
	miniMapCamera.rotation.x = -Math.PI / 2; // Look straight down
	miniMapCamera.rotation.y = 0;
	miniMapCamera.rotation.z = 0;
	miniMapCamera.up.set(0, 0, -1);
	miniMapCamera.lookAt(initialTargetPosition.x, initialTargetPosition.y, initialTargetPosition.z); // Look at target's actual Y
	// --- 结束修改 ---

	// --- Initialize Trail ---
	if (miniMapConfig.trailEnabled) {
		trailMaterial = new THREE.LineDashedMaterial({
			color: miniMapConfig.trailColor,
			linewidth: 1, // Note: linewidth might not work on all systems
			dashSize: miniMapConfig.trailDashSize,
			gapSize: miniMapConfig.trailGapSize,
			// Optional: Add transparency
			// transparent: true,
			// opacity: 0.8,
		});

		trailGeometry = new THREE.BufferGeometry(); // Start empty
		trailLine = new THREE.Line(trailGeometry, trailMaterial);
		trailLine.frustumCulled = false; // Ensure it's always rendered by minimap camera

		sceneRef.add(trailLine); // Add the line object to the main scene
		lastTrailUpdateTime = performance.now(); // Initialize time
	}
	console.log("Minimap initialized.");
}

// --- Internal Helper Functions ---

// --- 新增：获取当前活动角色的视觉对象 ---
function _getActiveVisual() {
	if (!controlsUpdaterRef || !characterDatasRef) return null;

	const activeBody = controlsUpdaterRef.getActiveCharacterBody();
	if (!activeBody) return null;

	if (characterDatasRef.blocky && activeBody === characterDatasRef.blocky.characterBody) {
		return characterDatasRef.blocky.character;
	} else if (characterDatasRef.milkAnimated && activeBody === characterDatasRef.milkAnimated.characterBody) {
		return characterDatasRef.milkAnimated.model;
	}

	return null; // 未找到匹配
}

function _updateTrail(now) {
	// --- 修改：使用 _getActiveVisual 获取活动角色 ---
	const activeVisual = _getActiveVisual();
	if (!miniMapConfig.trailEnabled || !trailLine || !activeVisual) {
		// 如果没有活动角色或轨迹被禁用，则隐藏轨迹
		if (trailLine) {
			trailGeometry.setFromPoints([]); // Clear geometry
			trailLine.visible = false;
		}
		return;
	}
	// --- 结束修改 ---

	// 1. Add new point if interval passed
	if (now - lastTrailUpdateTime > trailUpdateInterval) {
		// --- 修改：使用 activeVisual 的位置 ---
		activeVisual.getWorldPosition(_activeCharacterPosition); // 获取世界坐标
		trailPoints.push({
			position: _activeCharacterPosition.clone(), // 存储克隆的位置
			timestamp: now,
		});
		// --- 结束修改 ---
		lastTrailUpdateTime = now;
	}

	// 2. Remove old points
	while (trailPoints.length > 0 && now - trailPoints[0].timestamp > trailMaxAge) {
		trailPoints.shift(); // Remove the oldest point
	}

	// 3. Update Geometry if points exist
	if (trailPoints.length > 1) {
		// Create vertices for the line, setting a fixed Y for flatness on map
		const lineVertices = trailPoints.map(
			(p) => new THREE.Vector3(p.position.x, miniMapConfig.trailYOffset, p.position.z)
		);
		trailGeometry.setFromPoints(lineVertices);

		// !! IMPORTANT for dashed lines !!
		trailLine.computeLineDistances();

		trailGeometry.attributes.position.needsUpdate = true; // May not be needed with setFromPoints
		trailLine.visible = true;
	} else {
		// Hide line if not enough points
		trailGeometry.setFromPoints([]); // Clear geometry
		trailLine.visible = false;
	}
}

/**
 * Updates the minimap camera position, view, and player marker.
 * Call this in the animation loop *before* rendering the minimap.
 */
export function updateMiniMap() {
	// Use performance.now() for trail timestamps
	const now = performance.now();

	// Update the trail data first
	_updateTrail(now); // <--- CALL THE TRAIL UPDATE FUNCTION

	// --- 修改：使用 _getActiveVisual 获取活动角色 ---
	const activeVisual = _getActiveVisual();
	if (!miniMapCamera || !activeVisual) return; // 如果没有相机或活动角色，则不更新
	// --- 结束修改 ---

	// --- Update Camera Position ---
	if (miniMapConfig.followCharacter) {
		// --- 修改：使用 activeVisual 的位置 ---
		activeVisual.getWorldPosition(_activeCharacterPosition);
		miniMapCamera.position.x = _activeCharacterPosition.x;
		miniMapCamera.position.z = _activeCharacterPosition.z;
		miniMapCamera.position.y = _activeCharacterPosition.y + miniMapConfig.cameraHeight; // 基于角色当前高度
		// --- 结束修改 ---
	}

	// --- Update Camera Rotation ---
	// Reset rotation first (important!)
	miniMapCamera.rotation.x = -Math.PI / 2;
	miniMapCamera.rotation.y = 0;
	miniMapCamera.rotation.z = 0;
	if (miniMapConfig.rotateWithCharacter) {
		// --- 修改：使用 activeVisual 的旋转 ---
		// 注意：直接使用 world rotation 可能不准确，取决于模型结构
		// 最好是获取模型的 Y 轴旋转
		// activeVisual.getWorldQuaternion(_worldQuaternion); // 如果需要世界四元数
		// miniMapCamera.rotation.y = -_worldQuaternion.toEuler(_activeCharacterRotation).y; // 可能需要调整顺序 'YXZ' 等
		miniMapCamera.rotation.y = -activeVisual.rotation.y; // 假设模型的本地 Y 旋转是期望的
		// --- 结束修改 ---
	}
	// Force camera to look down at the character's ground position after rotation
	// --- 修改：看向 activeVisual 的位置 ---
	miniMapCamera.lookAt(
		_activeCharacterPosition.x,
		_activeCharacterPosition.y, // 看向角色实际高度
		_activeCharacterPosition.z
	);
	// --- 结束修改 ---

	// --- Update Camera View Size (Zoom) ---
	const aspect = miniMapConfig.size.width / miniMapConfig.size.height;
	const viewHeight = miniMapConfig.viewRange / miniMapConfig.zoom;
	const viewWidth = viewHeight * aspect;
	miniMapCamera.left = -viewWidth / 2;
	miniMapCamera.right = viewWidth / 2;
	miniMapCamera.top = viewHeight / 2;
	miniMapCamera.bottom = -viewHeight / 2;
	miniMapCamera.updateProjectionMatrix();
}

/**
 * Renders the minimap into its designated viewport area.
 * Call this in the animation loop *after* the main scene render.
 */
export function renderMiniMap() {
	if (!miniMapConfig.enabled || !rendererRef || !sceneRef || !miniMapCamera) return;

	// Store original state
	const originalScissorTest = rendererRef.autoClear; // Or renderer.getScissorTest() if available
	const originalScissor = new THREE.Vector4();
	rendererRef.getScissor(originalScissor);
	const originalViewport = new THREE.Vector4();
	rendererRef.getViewport(originalViewport);

	// Enable Scissor Test
	rendererRef.setScissorTest(true);

	// Define viewport and scissor rect based on config
	const { width, height } = miniMapConfig.size;
	const { left, top } = miniMapConfig.position;
	const screenHeight = rendererRef.domElement.clientHeight; // Use actual canvas height

	// Scissor/Viewport Y is calculated from bottom-left
	const viewBottom = screenHeight - top - height;

	rendererRef.setScissor(left, viewBottom, width, height);
	rendererRef.setViewport(left, viewBottom, width, height);

	// Render the main scene with the minimap camera
	rendererRef.render(sceneRef, miniMapCamera);

	// Restore original state
	rendererRef.setScissorTest(originalScissorTest);
	rendererRef.setScissor(originalScissor);
	rendererRef.setViewport(originalViewport);
}

/**
 * Updates a specific minimap configuration parameter.
 * @param {string} key - The parameter name (e.g., 'enabled', 'viewRange', 'zoom').
 * @param {*} value - The new value.
 */
export function updateMiniMapConfig(key, value) {
	if (miniMapConfig.hasOwnProperty(key)) {
		// 1. Update the configuration object
		if (key === "size" || key === "position") {
			// Handle nested objects if necessary (though not used for trail)
			Object.assign(miniMapConfig[key], value);
		} else {
			miniMapConfig[key] = value;
		}

		// 2. Apply immediate changes to relevant objects if they exist
		if (key === "trailEnabled" && trailLine) {
			trailLine.visible = value && trailPoints.length > 1; // Update visibility based on new setting and points
		} else if (key === "trailColor" && trailMaterial) {
			trailMaterial.color.set(value); // Update material color
		} else if (key === "trailDashSize" && trailMaterial && trailLine) {
			trailMaterial.dashSize = value; // Update material dash size
			trailLine.computeLineDistances(); // Recompute needed for dash changes
			trailMaterial.needsUpdate = true; // Might help ensure update
		} else if (key === "trailGapSize" && trailMaterial && trailLine) {
			trailMaterial.gapSize = value; // Update material gap size
			trailLine.computeLineDistances(); // Recompute needed for gap changes
			trailMaterial.needsUpdate = true;
		} else if (key === "trailYOffset") {
			// If Y offset changes, trail needs geometry update on next frame
			// No direct action needed here, _updateTrail will handle it
		}
		// Add other immediate updates if needed (e.g., for camera settings if required)

		console.log(`Minimap config "${key}" updated to:`, value);
	} else {
		console.warn(`Invalid minimap config key: "${key}"`);
	}
}

/**
 * Gets the current minimap configuration.
 * @returns {object} The configuration object.
 */
export function getMiniMapConfig() {
	return miniMapConfig;
}

/**
 * Cleans up minimap resources.
 */
export function disposeMiniMap() {
	if (trailLine) {
		sceneRef?.remove(trailLine);
		trailGeometry?.dispose();
		trailMaterial?.dispose();
		trailLine = null;
		trailGeometry = null;
		trailMaterial = null;
		trailPoints.length = 0; // Clear array
	}

	miniMapCamera = null;
	// --- 修改：清除新的引用 ---
	characterDatasRef = null;
	controlsUpdaterRef = null;
	// --- 结束修改 ---
	rendererRef = null;
	sceneRef = null;
	console.log("Minimap disposed.");
}
