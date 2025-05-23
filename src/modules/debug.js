// src/modules/debug.js
import * as THREE from "three";

// Import functions/objects from other modules
import { updateTerrainSettings } from "./terrain.js"; // Assuming terrain module exports terrain noise settings if needed
import { getGalaxyParameters, updateGalaxyParameter } from "./galaxy.js";
import { getMiniMapConfig, updateMiniMapConfig } from "./minimap.js";
import { getSkyboxConfig, updateSkyboxConfig, updateSkyboxTexture } from "./skybox.js";

// --- Module State ---
let sceneRef = null;
let fogRef = null;
let rendererRef = null; // Reference to the main renderer
let textureMapRef = null; // Reference to the texture map/cache

// --- Parameters Object ---
// Consolidate parameters controlled directly by the GUI here
const debugParams = {
	// Environment
	fogEnabled: false,
	fogColor: "#262837",
	fogNear: 1,
	fogFar: 15,
	skyColor: "#87CEEB",
	// Terrain
	generateTerrain: true, // Controls whether dynamic terrain updates run

	// Renderer Settings
	toneMapping: "ACESFilmic", // Will be synced with rendererRef on init
	toneMappingExposure: 1.0, // Will be synced with rendererRef on init
	shadowMapType: "PCFSoft", // Will be synced with rendererRef on init

	// Global Texture Settings (used by the 'apply' button)
	globalMinFilter: "LinearMipmapLinear", // Default high quality
	globalMagFilter: "Linear",
	globalAnisotropy: 1, // Default, will sync with max caps on init
	
	// Physics Debug
	showPhysicsHelpers: false, // 控制是否显示物理体辅助线

	// --- 新增：活动角色选择 ---
	activeCharacter: 'Blocky', // 'Blocky' 或 'MilkAnimated'

	// 体力系统参数
	staminaEnabled: true,      // 是否启用体力系统
	maxStamina: 100,           // 最大体力值
	staminaRegenRate: 20,      // 体力恢复速率（每秒）
	sprintStaminaCost: 5,     // 疾跑体力消耗（每秒）
	jumpStaminaCost: 10,       // 跳跃体力消耗（每次）
	staminaThreshold: 10,      // 体力不足阈值
};

// --- Mappings for GUI Dropdowns ---
const toneMappingOptions = {
	None: THREE.NoToneMapping,
	Linear: THREE.LinearToneMapping,
	Reinhard: THREE.ReinhardToneMapping,
	Cineon: THREE.CineonToneMapping,
	ACESFilmic: THREE.ACESFilmicToneMapping,
	// AgX: THREE.AgXToneMapping, // Check threejs version if using
};

const shadowMapOptions = {
	Basic: THREE.BasicShadowMap,
	PCF: THREE.PCFShadowMap,
	PCFSoft: THREE.PCFSoftShadowMap,
	// VSM: THREE.VSMShadowMap,
};

const textureFilterOptions = {
	Nearest: THREE.NearestFilter,
	Linear: THREE.LinearFilter,
	NearestMipmapNearest: THREE.NearestMipmapNearestFilter,
	LinearMipmapNearest: THREE.LinearMipmapNearestFilter,
	NearestMipmapLinear: THREE.NearestMipmapLinearFilter,
	LinearMipmapLinear: THREE.LinearMipmapLinearFilter,
};

// --- File Inputs ---
let backgroundFileInput = null;
let skyboxFileInput = null;

// --- Custom Debug GUI Elements ---
let debugPanel = null;
let debugContent = null;
let folders = {};

// --- Helper: Create or Get File Input ---
function _createOrGetFileInput(id, acceptTypes, changeCallback) {
	let input = document.getElementById(id);
	if (!input) {
		input = document.createElement("input");
		input.id = id;
		input.type = "file";
		input.style.display = "none";
		document.body.appendChild(input);
		console.log(`Created file input: #${id}`);
	}
	input.accept = acceptTypes;
	// Ensure only one listener is attached
	input.removeEventListener("change", changeCallback); // Remove previous, if any
	input.addEventListener("change", changeCallback);
	return input;
}

// --- Change Callback Handlers ---
function _handleBackgroundFileChange(e) {
	const file = e.target.files[0];
	if (file && sceneRef) {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onloadend = function () {
			// IMPORTANT: Use the main TextureLoader instance passed via modules or script.js
			// Avoid creating a new one here. Assuming textureLoaderRef exists.
			const loader = textureMapRef ? textureLoaderRef : new THREE.TextureLoader(); // Fallback only
			loader.load(reader.result, (texture) => {
				sceneRef.background = texture;
				// Optional: scene.environment affects PBR materials
				sceneRef.environment = texture;
				console.log("Scene background updated from uploaded image.");
				// Update color picker might be complex, maybe disable it?
				// Or try to extract dominant color?
			});
		};
		reader.onerror = function (error) {
			console.error("Error reading background file:", error);
		};
	}
	if (e.target) e.target.value = null; // Reset input
}

function _handleSkyboxFileChange(e) {
	const file = e.target.files[0];
	if (file) {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onloadend = function () {
			let fileTypeHint = "image";
			if (file.type.startsWith("video/")) {
				fileTypeHint = "video";
			} else if (file.type === "image/gif") {
				fileTypeHint = "gif";
			}
			updateSkyboxTexture(reader.result, fileTypeHint); // Call imported function
		};
		reader.onerror = function (error) {
			console.error("Error reading skybox file:", error);
		};
	}
	if (e.target) e.target.value = null; // Reset input
}

// --- Custom Debug GUI Functions ---

// 创建文件夹
function createFolder(id, title) {
	const folder = document.createElement('div');
	folder.className = 'debug-folder';
	folder.id = id;
	
	const header = document.createElement('div');
	header.className = 'debug-folder-header';
	
	const titleEl = document.createElement('div');
	titleEl.className = 'debug-folder-title';
	titleEl.textContent = title;
	
	const toggle = document.createElement('div');
	toggle.className = 'debug-folder-toggle';
	toggle.textContent = '▼';
	
	header.appendChild(titleEl);
	header.appendChild(toggle);
	
	const content = document.createElement('div');
	content.className = 'debug-folder-content';
	
	folder.appendChild(header);
	folder.appendChild(content);
	
	header.addEventListener('click', () => {
		folder.classList.toggle('open');
	});
	
	debugContent.appendChild(folder);
	folders[id] = { element: folder, content: content };
	
	return folder;
}

// 添加控件
function addControl(folderId, type, params) {
	const folderContent = folders[folderId].content;
	const control = document.createElement('div');
	control.className = 'debug-control';
	
	const label = document.createElement('div');
	label.className = 'debug-label';
	label.textContent = params.label || params.name || '';
	
	control.appendChild(label);
	
	let input;
	
	switch(type) {
		case 'checkbox':
			input = document.createElement('input');
			input.type = 'checkbox';
			input.className = 'debug-checkbox';
			input.checked = params.value;
			input.addEventListener('change', () => {
				if (params.onChange) params.onChange(input.checked);
			});
			break;
			
		case 'range':
			input = document.createElement('input');
			input.type = 'range';
			input.className = 'debug-input';
			input.min = params.min || 0;
			input.max = params.max || 1;
			input.step = params.step || 0.01;
			input.value = params.value;
			
			const valueDisplay = document.createElement('span');
			valueDisplay.textContent = params.value;
			valueDisplay.style.marginLeft = '8px';
			valueDisplay.style.minWidth = '40px';
			valueDisplay.style.textAlign = 'right';
			
			input.addEventListener('input', () => {
				valueDisplay.textContent = parseFloat(input.value).toFixed(2);
				if (params.onChange) params.onChange(parseFloat(input.value));
			});
			
			control.appendChild(input);
			control.appendChild(valueDisplay);
			break;
			
		case 'color':
			input = document.createElement('input');
			input.type = 'color';
			input.className = 'debug-input';
			input.value = params.value;
			input.addEventListener('change', () => {
				if (params.onChange) params.onChange(input.value);
			});
			break;
			
		case 'select':
			input = document.createElement('select');
			input.className = 'debug-select';
			
			for (const option of params.options) {
				const optionEl = document.createElement('option');
				optionEl.value = option;
				optionEl.textContent = option;
				if (option === params.value) {
					optionEl.selected = true;
				}
				input.appendChild(optionEl);
			}
			
			input.addEventListener('change', () => {
				if (params.onChange) params.onChange(input.value);
			});
			break;
			
		case 'button':
			input = document.createElement('button');
			input.className = 'debug-button';
			input.textContent = params.label || 'Button';
			input.addEventListener('click', () => {
				if (params.onClick) params.onClick();
			});
			break;
			
		default:
			input = document.createElement('input');
			input.type = 'text';
			input.className = 'debug-input';
			input.value = params.value;
			input.addEventListener('change', () => {
				if (params.onChange) params.onChange(input.value);
			});
	}
	
	if (type !== 'range') {
		control.appendChild(input);
	}
	
	folderContent.appendChild(control);
	return control;
}

// 使Debug面板可拖动
function makeDraggable(element) {
	const header = element.querySelector('#debug-header');
	let isDragging = false;
	let offsetX, offsetY;
	
	header.addEventListener('mousedown', (e) => {
		isDragging = true;
		offsetX = e.clientX - element.getBoundingClientRect().left;
		offsetY = e.clientY - element.getBoundingClientRect().top;
		element.style.cursor = 'grabbing';
	});
	
	document.addEventListener('mousemove', (e) => {
		if (!isDragging) return;
		
		const x = e.clientX - offsetX;
		const y = e.clientY - offsetY;
		
		// 确保面板不会超出屏幕
		const maxX = window.innerWidth - element.offsetWidth;
		const maxY = window.innerHeight - element.offsetHeight;
		
		element.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
		element.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
	});
	
	document.addEventListener('mouseup', () => {
		isDragging = false;
		element.style.cursor = 'auto';
	});
}

// --- 体力条相关变量 ---
let staminaBarElement = null;
let staminaBarContainer = null;
let currentStamina = debugParams.maxStamina;
let isStaminaDepleted = false;
let lastStaminaUpdateTime = 0;

// 初始化自定义Debug GUI
function initCustomDebugGUI() {
	debugPanel = document.getElementById('custom-debug-panel');
	debugContent = document.getElementById('debug-content');
	
	if (!debugPanel || !debugContent) {
		console.error('Debug panel elements not found in DOM');
		return;
	}

	// 初始化体力条元素
	staminaBarElement = document.getElementById('stamina-bar');
	staminaBarContainer = document.getElementById('stamina-bar-container');
	
	if (!staminaBarElement || !staminaBarContainer) {
		console.warn('Stamina bar elements not found in DOM');
	} else {
		// 设置初始体力值
		updateStaminaBar(debugParams.maxStamina);
	}
	
	// 设置面板可拖动
	makeDraggable(debugPanel);
	
	// 设置面板折叠/展开
	const toggleButton = document.getElementById('debug-toggle');
	toggleButton.addEventListener('click', () => {
		const isCollapsed = debugContent.style.display === 'none';
		debugContent.style.display = isCollapsed ? 'block' : 'none';
		toggleButton.textContent = isCollapsed ? '▼' : '▲';
	});

	// --- 新增：创建角色设置文件夹 ---
	createFolder('character', '角色设置');
	addControl('character', 'select', {
		label: '活动角色',
		value: debugParams.activeCharacter,
		options: ['Blocky', 'MilkAnimated'],
		onChange: (value) => {
			debugParams.activeCharacter = value;
			console.log(`Active character changed to: ${value}`);
			// Dynamically import script.js to avoid circular dependencies if needed,
			// or ensure script.js is loaded and switchActiveCharacter is globally accessible/imported.
			import('../script.js').then(script => {
				 if (script.switchActiveCharacter) {
					 script.switchActiveCharacter(value);
				 } else {
					 console.error("switchActiveCharacter function not found in script.js");
				 }
			}).catch(err => console.error("Error importing script.js for switching character:", err));
		}
	});
	
	// 创建环境文件夹
	createFolder('environment', '环境设置');
	addControl('environment', 'checkbox', {
		label: '启用雾效',
		value: debugParams.fogEnabled,
		onChange: (value) => {
			debugParams.fogEnabled = value;
			if (value) {
				if (!sceneRef.fog) {
					sceneRef.fog = new THREE.Fog(debugParams.fogColor, debugParams.fogNear, debugParams.fogFar);
					fogRef = sceneRef.fog;
				} else {
					sceneRef.fog.color.set(debugParams.fogColor);
					sceneRef.fog.near = debugParams.fogNear;
					sceneRef.fog.far = debugParams.fogFar;
				}
			} else {
				sceneRef.fog = null;
				fogRef = null;
			}
		}
	});
	
	addControl('environment', 'color', {
		label: '雾效颜色',
		value: debugParams.fogColor,
		onChange: (value) => {
			debugParams.fogColor = value;
			if (fogRef) fogRef.color.set(value);
		}
	});
	
	addControl('environment', 'range', {
		label: '雾效近距离',
		value: debugParams.fogNear,
		min: 0.1,
		max: 50,
		step: 0.1,
		onChange: (value) => {
			debugParams.fogNear = value;
			if (fogRef) fogRef.near = value;
		}
	});
	
	addControl('environment', 'range', {
		label: '雾效远距离',
		value: debugParams.fogFar,
		min: 1,
		max: 100,
		step: 0.1,
		onChange: (value) => {
			debugParams.fogFar = value;
			if (fogRef) fogRef.far = value;
		}
	});
	
	addControl('environment', 'color', {
		label: '天空颜色',
		value: debugParams.skyColor,
		onChange: (value) => {
			debugParams.skyColor = value;
			if (sceneRef && !(sceneRef.background instanceof THREE.Texture)) {
				sceneRef.background = new THREE.Color(value);
			} else if (!sceneRef?.background) {
				sceneRef.background = new THREE.Color(value);
			}
		}
	});
	
	backgroundFileInput = _createOrGetFileInput(
		"background-file-input",
		"image/jpeg, image/png",
		_handleBackgroundFileChange
	);
	
	addControl('environment', 'button', {
		label: '上传背景图片',
		onClick: () => backgroundFileInput.click()
	});
	
	// 创建渲染器设置文件夹
	createFolder('renderer', '渲染器设置');
	addControl('renderer', 'select', {
		label: '色调映射',
		value: debugParams.toneMapping,
		options: Object.keys(toneMappingOptions),
		onChange: (value) => {
			debugParams.toneMapping = value;
			if (rendererRef) rendererRef.toneMapping = toneMappingOptions[value];
		}
	});
	
	addControl('renderer', 'range', {
		label: '曝光度',
		value: debugParams.toneMappingExposure,
		min: 0.1,
		max: 2.0,
		step: 0.05,
		onChange: (value) => {
			debugParams.toneMappingExposure = value;
			if (rendererRef) rendererRef.toneMappingExposure = value;
		}
	});
	
	addControl('renderer', 'select', {
		label: '阴影类型',
		value: debugParams.shadowMapType,
		options: Object.keys(shadowMapOptions),
		onChange: (value) => {
			debugParams.shadowMapType = value;
			if (rendererRef && sceneRef) {
				rendererRef.shadowMap.type = shadowMapOptions[value];
				// Force material recompilation for shadow changes
				sceneRef.traverse((child) => {
					if (child.material) child.material.needsUpdate = true;
				});
				console.log("Shadow map type changed. Materials need update.");
			}
		}
	});
	
	// 创建物理调试文件夹
	createFolder('physics', '物理调试');
	addControl('physics', 'checkbox', {
		label: '显示物理辅助线',
		value: debugParams.showPhysicsHelpers,
		onChange: (value) => {
			debugParams.showPhysicsHelpers = value;
			import("./models.js").then(Models => {
				Models.togglePhysicsHelpers(value);
			});
		}
	});

	// 创建银河系设置文件夹
	createFolder('galaxy', '银河系设置');
	const galaxyParams = getGalaxyParameters();
	
	addControl('galaxy', 'range', {
		label: '粒子数量',
		value: galaxyParams.count,
		min: 100,
		max: 1000000,
		step: 100,
		onChange: (value) => updateGalaxyParameter("count", value, sceneRef)
	});
	
	addControl('galaxy', 'range', {
		label: '半径',
		value: galaxyParams.radius,
		min: 0.01,
		max: 20,
		step: 0.01,
		onChange: (value) => updateGalaxyParameter("radius", value, sceneRef)
	});
	
	addControl('galaxy', 'range', {
		label: '分支数',
		value: galaxyParams.branches,
		min: 2,
		max: 20,
		step: 1,
		onChange: (value) => updateGalaxyParameter("branches", value, sceneRef)
	});
	
	addControl('galaxy', 'range', {
		label: '随机性',
		value: galaxyParams.randomness,
		min: 0,
		max: 2,
		step: 0.001,
		onChange: (value) => updateGalaxyParameter("randomness", value, sceneRef)
	});
	
	addControl('galaxy', 'range', {
		label: '随机性强度',
		value: galaxyParams.randomnessPower,
		min: 1,
		max: 10,
		step: 0.001,
		onChange: (value) => updateGalaxyParameter("randomnessPower", value, sceneRef)
	});
	
	addControl('galaxy', 'color', {
		label: '内部颜色',
		value: galaxyParams.insideColor,
		onChange: (value) => updateGalaxyParameter("insideColor", value, sceneRef)
	});
	
	addControl('galaxy', 'color', {
		label: '外部颜色',
		value: galaxyParams.outsideColor,
		onChange: (value) => updateGalaxyParameter("outsideColor", value, sceneRef)
	});
	
	addControl('galaxy', 'range', {
		label: '粒子大小',
		value: galaxyParams.size,
		min: 0.001,
		max: 0.1,
		step: 0.001,
		onChange: (value) => updateGalaxyParameter("size", value, sceneRef)
	});
	
	// 创建小地图设置文件夹
	createFolder('minimap', '小地图设置');
	const miniMapParams = getMiniMapConfig();
	
	addControl('minimap', 'checkbox', {
		label: '显示小地图',
		value: miniMapParams.enabled,
		onChange: (value) => updateMiniMapConfig("enabled", value)
	});
	
	addControl('minimap', 'range', {
		label: '视野范围',
		value: miniMapParams.viewRange,
		min: 10,
		max: 200,
		step: 1,
		onChange: (value) => updateMiniMapConfig("viewRange", value)
	});
	
	addControl('minimap', 'range', {
		label: '缩放',
		value: miniMapParams.zoom,
		min: 0.2,
		max: 5.0,
		step: 0.1,
		onChange: (value) => updateMiniMapConfig("zoom", value)
	});
	
	addControl('minimap', 'range', {
		label: '相机高度',
		value: miniMapParams.cameraHeight,
		min: 20,
		max: 300,
		step: 5,
		onChange: (value) => updateMiniMapConfig("cameraHeight", value)
	});
	
	addControl('minimap', 'checkbox', {
		label: '跟随角色旋转',
		value: miniMapParams.rotateWithCharacter,
		onChange: (value) => updateMiniMapConfig("rotateWithCharacter", value)
	});
	
	addControl('minimap', 'checkbox', {
		label: '显示轨迹',
		value: miniMapParams.trailEnabled,
		onChange: (value) => updateMiniMapConfig("trailEnabled", value)
	});
	
	addControl('minimap', 'color', {
		label: '轨迹颜色',
		value: miniMapParams.trailColor,
		onChange: (value) => updateMiniMapConfig("trailColor", value)
	});
	
	addControl('minimap', 'range', {
		label: '轨迹线段大小',
		value: miniMapParams.trailDashSize,
		min: 0.05,
		max: 1.0,
		step: 0.01,
		onChange: (value) => updateMiniMapConfig("trailDashSize", value)
	});
	
	addControl('minimap', 'range', {
		label: '轨迹间隔大小',
		value: miniMapParams.trailGapSize,
		min: 0.05,
		max: 1.0,
		step: 0.01,
		onChange: (value) => updateMiniMapConfig("trailGapSize", value)
	});
	
	// 创建天空盒设置文件夹
	createFolder('skybox', '天空盒设置');
	const skyboxConfig = getSkyboxConfig();
	
	addControl('skybox', 'checkbox', {
		label: '启用天空盒',
		value: skyboxConfig.enabled,
		onChange: (value) => updateSkyboxConfig("enabled", value)
	});
	
	addControl('skybox', 'checkbox', {
		label: '跟随相机',
		value: skyboxConfig.followCamera,
		onChange: (value) => updateSkyboxConfig("followCamera", value)
	});
	
	skyboxFileInput = _createOrGetFileInput(
		"skybox-file-input",
		"image/jpeg, image/png, image/gif, video/mp4, video/webm",
		_handleSkyboxFileChange
	);
	
	addControl('skybox', 'button', {
		label: '上传天空盒纹理',
		onClick: () => skyboxFileInput.click()
	});

	// 创建体力系统设置文件夹
	createFolder('stamina', '体力系统');
	
	addControl('stamina', 'checkbox', {
		label: '启用体力系统',
		value: debugParams.staminaEnabled,
		onChange: (value) => {
			debugParams.staminaEnabled = value;
			staminaBarContainer.style.display = value ? 'block' : 'none';
			if (value) {
				// 重置体力值
				currentStamina = debugParams.maxStamina;
				updateStaminaBar(currentStamina);
			}
		}
	});
	
	addControl('stamina', 'range', {
		label: '最大体力值',
		value: debugParams.maxStamina,
		min: 50,
		max: 200,
		step: 10,
		onChange: (value) => {
			debugParams.maxStamina = value;
			if (currentStamina > value) {
				currentStamina = value;
				updateStaminaBar(currentStamina);
			}
		}
	});
	
	addControl('stamina', 'range', {
		label: '体力恢复速率',
		value: debugParams.staminaRegenRate,
		min: 1,
		max: 50,
		step: 1,
		onChange: (value) => debugParams.staminaRegenRate = value
	});
	
	addControl('stamina', 'range', {
		label: '疾跑体力消耗',
		value: debugParams.sprintStaminaCost,
		min: 1,
		max: 50,
		step: 1,
		onChange: (value) => debugParams.sprintStaminaCost = value
	});
	
	addControl('stamina', 'range', {
		label: '跳跃体力消耗',
		value: debugParams.jumpStaminaCost,
		min: 5,
		max: 50,
		step: 1,
		onChange: (value) => debugParams.jumpStaminaCost = value
	});
	
	addControl('stamina', 'range', {
		label: '体力不足阈值',
		value: debugParams.staminaThreshold,
		min: 1,
		max: 30,
		step: 1,
		onChange: (value) => debugParams.staminaThreshold = value
	});
	
	/*************************************************************************
	// 默认打开所有文件夹
	Object.values(folders).forEach(folder => {
		folder.element.classList.add('open');
	});
	*/
}

// --- Exported Functions ---

/**
 * Initializes the custom Debug GUI interface and sets up controls.
 * @param {THREE.Scene} scene - The main scene reference.
 * @param {THREE.WebGLRenderer} renderer - The main renderer reference.
 * @param {Map<string, THREE.Texture>} [textureMap] - Optional map of named textures.
 * @param {THREE.Fog} [fogInstance] - Optional reference to the scene's fog object.
 */
export function initDebugGUI(scene, renderer, textureMap, fogInstance) {
	if (!renderer) {
		console.error("Renderer is required for Debug GUI initialization!");
		return;
	}

	sceneRef = scene;
	rendererRef = renderer; // Store renderer reference
	textureMapRef = textureMap; // Store texture map reference
	fogRef = fogInstance;

	// --- Sync initial debugParams state from references ---
	debugParams.fogEnabled = !!sceneRef?.fog;
	if (sceneRef?.fog) {
		debugParams.fogColor = `#${sceneRef.fog.color.getHexString()}`;
		debugParams.fogNear = sceneRef.fog.near;
		debugParams.fogFar = sceneRef.fog.far;
	}
	if (sceneRef?.background instanceof THREE.Color) {
		debugParams.skyColor = `#${sceneRef.background.getHexString()}`;
	}
	// Sync renderer params
	for (const name in toneMappingOptions) {
		if (toneMappingOptions[name] === rendererRef.toneMapping) {
			debugParams.toneMapping = name;
			break;
		}
	}
	debugParams.toneMappingExposure = rendererRef.toneMappingExposure;
	for (const name in shadowMapOptions) {
		if (shadowMapOptions[name] === rendererRef.shadowMap.type) {
			debugParams.shadowMapType = name;
			break;
		}
	}
	// Sync anisotropy default with max capability
	debugParams.globalAnisotropy = rendererRef.capabilities.getMaxAnisotropy();

	// 初始化自定义Debug GUI
	initCustomDebugGUI();

	console.log("Custom Debug GUI initialized");
}

/**
 * Returns a reference to the debug parameters object.
 * @returns {object} The debug parameters object.
 */
export function getDebugParams() {
	return debugParams;
}

// --- 新增：获取当前活动角色类型的函数 ---
/**
 * Returns the currently selected active character type.
 * @returns {string} 'Blocky' or 'MilkAnimated'
 */
export function getActiveCharacterType() {
    return debugParams.activeCharacter;
}

/**
 * Applies global texture settings to all loaded textures in the texture map.
 */
export function applyGlobalTextureSettings() {
	if (!textureMapRef) {
		console.warn("No texture map available for global settings.");
		return;
	}

	const minFilter = textureFilterOptions[debugParams.globalMinFilter];
	const magFilter = textureFilterOptions[debugParams.globalMagFilter];
	const anisotropy = debugParams.globalAnisotropy;

	let count = 0;
	textureMapRef.forEach((texture, key) => {
		if (texture && texture.isTexture) {
			texture.minFilter = minFilter;
			texture.magFilter = magFilter;
			texture.anisotropy = anisotropy;
			texture.needsUpdate = true;
			count++;
		}
	});

	console.log(`Applied global texture settings to ${count} textures.`);
}

/**
 * Updates the debug GUI when a parameter changes externally.
 * @param {string} paramName - The name of the parameter to update.
 * @param {any} value - The new value.
 */
export function updateDebugParam(paramName, value) {
	if (paramName in debugParams) {
		debugParams[paramName] = value;
		// 如果需要，这里可以添加更新GUI控件的逻辑
		console.log(`Debug parameter ${paramName} updated to:`, value);
	}
}

/**
 * 显示或隐藏调试面板
 * @param {boolean} visible - 是否显示
 */
export function setDebugPanelVisible(visible) {
	if (debugPanel) {
		debugPanel.style.display = visible ? 'block' : 'none';
	}
}

/**
 * 添加自定义控件到指定文件夹
 * @param {string} folderId - 文件夹ID
 * @param {string} type - 控件类型
 * @param {object} params - 控件参数
 */
export function addCustomControl(folderId, type, params) {
	if (!folders[folderId]) {
		createFolder(folderId, params.folderTitle || folderId);
	}
	return addControl(folderId, type, params);
}

/**
 * 更新体力条显示
 * @param {number} value - 当前体力值
 */
function updateStaminaBar(value) {
	if (!staminaBarElement) return;
	
	const percentage = Math.max(0, Math.min(100, (value / debugParams.maxStamina) * 100));
	staminaBarElement.style.width = `${percentage}%`;
	
	// 当体力低于阈值时，改变颜色
	if (percentage <= (debugParams.staminaThreshold / debugParams.maxStamina) * 100) {
		staminaBarElement.classList.add('stamina-depleted');
		isStaminaDepleted = true;
	} else {
		staminaBarElement.classList.remove('stamina-depleted');
		isStaminaDepleted = false;
	}
}

/**
 * 消耗体力
 * @param {number} amount - 消耗的体力量
 * @returns {boolean} - 是否有足够的体力
 */
export function consumeStamina(amount) {
	if (!debugParams.staminaEnabled) return true;
	
	if (currentStamina > amount) {
		currentStamina -= amount;
		updateStaminaBar(currentStamina);
		return true;
	} else {
		// 体力不足
		return false;
	}
}

/**
 * 恢复体力
 * @param {number} amount - 恢复的体力量
 */
export function regenerateStamina(amount) {
	if (!debugParams.staminaEnabled) return;
	
	currentStamina = Math.min(debugParams.maxStamina, currentStamina + amount);
	updateStaminaBar(currentStamina);
}

/**
 * 更新体力状态，应在游戏循环中调用
 * @param {number} deltaTime - 帧间隔时间（秒）
 * @param {boolean} isSprinting - 是否正在疾跑
 */
export function updateStamina(deltaTime, isSprinting) {
	if (!debugParams.staminaEnabled) return;
	
	// 当前时间
	const now = performance.now();
	
	// 确保至少经过了一定的时间间隔再更新（避免过于频繁的更新）
	if (now - lastStaminaUpdateTime < 100) return;
	
	lastStaminaUpdateTime = now;
	
	if (isSprinting) {
		// 疾跑消耗体力
		currentStamina = Math.max(0, currentStamina - debugParams.sprintStaminaCost * deltaTime);
	} else {
		// 恢复体力
		currentStamina = Math.min(debugParams.maxStamina, currentStamina + debugParams.staminaRegenRate * deltaTime);
	}
	
	updateStaminaBar(currentStamina);
}

/**
 * 跳跃消耗体力
 * @returns {boolean} - 是否有足够的体力跳跃
 */
export function canJump() {
	if (!debugParams.staminaEnabled) return true;
	
	return consumeStamina(debugParams.jumpStaminaCost);
}

/**
 * 检查是否有足够的体力进行疾跑
 * @returns {boolean} - 是否有足够的体力疾跑
 */
export function canSprint() {
	if (!debugParams.staminaEnabled) return true;
	
	return currentStamina > debugParams.staminaThreshold;
}

/**
 * 获取当前体力值
 * @returns {number} - 当前体力值
 */
export function getCurrentStamina() {
	return currentStamina;
}

/**
 * 获取最大体力值
 * @returns {number} - 最大体力值
 */
export function getMaxStamina() {
	return debugParams.maxStamina;
}

/**
 * 重置体力值
 */
export function resetStamina() {
	currentStamina = debugParams.maxStamina;
	updateStaminaBar(currentStamina);
}

/**
 * 设置体力条可见性
 * @param {boolean} visible - 是否可见
 */
export function setStaminaBarVisible(visible) {
	if (staminaBarContainer) {
		staminaBarContainer.style.display = visible ? 'block' : 'none';
	}
}