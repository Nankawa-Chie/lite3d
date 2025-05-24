// src/modules/animate.js
import * as THREE from "three";
// --- 新增：导入获取活动角色类型的函数 ---
import { getActiveCharacterType } from "./debug.js"; // 用于确定当前角色类型

// --- Module References (to be set in initAnimateLoop) ---
let clock = null;
let scene = null;
let camera = null;
let renderer = null;
let css3dRenderer = null; // Specific function from css3d.js
let world = null;
// --- 修改：存储所有角色数据 ---
// let characterData = null; // 旧的单一引用
let characterDatasRef = null; // 存储 { blocky: {...}, milkAnimated: {...} }
// --- 结束修改 ---
let debugParams = null; // Reference to debug parameters if needed for direct checks

// References to modules with update functions
let controlsUpdater = null; // { updateControls, getKeysState, getCurrentSpeed, getCameraMode }
let lightingUpdater = null; // { updateGhostLights }
let houseUpdater = null; // { updateHouseTweens }
let characterUpdater = null; // { updateCharacterPhysicsSync, moveCharacter, characterJump }
let terrainUpdater = null; // { updateDynamicTerrain, setDynamicTerrainVisibility } // Assuming generateTerrain is checked here
let galaxyUpdater = null; // { updateGalaxy }
let tvUpdater = null; // { updateTV }
let minimapUpdater = null; // { updateMiniMap, renderMiniMap }
let planetsUpdater = null; // { updatePlanetPhysicsSync } // If planets have physics
let skyboxUpdater = null; // { updateSkybox } // Placeholder if skybox needs updates

// --- 移除：不再需要单独的 milkAnimatedData 引用 ---
// let milkAnimatedData = null; // { model, mixer, animations }

// --- Animation Loop State ---
let lastTime = 0;
let animationFrameId = null; // To store the requestAnimationFrame ID for cancellation
let isLooping = false;

// --- Animation State Variables (Moved from original animate function) ---
// --- 方块人程序化动画状态变量 ---
let armSwing = 0;
let armSwingDirection = 1;
let legSwing = 0;
let legSwingDirection = 1;
let bodyRotation = 0;
let bodyRotationTarget = 0;
// inAir is now handled by isCharacterGrounded() from characterUpdater
// --- 结束 方块人程序化动画状态变量 ---
// let armSwing = 0;
// let armSwingDirection = 1;
// let legSwing = 0;
// let legSwingDirection = 1;
// let bodyRotation = 0;
// let bodyRotationTarget = 0;
// let inAir = false; // Track jump state // 这个状态现在由 isCharacterGrounded() 提供

// --- 新增：动画模型动画状态管理 ---
let currentMilkAction = null; // 当前活动的 Milk 动画 Action
let previousMilkAction = null; // 上一个活动的 Milk 动画 Action (用于平滑过渡)

// --- Exported Functions ---

/**
 * Initializes the animation loop module with necessary references.
 * @param {object} refs - An object containing references:
 *   { clock, scene, camera, renderer, css3dRenderer, world, characterData, controlsUpdater,
 *     lightingUpdater, houseUpdater, characterUpdater, terrainUpdater, galaxyUpdater,
 *     tvUpdater, minimapUpdater, planetsUpdater, skyboxUpdater, debugParams, milkAnimatedData } // <--- 添加 milkAnimatedData
 */
export function initAnimateLoop(refs) {
	// --- 更新检查逻辑 ---
	if (
		!refs.clock ||
		!refs.scene ||
		!refs.camera ||
		!refs.renderer ||
		!refs.css3dRenderer ||
		!refs.world ||
		!refs.characterDatas || // <--- Changed characterData to characterDatas
		!refs.controlsUpdater ||
		!refs.lightingUpdater ||
		!refs.houseUpdater ||
		!refs.characterUpdater ||
		!refs.terrainUpdater ||
		!refs.galaxyUpdater ||
		!refs.tvUpdater ||
		!refs.minimapUpdater
		// milkAnimatedData 是可选的，如果模型没加载完可能是 null/undefined，所以不强制检查
	) {
		console.error("Missing essential references for initAnimateLoop. Check arguments.");
		return;
	}
	// --- 检查 controlsUpdater 是否有 getActiveCharacterBody ---
	if (typeof refs.controlsUpdater.getActiveCharacterBody !== 'function') {
		console.error("controlsUpdater must provide getActiveCharacterBody function.");
		return;
	}
	// --- 检查 characterUpdater 是否有 isCharacterGrounded ---
	if (typeof refs.characterUpdater.isCharacterGrounded !== 'function') {
		console.error("characterUpdater must provide isCharacterGrounded function.");
		return;
	}

	clock = refs.clock;
	scene = refs.scene;
	camera = refs.camera;
	renderer = refs.renderer;
	css3dRenderer = refs.css3dRenderer; // This should be the renderCSS3D function
	world = refs.world;
	characterDatasRef = refs.characterDatas; // <--- 存储 characterDatas
	controlsUpdater = refs.controlsUpdater;
	lightingUpdater = refs.lightingUpdater;
	houseUpdater = refs.houseUpdater;
	characterUpdater = refs.characterUpdater;
	terrainUpdater = refs.terrainUpdater;
	galaxyUpdater = refs.galaxyUpdater;
	tvUpdater = refs.tvUpdater;
	minimapUpdater = refs.minimapUpdater;
	planetsUpdater = refs.planetsUpdater; // Optional
	skyboxUpdater = refs.skyboxUpdater; // Optional
	debugParams = refs.debugParams; // Optional, needed if checking flags directly

	// --- 移除：不再需要单独赋值 milkAnimatedData ---
	// milkAnimatedData = refs.milkAnimatedData;

	// --- 移除：不再在此处创建 Actions ---
	/*
	if (characterDatasRef && characterDatasRef.milkAnimated && ...) {
		// ... action creation logic removed ...
	}
	*/
	// --- 结束移除 ---

	console.log("Animation loop initialized.");
}

// --- 新增：函数用于从外部设置初始动画 ---
/**
 * Sets the initial animation action for the MilkAnimated character.
 * Called from script.js after actions are created.
 * @param {THREE.AnimationAction} action - The initial animation action.
 */
export function setInitialMilkAction(action) {
	if (action) {
		currentMilkAction = action;
		// 不在这里 play()，等到模型可见且循环开始时再 play
		console.log("Animate module received initial milk action.");
	} else {
		console.error("Animate module received null initial action.");
	}
}
// --- 结束新增 ---

/**
 * Starts the main animation loop.
 */
export function startAnimateLoop() {
	// --- 新增：添加检查确保初始化成功 ---
    if (!clock || !renderer || !scene || !world || !controlsUpdater || !characterDatasRef) {
        console.error("Animation loop not initialized properly. Call initAnimateLoop() first with valid references.");
        return;
    }
	if (!isLooping) {
		isLooping = true;
		lastTime = performance.now(); // Initialize lastTime
		console.log("Starting animation loop...");
		// --- 新增：如果初始动画已设置，在这里播放它 ---
		if (currentMilkAction && !currentMilkAction.isRunning()) {
			// 确保只在第一次启动或停止后重启时播放
			// 并且只在当前角色是 MilkAnimated 时播放 (虽然此时可能还不是)
			// 更好的地方是在 _loop 中检查并播放
			// currentMilkAction.play();
			// console.log("Playing initial milk action on loop start.");
		}
		// --- 结束新增 ---
		_loop(); // Start the loop
	}
}

/**
 * Stops the main animation loop.
 */
export function stopAnimateLoop() {
	if (!isLooping) return;
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}
	isLooping = false;
	console.log("Animation loop stopped.");
}

// --- Internal Loop Function ---
function _loop(currentTime) {
	if (!isLooping) return; // Exit if stopped

	// Request next frame
	animationFrameId = requestAnimationFrame(_loop);

	// Calculate delta time
	const now = performance.now();
	const deltaTime = Math.min((now - lastTime) / 1000.0, 0.1); // 限制最大deltaTime为0.1秒
	lastTime = now;

	// --- Simulation Step ---
	// Update physics world (fixed timestep recommended for stability)
	const fixedTimeStep = 1 / 60;
	const maxSubSteps = 5; // Max physics steps per frame
	if (world) {
		world.step(fixedTimeStep, deltaTime, maxSubSteps);
	}

	// --- Update Game Logic & Modules ---
	const elapsedTime = clock.getElapsedTime();

	// 1. Update Controls (Camera position/rotation, FOV)
	if (controlsUpdater) controlsUpdater.updateControls(deltaTime);

	// --- 修改：处理活动角色 ---
	let activeCharacterType = 'None'; // 默认为无活动角色
	let activeVisual = null;
	let activeBody = null;
	let activeData = null; // 存储当前活动角色的完整数据引用

	if (controlsUpdater && characterDatasRef) {
		activeBody = controlsUpdater.getActiveCharacterBody(); // 获取当前活动的物理体

		if (activeBody) {
			// 判断活动物理体属于哪个角色
			if (characterDatasRef.blocky && activeBody === characterDatasRef.blocky.characterBody) {
				activeCharacterType = 'Blocky';
				activeVisual = characterDatasRef.blocky.character;
				activeData = characterDatasRef.blocky;
			} else if (characterDatasRef.milkAnimated && activeBody === characterDatasRef.milkAnimated.characterBody) {
				activeCharacterType = 'MilkAnimated';
				activeVisual = characterDatasRef.milkAnimated.model;
				activeData = characterDatasRef.milkAnimated;
			}
		}
	}
	// --- 结束修改 ---

	// 2. Update Character Physics Sync & State (visual mesh pos, grounded state)
	let isGrounded = true; // 默认在地面上
	if (characterUpdater && activeVisual && activeBody) {
		characterUpdater.updateCharacterPhysicsSync(activeVisual, activeBody);
		// 获取地面状态，供动画使用
		isGrounded = characterUpdater.isCharacterGrounded();
	}

	// 3. Handle Character Movement Input (Apply velocity based on keys/camera)
	if (characterUpdater && controlsUpdater && activeBody) { // 使用 activeBody
		const keys = controlsUpdater.getKeysState();
		const speed = controlsUpdater.getCurrentSpeed();
		const isSprinting = controlsUpdater.getSprintingState ? controlsUpdater.getSprintingState() : false;

		// Only move if not controlling tank
		if (!controlsUpdater.getTankControlState()) {
			characterUpdater.moveCharacter(keys, activeBody, camera, speed, deltaTime, isSprinting); // 使用 activeBody

			// 处理跳跃输入
			if (keys["Space"] && isGrounded) { // 使用 isGrounded 状态
				characterUpdater.characterJump(activeBody, 6); // 使用 activeBody
			}
		}
	}

	// 4. Handle Character Animation
	if (activeCharacterType === 'Blocky' && activeData) {
		// 调用方块人的程序化动画更新
		_updateBlockyCharacterAnimation(activeData, controlsUpdater, characterUpdater); // 传递所需数据
	} else if (activeCharacterType === 'MilkAnimated' && activeData && activeData.mixer) {
		// 更新动画混合器
		activeData.mixer.update(deltaTime);

		// --- 新增：确保初始动画或当前动画在播放 ---
		if (currentMilkAction && !currentMilkAction.isRunning()) {
			// 如果当前动作没有运行（例如刚切换过来，或者初始加载后），播放它
			currentMilkAction.reset().fadeIn(0.3).play(); // 使用淡入播放
			// console.log(`Playing current milk action: ${Object.keys(activeData.actions).find(key => activeData.actions[key] === currentMilkAction)}`);
		}
		// --- 结束新增 ---

		// --- 移除：不再需要在这里检查 actions 是否为空 ---
		/*
		if (!activeData.actions) { ... }
		else if (Object.keys(activeData.actions).length === 0) { ... }
		*/
		// --- 结束移除 ---

		// 更新动画状态机
		_updateMilkAnimatedCharacterAnimation(activeData, controlsUpdater, isGrounded); // 传递所需数据
	}

	// 5. Update TWEEN (Doors, Subtitles, etc.)
	if (houseUpdater) houseUpdater.updateHouseTweens(now);

	// --- 移除：不再需要单独更新 milkAnimatedData.mixer ---
	// if (milkAnimatedData && milkAnimatedData.mixer) {
	//     milkAnimatedData.mixer.update(deltaTime);
	// }

	// 6. Update Dynamic Terrain
	if (terrainUpdater && debugParams && camera) {
		// Check debugParams if direct flag check is needed
		if (debugParams.generateTerrain) {
			// Assuming debugParams holds the flag
			terrainUpdater.updateDynamicTerrain(scene, camera.position);
		} else {
			// Optionally call a function to hide terrain if needed
			// terrainUpdater.setDynamicTerrainVisibility(false);
		}
	}

	// 7. Update Skybox (if applicable)
	if (skyboxUpdater && debugParams && camera) {
		skyboxUpdater.updateSkybox(camera.position, debugParams.useSkybox, debugParams.followCameraSkybox);
	}

	// 8. Update Ghost Lights
	if (lightingUpdater) lightingUpdater.updateGhostLights(elapsedTime);

	// 9. Update Galaxy
	if (galaxyUpdater) galaxyUpdater.updateGalaxy(elapsedTime);

	// 10. Update Planets (Physics Sync)
	if (planetsUpdater) planetsUpdater.updatePlanetPhysicsSync();

	// 11. Update TV (Video texture, Subtitles, Progress Bar)
	if (tvUpdater) tvUpdater.updateTV(now); // Pass 'now' for TWEEN updates within TV module

	// 12. Update Minimap Camera State
	if (minimapUpdater) minimapUpdater.updateMiniMap();

	// --- Rendering Step ---
	// Clear depth/color buffers (usually done by renderer.render, but good practice)
	// renderer.clear(); // Might not be needed if autoClear is true

	// Render main scene
	renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
	renderer.setScissorTest(false);
	renderer.render(scene, camera);

	// Render minimap (sets its own viewport/scissor)
	if (minimapUpdater) minimapUpdater.renderMiniMap();

	// Render CSS3D (uses its own renderer/scene/camera)
	if (css3dRenderer) css3dRenderer(); // Call the renderCSS3D function
}

// --- 方块人程序化动画逻辑 ---
/**
 * 更新方块人模型的程序化动画。
 * @param {object} blockyData - 方块人角色数据，包含 parts。
 * @param {object} controls - 控制器模块，用于获取按键状态和冲刺状态。
 * @param {object} charUpdater - 角色更新器模块，用于获取地面状态。
 */
function _updateBlockyCharacterAnimation(blockyData, controls, charUpdater) {
    if (!blockyData || !blockyData.parts || !controls || !charUpdater) return;

    const keys = controls.getKeysState();
    const isMoving = keys && (keys["KeyW"] || keys["KeyS"] || keys["KeyA"] || keys["KeyD"]);
    const isGrounded = charUpdater.isCharacterGrounded();
    const isSprinting = controls.getSprintingState ? controls.getSprintingState() : false;

    // Correctly reference parts based on character.js structure
    // head, leftArm, rightArm are direct.
    // body should be bodyContainer for y-rotation and bobbing.
    // leftLeg and rightLeg for rotation should be leftThigh and rightThigh.
    const { head, bodyContainer, leftArm, rightArm, leftThigh, rightThigh } = blockyData.parts;
    // If direct access to the body mesh is needed for other reasons, it would be bodyContainer.children[0] (assuming it's the first child)
    // For this animation, we'll apply transformations to bodyContainer and the thigh pivots.

    // Bobbing and Swinging
    const swingSpeed = isSprinting ? 0.1 : 0.06;
    const bobAmount = isSprinting ? 0.02 : 0.01;

    if (isMoving && isGrounded) {
        // Arm swing
        armSwing += armSwingDirection * swingSpeed;
        if (armSwing > 0.8 || armSwing < -0.8) {
            armSwingDirection *= -1;
        }
        leftArm.rotation.x = armSwing;
        rightArm.rotation.x = -armSwing;

        // Leg swing
        legSwing += legSwingDirection * swingSpeed;
        if (legSwing > 0.8 || legSwing < -0.8) {
            legSwingDirection *= -1;
        }
        leftThigh.rotation.x = -legSwing; // Use leftThigh for rotation
        rightThigh.rotation.x = legSwing;  // Use rightThigh for rotation

        // Body bobbing - apply to bodyContainer
        bodyContainer.position.y = Math.sin(performance.now() * 0.01) * bobAmount;

        // Body rotation based on A/D keys for strafing feel - apply to bodyContainer
        if (keys["KeyA"]) {
            bodyRotationTarget = Math.PI / 16;
        } else if (keys["KeyD"]) {
            bodyRotationTarget = -Math.PI / 16;
        } else {
            bodyRotationTarget = 0;
        }
    } else {
        // Reset to idle pose if not moving or in air
        leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0, 0.1);
        rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0, 0.1);
        leftThigh.rotation.x = THREE.MathUtils.lerp(leftThigh.rotation.x, 0, 0.1); // Use leftThigh
        rightThigh.rotation.x = THREE.MathUtils.lerp(rightThigh.rotation.x, 0, 0.1); // Use rightThigh
        bodyContainer.position.y = THREE.MathUtils.lerp(bodyContainer.position.y, 0, 0.1); // Use bodyContainer
        bodyRotationTarget = 0;
    }

    // Smooth body rotation - apply to bodyContainer
    bodyRotation = THREE.MathUtils.lerp(bodyRotation, bodyRotationTarget, 0.1);
    bodyContainer.rotation.y = bodyRotation;

    // Head look (can be expanded later)
    // head.rotation.y = camera.rotation.y - bodyContainer.rotation.y; // Basic head follow camera, adjust if using bodyContainer
}
// --- 结束 方块人程序化动画逻辑 ---

// --- 新增：动画模型动画状态机 ---
/**
 * Updates the animation state for the MilkAnimated character based on movement.
 * @param {object} milkData - The data object for the MilkAnimated character { model, mixer, actions, ... }.
 * @param {object} controls - The controls module reference to get state { getKeysState, getSprintingState }.
 * @param {boolean} isGrounded - Whether the character is currently on the ground.
 */
function _updateMilkAnimatedCharacterAnimation(milkData, controls, isGrounded) {
	// --- 修改：现在可以假设 milkData.actions 存在且已填充 ---
	if (!milkData || !milkData.actions || typeof milkData.actions !== 'object' || Object.keys(milkData.actions).length === 0 || !controls) {
        console.error("_updateMilkAnimatedCharacterAnimation: Invalid or empty actions object in milkData, or missing controls.", milkData ? milkData.actions : 'milkData missing');
        return;
    }
    const actions = milkData.actions;

	const keys = controls.getKeysState();
    // --- 新增：检查 keys 对象 ---
    // console.log("[Anim Keys] Received keys object:", keys);
    // --- 结束新增 ---

    // --- 修改：安全地计算 isMoving ---
	const isMoving = keys && (keys["KeyW"] || keys["KeyS"] || keys["KeyA"] || keys["KeyD"]);
    // --- 结束修改 ---
	const isSprinting = controls.getSprintingState ? controls.getSprintingState() : false;

	// --- 打印状态变量 ---
    // console.log(`[Anim State] Grounded: ${isGrounded}, Moving: ${isMoving}, Sprinting: ${isSprinting}`);
    // --- 结束打印 ---

	// --- Target Action Name Logic (保持不变) ---
	let targetActionName = 'idle';
    // console.log(`[Anim Branch] Initial target: ${targetActionName}`);

	if (!isGrounded) {
		// console.log("[Anim Branch] Condition: !isGrounded is TRUE");
		targetActionName = 'jump';
	} else if (isMoving) { // <-- 现在 isMoving 应该是 true 或 false
		// console.log("[Anim Branch] Condition: isGrounded is TRUE and isMoving is TRUE");
		targetActionName = isSprinting ? 'run' : 'walk';
		// console.log(`[Anim Branch] Assigned in isMoving branch: ${targetActionName}`);
	} else {
		// console.log("[Anim Branch] Condition: isGrounded is TRUE and isMoving is FALSE");
		targetActionName = 'idle';
	}
    // --- 结束 ---

    // console.log(`[Anim Target] Calculated Target Name: ${targetActionName}`);

	// --- 查找对应的 Action ---
	// ！！这里的查找逻辑现在依赖于 targetActionName 与 GLB 中的名称完全一致！！
	let targetAction = actions[targetActionName];
	let foundMethod = "direct"; // Track how the action was found

	// --- 保持之前的调试日志 ---
	if (!targetAction) {
		foundMethod = "case-insensitive";
		// console.warn(`Animation action "${targetActionName}" not found directly.`);
		const lowerCaseTarget = targetActionName.toLowerCase();
		const foundName = Object.keys(actions).find(name => name.toLowerCase() === lowerCaseTarget);
		if (foundName) {
			targetAction = actions[foundName];
			targetActionName = foundName;
		}
	}
	// --- 结束保持 ---


	if (!targetAction) {
		foundMethod = "fallback";
		// console.warn(`Animation action "${targetActionName}" not found.`);
		// 回退逻辑：优先尝试 'idle' (或包含 idle 的名称)，然后是第一个可用的
		const idleFallbackName = Object.keys(actions).find(name => name.toLowerCase().includes('idle'));
		if (idleFallbackName) {
			targetAction = actions[idleFallbackName];
			targetActionName = idleFallbackName;
		} else {
			const firstFallbackName = Object.keys(actions)[0];
			targetAction = actions[firstFallbackName];
			targetActionName = firstFallbackName;
		}
        // console.warn(`[Anim Warn] Target action "${targetActionName}" (original) not found via ${foundMethod}, falling back to: ${targetActionName}`);
	}

	// --- 新增：打印当前和目标 Action ---
    const currentActionName = currentMilkAction ? Object.keys(actions).find(key => actions[key] === currentMilkAction) : "None";
    // console.log(`[Anim Check] Current: ${currentActionName}, Target: ${targetActionName} (Found via: ${foundMethod})`);
    // --- 结束新增 ---

	if (!targetAction) {
		// console.error("[Anim Error] Catastrophic failure: Could not determine a target action even with fallbacks.");
		return;
	}

	// --- 切换动画 (逻辑保持不变) ---
	if (currentMilkAction !== targetAction) {
		// --- 新增：打印切换信息 ---
        // console.log(`[Anim Switch] Switching: From "${currentActionName}" to "${targetActionName}"`);
        // --- 结束新增 ---
		previousMilkAction = currentMilkAction;
		currentMilkAction = targetAction;

		// 平滑过渡
		if (previousMilkAction) {
			previousMilkAction.fadeOut(0.3); // 0.3 秒淡出
		}

		currentMilkAction
			.reset()
			.setEffectiveTimeScale(1)
			.setEffectiveWeight(1)
			.fadeIn(0.3) // 0.3 秒淡入
			.play();

		// console.log(`Switched animation to: ${targetActionName}`); // 可以取消注释以查看切换日志
	}

	// --- 调整播放速度 (可选, 逻辑保持不变) ---
	// 例如，可以根据实际速度微调行走/跑步动画的速度
	// const speedRatio = controls.getCurrentSpeed() / baseSpeed; // 需要 baseSpeed
	// if (currentMilkAction === actions.Walking || currentMilkAction === actions.Running) {
	//     currentMilkAction.setEffectiveTimeScale(speedRatio);
	// }
}
