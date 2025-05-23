// src/modules/controlsAndResize.js
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
// 导入体力系统相关函数
import { 
    updateStamina, 
    canSprint, 
    getCurrentStamina, 
    getMaxStamina,
    setStaminaBarVisible,
	getActiveCharacterType // --- 新增导入 ---
} from "./debug.js";

// --- Module State ---
let controls = null; // PointerLockControls instance
let cameraRef = null; // Reference to the main THREE.Camera
let rendererRef = null; // Reference to the main THREE.WebGLRenderer
// --- 修改：存储所有角色数据和当前活动角色的引用 ---
// let characterRef = null; // 旧的单一引用
let characterDatasRef = null; // 存储 { blocky: {...}, milkAnimated: {...} }
let activeCharacterDataRef = null; // 存储当前活动角色的数据 { character, characterBody, ... } 或 { model, characterBody, ... }
// --- 结束修改 ---
let clockRef = null; // Reference to the main THREE.Clock
let keys = {}; // Tracks currently pressed keys
let currentSpeed = 6; // Default speed
let baseSpeed = 6;
let sprintMultiplier = 1.8; // How much faster sprinting is
let walkMultiplier = 0.5; // How much slower walking (Caps Lock) is
let isSprinting = false;
let isWalking = false; // Caps Lock state
let cameraMode = "first"; // 'first' or 'third'
let targetFov = 70; // Target Field of View for camera
const fovChangeSpeed = 20.0; // How fast FOV changes (units per second)

// Third-person view parameters (can be adjusted via debug module later)
const thirdPersonParams = {
	pivotOffset: new THREE.Vector3(0, 1.44, 0), // Point around which camera orbits (e.g., head height)
	distance: 4.0, // Default distance from pivot
	minDistance: 1.5,
	maxDistance: 100.0,
	zoomSpeed: 2.0,
	rotationSpeed: 0.002, // Mouse sensitivity
};

let spherical = new THREE.Spherical(thirdPersonParams.distance, Math.PI / 2.5, Math.PI / 8); // phi, theta

// Tank control state (managed here but potentially triggered by interaction module)
let tankControl = {
	enabled: false,
	near: false, // Is player near the tank? (Set externally)
	distance: 10, // Tank third person distance (can be adjusted)
};

// Temporary vector for calculations (defined at module level)
const _worldDirection = new THREE.Vector3(); // <--- 添加这一行定义
// --- 新增：用于获取角色位置的临时变量 ---
const _characterPosition = new THREE.Vector3();

// DOM Elements
let fullscreenButton = null;
let instructionsElement = null;
let coordinatesElement = null;

// --- Event Listeners (defined later) ---
let _onMouseMoveRef;
let _onPointerLockChangeRef;
let _onPointerLockErrorRef;
let _onMouseDownRef;
let _onMouseWheelRef; // For third-person zoom
let _onKeyDownRef;
let _onKeyUpRef;
let _onWindowResizeRef;

// Instructions state
let instructionsVisible = true; // Track if instructions *should* be visible
let hideInstructionsPermanently = false; // Track "Don't show again" click

// --- Helper: Update Camera FOV ---
function _updateFOV(deltaTime) {
	if (!cameraRef) return;
	const fovDifference = targetFov - cameraRef.fov;
	if (Math.abs(fovDifference) > 0.01) {
		const changeAmount = fovDifference * fovChangeSpeed * deltaTime;
		// Prevent overshooting the target
		if (Math.abs(changeAmount) > Math.abs(fovDifference)) {
			cameraRef.fov = targetFov;
		} else {
			cameraRef.fov += changeAmount;
		}
		cameraRef.updateProjectionMatrix();
	}
}

// --- Helper: Update Third Person Camera ---
function _updateThirdPersonCamera() {
	// --- 修改：使用 activeCharacterDataRef ---
	if (!cameraRef || !activeCharacterDataRef) return;
	// 确定使用哪个视觉对象 (Blocky 的是 .character, MilkAnimated 的是 .model)
	const visualObject = activeCharacterDataRef.character || activeCharacterDataRef.model;
	if (!visualObject) return;

	// Get the character's world position
	visualObject.getWorldPosition(_characterPosition); // 使用临时变量

	// Calculate the pivot point in world space
	const pivotPoint = _characterPosition.clone().add(thirdPersonParams.pivotOffset);
	// --- 结束修改 ---

	// Update camera position based on spherical coordinates relative to pivot
	spherical.radius = THREE.MathUtils.clamp(
		spherical.radius,
		thirdPersonParams.minDistance,
		thirdPersonParams.maxDistance
	);
	const offset = new THREE.Vector3().setFromSpherical(spherical);
	const cameraTargetPosition = pivotPoint.clone().add(offset);

	// TODO: Implement Camera Collision Detection Here
	// Raycast from pivotPoint towards cameraTargetPosition
	// If hit, move camera closer than cameraTargetPosition

	cameraRef.position.copy(cameraTargetPosition);
	cameraRef.lookAt(pivotPoint); // Always look at the pivot point
}

// --- Exported Functions ---

/**
 * Initializes controls, listeners, and handles initial setup.
 * @param {THREE.Camera} camera - The main camera.
 * @param {THREE.WebGLRenderer} renderer - The main renderer.
 * @param {THREE.Clock} clock - The main clock.
 * @param {object} character - The character object { character, characterBody, parts }.
 * @param {HTMLElement} instructionsEl - DOM element for instructions popup.
 * @param {HTMLElement} coordinatesEl - DOM element for player coordinates display.
 * @param {HTMLElement} fullscreenBtn - DOM element for the fullscreen button.
 */
export function initControlsAndResize(
	camera,
	renderer,
	clock,
	characterDatas, // --- 修改：接收 characterDatas ---
	instructionsEl,
	coordinatesEl,
	fullscreenBtn
) {
	// --- 修改：检查 characterDatas ---
	if (!camera || !renderer || !clock || !characterDatas) {
		console.error("Camera, Renderer, Clock, and CharacterDatas required for initControlsAndResize.");
		return;
	}
	cameraRef = camera;
	rendererRef = renderer;
	characterDatasRef = characterDatas; // 存储所有角色数据
	clockRef = clock;
	instructionsElement = instructionsEl;
	coordinatesElement = coordinatesEl;
	fullscreenButton = fullscreenBtn;

	// --- 新增：根据 Debug GUI 设置初始活动角色 ---
	const initialActiveType = getActiveCharacterType(); // 从 debug.js 获取初始类型
	setActiveCharacter(initialActiveType); // 设置初始活动角色引用
	if (!activeCharacterDataRef) {
		console.warn(`Initial active character type "${initialActiveType}" data not found or not ready. Controls might not function correctly until switched.`);
		// 如果初始角色（比如 MilkAnimated）还没加载好，activeCharacterDataRef 会是 null
		// 需要确保 updateControls 能处理这种情况，或者依赖 script.js 在加载完成后再次调用 setActiveCharacter
	}
	// --- 结束新增 ---

	// 初始化时显示体力条
	setStaminaBarVisible(true);

	// --- Pointer Lock Controls ---
	controls = new PointerLockControls(cameraRef, rendererRef.domElement); // Use renderer's domElement

	// Store references to bound functions for removal later
	_onMouseMoveRef = _onMouseMove.bind(this);
	_onPointerLockChangeRef = _onPointerLockChange.bind(this);
	_onPointerLockErrorRef = _onPointerLockError.bind(this);
	_onMouseDownRef = _onMouseDown.bind(this);
	_onMouseWheelRef = _onMouseWheel.bind(this); // Add mouse wheel listener
	_onKeyDownRef = _onKeyDown.bind(this);
	_onKeyUpRef = _onKeyUp.bind(this);
	_onWindowResizeRef = _onWindowResize.bind(this);

	// --- Initial Instructions Setup ---
	if (instructionsElement) {
		// Check localStorage first (optional persistence)
		// hideInstructionsPermanently = localStorage.getItem('hideManual') === 'true';

		if (!hideInstructionsPermanently) {
			instructionsElement.style.display = "block"; // Show initially
			document.body.style.opacity = 0.6; // Dim background
			instructionsVisible = true;
		} else {
			instructionsElement.style.display = "none"; // Hide if remembered
			instructionsVisible = false;
		}

		const closeButton = instructionsElement.querySelector("#操作手册-关闭按钮");
		if (closeButton) {
			closeButton.addEventListener("click", () => {
				instructionsElement.style.display = "none";
				instructionsVisible = false;
				hideInstructionsPermanently = true; // Set the flag
				// Optional: Store preference in localStorage
				// localStorage.setItem('hideManual', 'true');
				// Restore body opacity if pointer isn't locked
				if (!controls || !controls.isLocked) {
					document.body.style.opacity = 1.0;
				}
			});
		}
	}

	// Add Listeners
	rendererRef.domElement.addEventListener("mousedown", _onMouseDownRef);
	document.addEventListener("mousemove", _onMouseMoveRef); // Listen on document for third person
	document.addEventListener("pointerlockchange", _onPointerLockChangeRef);
	document.addEventListener("pointerlockerror", _onPointerLockErrorRef);
	document.addEventListener("keydown", _onKeyDownRef);
	document.addEventListener("keyup", _onKeyUpRef);
	window.addEventListener("resize", _onWindowResizeRef);
	document.addEventListener("wheel", _onMouseWheelRef, { passive: false }); // For zoom

	// Fullscreen Button Listener
	if (fullscreenButton) {
		fullscreenButton.addEventListener("click", () => {
			if (!document.fullscreenElement) {
				document.documentElement.requestFullscreen().catch((err) => {
					console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
				});
			} else {
				if (document.exitFullscreen) {
					document.exitFullscreen();
				}
			}
		});
	}
	// Handle cursor style on fullscreen change
	document.addEventListener("fullscreenchange", () => {
		if (!document.fullscreenElement) {
			document.body.style.cursor = "auto";
		} else {
			// Hide cursor only if pointer is locked
			if (controls && controls.isLocked) {
				document.body.style.cursor = "none";
			}
		}
	});

	console.log("Controls and Resize module initialized.");
}

// --- 新增：设置当前活动角色的函数 ---
/**
 * Sets the currently active character for controls and camera.
 * Called by script.js when the character is switched via Debug GUI.
 * @param {string} characterType - The type of character to activate ('Blocky' or 'MilkAnimated').
 */
export function setActiveCharacter(characterType) {
	console.log(`Controls module: Setting active character to ${characterType}`);
	if (!characterDatasRef) {
		console.error("Character data reference is not set in Controls module.");
		activeCharacterDataRef = null;
		return;
	}

	switch (characterType) {
		case 'Blocky':
			activeCharacterDataRef = characterDatasRef.blocky;
			break;
		case 'MilkAnimated':
			activeCharacterDataRef = characterDatasRef.milkAnimated;
			break;
		default:
			console.error(`Unknown character type: ${characterType}`);
			activeCharacterDataRef = null;
			break;
	}

	if (!activeCharacterDataRef) {
		console.warn(`Data for character type "${characterType}" not found or not ready.`);
	} else {
		console.log("Active character data reference updated in Controls.");
		// 可能需要重置一些状态，例如第三人称相机的球状坐标？
		// spherical.radius = thirdPersonParams.distance;
		// spherical.phi = Math.PI / 2.5;
		// spherical.theta = Math.PI / 8;
	}
}

// 添加冲刺疲劳相关变量
let sprintStamina = 100; // 冲刺耐力值，满值100
let sprintStaminaRecoveryRate = 15; // 每秒恢复速度
let sprintStaminaDepletionRate = 25; // 每秒消耗速度
let sprintStaminaExhausted = false; // 是否耗尽耐力

/**
 * Updates controls based on input and camera mode. Call in animation loop.
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updateControls(deltaTime = 0.016) {
	// --- 修改：检查 activeCharacterDataRef ---
	if (!controls || !cameraRef || !activeCharacterDataRef || !clockRef) {
		// 如果当前没有活动角色数据（例如，初始角色未加载完），则不执行更新
		return;
	}
	// 确定当前活动角色的视觉对象和物理对象
	const activeVisual = activeCharacterDataRef.character || activeCharacterDataRef.model;
	const activeBody = activeCharacterDataRef.characterBody;

	if (!activeVisual || !activeBody) {
		// 如果缺少视觉或物理对象，也无法继续
		console.warn("Active character data is missing visual or physics body.");
		return;
	}
	// --- 结束修改 ---

	// 更新冲刺耐力
	if (isSprinting) {
		sprintStamina = Math.max(0, sprintStamina - sprintStaminaDepletionRate * deltaTime);
		if (sprintStamina <= 0 && !sprintStaminaExhausted) {
			sprintStaminaExhausted = true;
			isSprinting = false;
			targetFov = 70;
		}
	} else {
		sprintStamina = Math.min(100, sprintStamina + sprintStaminaRecoveryRate * deltaTime);
		// 只有当耐力恢复到30%以上才能再次冲刺
		if (sprintStaminaExhausted && sprintStamina > 30) {
			sprintStaminaExhausted = false;
		}
	}

	// 更新体力状态
	updateStamina(deltaTime, isSprinting);
	
	// 检查是否可以冲刺
	if (isSprinting && !canSprint()) {
		isSprinting = false;
		targetFov = 70; // 恢复正常FOV
	}

	// 更新FOV
	_updateFOV(deltaTime);

	// --- First Person ---
	if (cameraMode === "first" && controls.isLocked) {
		// Rotation is handled by PointerLockControls directly modifying camera

		// Ensure character visual rotation matches camera Y rotation ONLY when not in tank control
		// --- 修改：使用 activeVisual ---
		if (activeVisual && !tankControl.enabled) {
			cameraRef.getWorldDirection(_worldDirection);
			const targetRotationY = Math.atan2(_worldDirection.x, _worldDirection.z);
			const currentRotationY = activeVisual.rotation.y;
			let deltaRotation = targetRotationY - currentRotationY;
			// Handle angle wrapping (-PI to PI)
			while (deltaRotation > Math.PI) deltaRotation -= Math.PI * 2;
			while (deltaRotation < -Math.PI) deltaRotation += Math.PI * 2;

			// Apply interpolation (adjust the factor 0.2 for speed)
			activeVisual.rotation.y += deltaRotation * 0.2;

			// --- OR --- Simpler direct assignment (can be slightly jerky):
			// characterRef.character.rotation.y = targetRotationY;
		}
		// --- 结束修改 ---

		// Position camera at head height (relative to character's physics position)
        // --- 修改：根据活动角色类型确定 headHeight 和前向偏移 ---
        let headHeight = 1.44; // Default (Blocky) head height
        let forwardOffsetAmount = 0.0; // Default forward offset
        const activeType = getActiveCharacterType();

        if (tankControl.enabled) {
            headHeight = 2.5; // Tank view higher
        } else if (activeType === 'MilkAnimated') {
            headHeight = 1.8; // 使用你觉得合适的 1.8 高度
            forwardOffsetAmount = 0.5; // 设置 MilkAnimated 的前向偏移量
        }
        // --- 结束修改 ---
		// --- 修改：使用 activeBody ---
		if (activeBody) {
            // 计算基础头部位置 (物理位置 + 高度)
			const baseHeadPosX = activeBody.position.x;
			const baseHeadPosY = activeBody.position.y + headHeight;
			const baseHeadPosZ = activeBody.position.z;

            // --- 新增：计算并应用前向偏移 ---
            // _worldDirection 已经包含了归一化的摄像机前向向量
            const finalPosX = baseHeadPosX + _worldDirection.x * forwardOffsetAmount;
            const finalPosY = baseHeadPosY + _worldDirection.y * forwardOffsetAmount; // 通常 Y 方向偏移为 0 或很小
            const finalPosZ = baseHeadPosZ + _worldDirection.z * forwardOffsetAmount;
            // --- 结束新增 ---

			cameraRef.position.set(finalPosX, finalPosY, finalPosZ); // <-- 使用最终计算的位置
		}
	}
	// --- Third Person --- (rest of the function...)
	else if (cameraMode === "third") {
		// Update camera position based on mouse movement (handled in _onMouseMove)
		_updateThirdPersonCamera(); // This function now uses activeCharacterDataRef

		// Sync Character Visual Rotation (Optional: based on camera horizontal view)
		// --- 修改：使用 activeVisual ---
		if (activeVisual && !tankControl.enabled) {
			const targetRotationY = spherical.theta + Math.PI;
			const currentRotationY = activeVisual.rotation.y;
			let deltaRotation = targetRotationY - currentRotationY;
			while (deltaRotation > Math.PI) deltaRotation -= Math.PI * 2;
			while (deltaRotation < -Math.PI) deltaRotation += Math.PI * 2;
			activeVisual.rotation.y += deltaRotation * 0.2;
		}
		// --- 结束修改 ---
	}

	// --- Update Movement Speed ---
	let speed = baseSpeed;
	if (isSprinting && canSprint()) speed *= sprintMultiplier;
	if (isWalking) speed *= walkMultiplier; // Apply walk speed reduction AFTER sprint potentially
	currentSpeed = speed; // Update global speed variable

	// --- Update Coordinates Display ---
	// --- 修改：使用 activeBody ---
	if (coordinatesElement && activeBody) {
		coordinatesElement.textContent = `X: ${activeBody.position.x.toFixed(
			2
		)}, Y: ${activeBody.position.y.toFixed(2)}, Z: ${activeBody.position.z.toFixed(2)}`;
	}
	// --- 结束修改 ---
}

/**
 * Returns the current state of the keys being pressed.
 * @returns {object} The keys state object.
 */
export function getKeysState() {
	return keys;
}

/**
 * Returns the current movement speed.
 * @returns {number} The current speed.
 */
export function getCurrentSpeed() {
	return currentSpeed;
}

/**
 * Returns the current camera mode ('first' or 'third').
 * @returns {string}
 */
export function getCameraMode() {
	return cameraMode;
}

/**
 * Allows external modules (like interaction) to enable/disable tank controls.
 * @param {boolean} enabled - True to enable tank controls, false otherwise.
 */
export function setTankControlState(enabled) {
	if (tankControl.enabled !== enabled) {
		tankControl.enabled = enabled;
		console.log("Tank control state set to:", enabled);
		// Optionally force camera mode on change
		// cameraMode = enabled ? 'third' : 'first';
		// if (enabled && controls.isLocked) controls.unlock();
		// if (!enabled && !controls.isLocked) controls.lock();
		// Reset FOV?
		targetFov = 70;
	}
}

/**
 * Gets the current tank control state.
 * @returns {boolean}
 */
export function getTankControlState() {
	return tankControl.enabled;
}

/**
 * Cleans up event listeners.
 */
export function disposeControlsAndResize() {
	if (controls) {
		controls.dispose(); // Dispose PointerLockControls if method exists
		controls = null;
	}
	// Remove Listeners
	if (rendererRef?.domElement) {
		rendererRef.domElement.removeEventListener("mousedown", _onMouseDownRef);
	}
	document.removeEventListener("mousemove", _onMouseMoveRef);
	document.removeEventListener("pointerlockchange", _onPointerLockChangeRef);
	document.removeEventListener("pointerlockerror", _onPointerLockErrorRef);
	document.removeEventListener("keydown", _onKeyDownRef);
	document.removeEventListener("keyup", _onKeyUpRef);
	window.removeEventListener("resize", _onWindowResizeRef);
	document.removeEventListener("wheel", _onMouseWheelRef);
	document.removeEventListener("fullscreenchange", () => {}); // Remove specific listener if added

	// Clear references
	// --- 修改：清除新的引用 ---
	cameraRef = null;
	rendererRef = null;
	characterDatasRef = null; // 清除角色数据对象引用
	activeCharacterDataRef = null; // 清除活动角色引用
	clockRef = null;
	instructionsElement = null;
	coordinatesElement = null;
	fullscreenButton = null;
	keys = {};
	// --- 结束修改 ---

	console.log("Controls and Resize module disposed.");
}

// --- Internal Event Handlers ---

function _onMouseDown(event) {
	if (!controls) return;
	// Original logic: Right-click to lock, Middle-click to unlock
	if (cameraMode === "first") {
		if (event.button === 0) {
			// Lock on Left click in first person for standard FPS
			controls.lock();
		}
	} else if (cameraMode === "third") {
		// In third person, don't lock pointer. Mouse move orbits.
		// Middle mouse unlock is implicitly handled by pointerlockchange event
	}
	if (event.button === 1) {
		// Middle mouse always unlocks
		event.preventDefault(); // Prevent default middle-click scroll/paste
		controls.unlock();
	}
}

function _onMouseWheel(event) {
	if (cameraMode === "third") {
		event.preventDefault(); // Prevent page scroll
		spherical.radius += event.deltaY * 0.01 * thirdPersonParams.zoomSpeed; // Adjust zoom speed sensitivity
		spherical.radius = THREE.MathUtils.clamp(
			spherical.radius,
			thirdPersonParams.minDistance,
			thirdPersonParams.maxDistance
		);
	}
}

function _onMouseMove(event) {
	if (cameraMode === "third") {
		// Only orbit if in third person mode
		// No need to check controls.isLocked here, as third person mouse always orbits
		const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		spherical.theta -= movementX * thirdPersonParams.rotationSpeed;
		spherical.phi -= movementY * thirdPersonParams.rotationSpeed;

		// Clamp vertical rotation (phi)
		spherical.phi = THREE.MathUtils.clamp(spherical.phi, 0.1, Math.PI - 0.1);
	} else if (cameraMode === "first") {
		// Do nothing here - PointerLockControls handles camera movement when locked.
		// If pointer is unlocked in first person, mouse move shouldn't affect camera.
	}
}

function _onPointerLockChange() {
	if (!controls) return;

	if (controls.isLocked) {
		console.log("Pointer Locked");
		document.body.style.cursor = "none";
		// Optionally hide instructions IF they are currently conceptually visible
		// if (instructionsVisible && instructionsElement) {
		//     instructionsElement.style.display = 'none';
		// }
		// Assuming lock always means first person
		cameraMode = "first";
	} else {
		// Pointer Unlocked
		console.log("Pointer Unlocked");
		document.body.style.cursor = "auto";
		// Restore body opacity ONLY if instructions are permanently hidden
		if (hideInstructionsPermanently) {
			document.body.style.opacity = 1.0;
		} else if (instructionsElement) {
			// If unlock happened and instructions *should* be shown, show them
			instructionsElement.style.display = "block";
			document.body.style.opacity = 0.6; // Dim background
			instructionsVisible = true;
		}

		// When unlocked, explicitly switch to third person mode? Or keep current mode?
		// Let's keep the mode as it was, unless changed by Ctrl.
		// cameraMode = 'third'; // Uncomment if you want unlock to force third person
	}
}

function _onPointerLockError() {
	console.error("Pointer Lock Error");
	instructionsElement.style.display = "block"; // Show instructions if lock fails
}

function _onKeyDown(event) {
	keys[event.code] = true;

	switch (event.code) {
		case "ShiftLeft":
			if (!isSprinting && !isWalking && canSprint()) {
				// 只有在不是走路模式且耐力未耗尽时才能冲刺
				isSprinting = true;
				targetFov = 80; // Increase FOV for sprint
			}
			break;
		case "ControlLeft":
			// Simply toggle the mode. The update loop will handle camera behavior.
			cameraMode = cameraMode === "first" ? "third" : "first";
			console.log("Camera mode switched to:", cameraMode);

			// If switching TO first person, ensure instructions are hidden if appropriate
			if (cameraMode === "first" && instructionsElement && instructionsVisible && !hideInstructionsPermanently) {
				instructionsElement.style.display = "none";
				document.body.style.opacity = 1.0;
			}
			// If switching TO third person, ensure instructions are hidden if appropriate
			else if (cameraMode === "third" && instructionsElement && instructionsVisible && !hideInstructionsPermanently) {
				instructionsElement.style.display = "none";
				document.body.style.opacity = 1.0;
			}

			break; // End ControlLeft case
		case "CapsLock":
			// Toggle walking state (independent of sprint key state)
			isWalking = !isWalking;
			if (isWalking) {
				isSprinting = false; // Cannot sprint while walking
				targetFov = 70; // Reset FOV if walking overrides sprint
			}
			console.log("Walk mode (CapsLock):", isWalking);
			break;
		// Tank control toggle removed - should be handled by interaction logic (e.g., 'E' near tank)
	}
	// event.preventDefault(); // Prevent default browser actions for handled keys if needed
}

function _onKeyUp(event) {
	keys[event.code] = false;

	switch (event.code) {
		case "ShiftLeft":
			isSprinting = false;
			if (!isWalking) {
				// Only reset FOV if not walking
				targetFov = 70;
			}
			break;
		// CapsLock state persists until pressed again
	}
	// event.preventDefault();
}

function _onWindowResize() {
	if (!cameraRef || !rendererRef) return;
	const width = window.innerWidth;
	const height = window.innerHeight;

	// Update Main WebGL Camera & Renderer
	cameraRef.aspect = width / height;
	cameraRef.updateProjectionMatrix();
	rendererRef.setSize(width, height);
	rendererRef.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	// Note: CSS3D resize is handled separately by calling resizeCSS3D from here
	// (or from the main script's resize handler)
	console.log("Window resized");
}

/**
 * 获取当前冲刺耐力状态
 * @returns {object} 包含耐力值和状态的对象
 */
export function getSprintStaminaState() {
	return {
		current: sprintStamina,
		max: 100,
		depleted: sprintStaminaExhausted,
	};
}

/**
 * 获取当前是否在冲刺状态
 * @returns {boolean} 是否在冲刺
 */
export function getSprintingState() {
	return isSprinting;
}

// --- 新增：获取当前活动角色的物理体 ---
// 这个函数可能被 animate.js 或其他需要直接访问物理体的模块使用
/**
 * Returns the physics body of the currently active character.
 * @returns {CANNON.Body | null} The active character's physics body, or null if none is active/valid.
 */
export function getActiveCharacterBody() {
    return activeCharacterDataRef ? activeCharacterDataRef.characterBody : null;
}