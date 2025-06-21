// src/script.js
import "./style.css"; // Import main styles
import * as THREE from "three";
import * as CANNON from "cannon-es";
import * as TWEEN from "@tweenjs/tween.js"; // Needed by house.js, tv.js
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

// Import Modules (using namespaces for clarity)
import * as Physics from "./modules/physics.js";
import * as Lighting from "./modules/lighting.js";
import * as House from "./modules/house.js";
import * as Graves from "./modules/graves.js";
import * as Character from "./modules/character.js";
import * as Terrain from "./modules/terrain.js";
import * as Models from "./modules/models.js";
import * as Planets from "./modules/planets.js";
import * as SoccerField from "./modules/soccerfield.js";
import * as Galaxy from "./modules/galaxy.js";
import * as TV from "./modules/tv.js";
import * as Text from "./modules/text.js";
import * as CSS3D from "./modules/css3d.js";
import * as Controls from "./modules/controlsAndResize.js";
import * as MiniMap from "./modules/minimap.js";
import * as Debug from "./modules/debug.js";
import * as Animate from "./modules/animate.js";
import * as Skybox from "./modules/skybox.js";

// --- DOM Elements ---
const loadingScreen = document.getElementById("loading-screen");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const css3dContainer = document.getElementById("iframeContainer");
const coordinatesElement = document.getElementById("player-coordinates");
const fullscreenButton = document.getElementById("fullscreen-button");
const instructionsElement = document.getElementById("操作手册");

// --- Loading Manager ---
const manager = new THREE.LoadingManager();
// (Keep existing manager setup: onStart, onLoad, onProgress, onError)
manager.onStart = (url, itemsLoaded, itemsTotal) => {
	console.log(`Started loading: ${url} (${itemsLoaded}/${itemsTotal})`);
	loadingScreen.style.display = "flex";
	loadingScreen.style.opacity = "1";
	progressBar.style.width = "0%";
	progressText.textContent = "Loading... 0%";
};
manager.onLoad = () => {
	console.log("Loading complete!");
	let opacity = 1;
	const fadeOutInterval = setInterval(() => {
		opacity -= 0.05;
		loadingScreen.style.opacity = opacity;
		if (opacity <= 0) {
			clearInterval(fadeOutInterval);
			loadingScreen.style.display = "none";
			Animate.startAnimateLoop();
			console.log("Animation loop started.");
		}
	}, 30);
};
manager.onProgress = (url, itemsLoaded, itemsTotal) => {
	const progress = (itemsLoaded / itemsTotal) * 100;
	progressBar.style.width = `${progress}%`;
	progressText.textContent = `Loading... ${Math.round(progress)}% (${itemsLoaded}/${itemsTotal})`;
	console.log(`Loading file: ${url} (${itemsLoaded}/${itemsTotal})`);
};
manager.onError = (url) => {
	console.error(`Error loading: ${url}`);
	progressText.textContent = `Error loading: ${url}`;
};

// --- Core Three.js Setup ---
const scene = new THREE.Scene();
const clock = new THREE.Clock();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15); // Initial position before controls take over

const renderer = new THREE.WebGLRenderer({
	antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Apply tone mapping
renderer.toneMappingExposure = 0.8; // Default exposure (can be tweaked in debug)
// renderer.outputEncoding = THREE.LinearEncoding; // Default in r148+
document.body.appendChild(renderer.domElement);

// --- Physics Setup ---
const world = Physics.initPhysics();
const groundPhysicsBody = Physics.createGroundPhysics(world);

// --- Loaders ---
const textureLoader = new THREE.TextureLoader(manager);
const fontLoader = new FontLoader(manager);
const gltfLoader = new GLTFLoader(manager);

// --- Load Shared Textures & Materials (using Map) ---
const textureMap = new Map();

function loadTexture(key, path) {
	const texture = textureLoader.load(path);
	textureMap.set(key, texture);
	return texture;
}

// Load textures
textureMap.set("matcap_5", textureLoader.load("textures/matcaps/5.png"));
textureMap.set("matcap_7", textureLoader.load("textures/matcaps/7.png"));
textureMap.set("matcap_8", textureLoader.load("textures/matcaps/8.png"));
const terrainTexture = loadTexture("terrain_texture", "textures/floor.jpg");
const grassColorTexture = loadTexture("grassColor", "textures/grass/color.jpg");
const grassAOTexture = loadTexture("grassAO", "textures/grass/ambientOcclusion.jpg");
const grassNormalTexture = loadTexture("grassNormal", "textures/grass/normal.jpg");
const grassRoughnessTexture = loadTexture("grassRoughness", "textures/grass/roughness.jpg");
const leftAvatarTexture = loadTexture("leftAvatar", "./icons/left.png");
const rightAvatarTexture = loadTexture("rightAvatar", "./icons/right.png");

// --- Setup initial texture properties ---
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
console.log(`Max Anisotropy Supported: ${maxAnisotropy}`);
textureMap.forEach((texture, key) => {
	if (texture instanceof THREE.Texture && !(texture instanceof THREE.VideoTexture) && !key.startsWith("matcap")) {
		texture.minFilter = THREE.LinearMipmapLinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.anisotropy = maxAnisotropy;
		texture.needsUpdate = true; // Force update after changing properties
	}
	// Optional: Set encoding if needed (usually handled by defaults in newer threejs)
	// if (key !== 'matcap_5' && key !== 'matcap_7' && key !== 'matcap_8') {
	//     texture.encoding = THREE.sRGBEncoding;
	// }
});
console.log(`Applied initial Anisotropy: ${maxAnisotropy} to applicable textures.`);

// Create materials using textures from the map
const materials = {
	matcap_5: new THREE.MeshMatcapMaterial({ map: textureMap.get("matcap_5") }),
	matcap_7: new THREE.MeshMatcapMaterial({ map: textureMap.get("matcap_7") }),
	matcap_8: new THREE.MeshMatcapMaterial({ map: textureMap.get("matcap_8") }),
	terrain_texture: textureMap.get("terrain_texture"),
};

// --- Initialize Modules (Order can matter)-------------------------------------------------------------
// Modules needing assets first
Text.initTextSystem(fontLoader, {
	matcap_8: materials.matcap_8,
	matcap_7: materials.matcap_7,
	leftAvatar: textureMap.get("leftAvatar"),
	rightAvatar: textureMap.get("rightAvatar"),
});
Galaxy.initGalaxy(renderer);
Planets.initPlanets(textureLoader);
Terrain.initDynamicTerrain(textureMap.get("terrain_texture"), true, 5); // Use generateTerrain default from debugParams later if needed
Skybox.initSkybox(scene, textureLoader, { enabled: true, followCamera: true });

// --- Room Dimensions and Texts (Copied from original 1.html) ---
const roomWidth = 20;
const roomHeight = 10;
const roomDepth = 30; // Increased depth for corridor effect
const roomTextsSet1 = {
	left: "WHERE",
	back: "IS MY",
	right: "HOME",
};
const roomTextsSet2 = {
	left: "", // Or keep "WHERE"
	back: "IT'S BEEN A WHILE\nSINCE YOU FELT RIGHT",
	right: "", // Or keep "HOME"
};

// --- Create Scene Objects ---
const houseGroup = House.createHouse(scene, world, textureLoader); // House loads own textures
Lighting.setupLighting(scene, houseGroup);
Lighting.setupGhostLights(scene);
Graves.createGraves(scene, fontLoader, "fonts/helvetiker_regular.typeface.json");
// --- 修改：创建角色数据对象 ---
const blockyCharacterData = Character.createCharacter(scene, world, new CANNON.Vec3(0, 3, 16));
// --- 新增：创建共享的角色数据容器 ---
const characterDatas = {
	blocky: blockyCharacterData,
	milkAnimated: null, // 初始化为 null
};
// --- 结束修改 ---
// --- 新增：为动画角色数据准备变量 ---
let milkAnimatedCharacterData = null; // 将包含 { model, mixer, animations, characterBody }
const staticFloor = Terrain.createStaticFloor(scene, {
	// Pass required textures
	grassColor: textureMap.get("grassColor"),
	grassAO: textureMap.get("grassAO"),
	grassNormal: textureMap.get("grassNormal"),
	grassRoughness: textureMap.get("grassRoughness"),
});
const soccerFieldData = SoccerField.createSoccerField(scene, world);
const planetObjects = Planets.createAllPlanets(scene, world);
Galaxy.generateGalaxy(scene);

// --- Position Planets ---
const planetBounds = { xzMin: -150, xzMax: 150, yMin: 10, yMax: 80 };
Planets.randomizePlanetPositions(planetBounds.xzMin, planetBounds.xzMax, planetBounds.yMin, planetBounds.yMax, [
	"Sun",
	"Earth",
]);

// --- Load Models ---
Models.loadMitaRoomModel(gltfLoader, scene);
Models.loadBathroomModel(gltfLoader, scene, world);
Models.loadUniformModel(gltfLoader, scene);
Models.loadGardenModel(gltfLoader, scene, {
	// 加载花园模型
	scale: new THREE.Vector3(1.5, 1.5, 1.5),
	addPhysics: true,
});

// --- 修改：加载带动画的模型并创建物理体 ---
Models.loadMilkAnimatedModel(
	gltfLoader,
	scene,
	(loadedData) => {
		console.log("Animated Milk model data available:", loadedData);
		// 假设 Character 模块有一个函数来创建动画模型的物理体
		// 这个函数需要知道模型的初始位置、大小等信息，并返回物理体
		// 注意：这里需要确保 Character.createAnimatedCharacterPhysics 存在且功能正确
		const initialPos = new CANNON.Vec3(2, 3, 15); // 为动画角色设置一个不同的初始位置
		const physicsBody = Character.createAnimatedCharacterPhysics(world, initialPos /*, 其他可能的参数如模型尺寸 */);

		if (physicsBody && loadedData.mixer && loadedData.animations) {
			// <-- 确保 mixer 和 animations 存在
			// --- 新增：在这里创建 Actions ---
			const actions = {};
			loadedData.animations.forEach((clip) => {
				const action = loadedData.mixer.clipAction(clip);
				actions[clip.name] = action; // 使用 GLB 中的实际名称作为键

				// 设置循环模式
				if (
					clip.name.toLowerCase().includes("idle") ||
					clip.name.toLowerCase().includes("walk") ||
					clip.name.toLowerCase().includes("run")
				) {
					action.loop = THREE.LoopRepeat;
				} else {
					action.loop = THREE.LoopOnce;
					action.clampWhenFinished = true; // 对于非循环动画，停在最后一帧
				}
			});
			console.log("Created actions in script.js callback:", actions);
			// --- 结束新增 ---
			// --- 修改：直接更新共享对象 characterDatas 的属性 ---
			characterDatas.milkAnimated = {
				// <--- 更新共享对象
				...loadedData,
				characterBody: physicsBody,
				actions: actions, // <--- 使用上面创建的 actions 对象
				// ... 其他需要的属性 ...
			};
			console.log("Updated shared characterDatas with Animated Milk data:", characterDatas.milkAnimated);
			// --- 结束修改 ---

			// --- 新增：设置并播放初始动画 (例如 'idle') ---
			// 尝试找到 'idle' 动画 (忽略大小写)
			const idleActionName = Object.keys(actions).find((name) => name.toLowerCase() === "idle");
			let initialAction = null;
			if (idleActionName) {
				initialAction = actions[idleActionName];
			} else {
				// 如果找不到 'idle'，尝试找第一个包含 'idle' 的，或者用第一个动画作为备用
				const fallbackIdleName = Object.keys(actions).find((name) => name.toLowerCase().includes("idle"));
				if (fallbackIdleName) {
					initialAction = actions[fallbackIdleName];
					console.warn(`Could not find exact 'idle' action, using fallback: ${fallbackIdleName}`);
				} else if (Object.keys(actions).length > 0) {
					const firstActionName = Object.keys(actions)[0];
					initialAction = actions[firstActionName];
					console.warn(`Could not find any 'idle' action, using first available: ${firstActionName}`);
				}
			}

			if (initialAction) {
				// Animate 模块需要知道初始 action，以便在状态机中正确管理
				Animate.setInitialMilkAction(initialAction); // <-- 需要在 Animate 中添加此函数
				// 注意：我们不在 script.js 中直接调用 play()，
				// 因为模型初始是隐藏的，动画循环开始后由 Animate 模块管理播放。
				console.log(
					`Initial milk action set in Animate module: ${Object.keys(actions).find(
						(key) => actions[key] === initialAction
					)}`
				);
			} else {
				console.error("Failed to find any initial animation action for MilkAnimated.");
			}
			// --- 结束新增 ---

			// 初始时隐藏动画模型并移除其物理体
			if (characterDatas.milkAnimated.model) {
				characterDatas.milkAnimated.model.visible = false;
			}
			if (characterDatas.milkAnimated.characterBody) {
				world.removeBody(characterDatas.milkAnimated.characterBody);
				console.log("Temporarily removed animated character body from world.");
			}

			// --- 无需额外通知，因为模块持有的是 characterDatas 对象的引用 ---
		} else {
			console.error("Failed to create physics body for animated milk character.");
		}
	},
	{
		/* 可以在这里传递加载选项，如初始位置，但物理体位置应分开处理 */
	}
);

// --- Setup Static Text (Async) & Dependent Init ---
async function setupSceneTextAndTV() {
	try {
		// --- 修改：检查 blockyCharacterData ---
		if (houseGroup && blockyCharacterData) {
			await Text.createNameText(houseGroup);
			await Text.createPoemText(houseGroup);
			await Text.createQuoteText(houseGroup);
			await Text.createDialogueElements(houseGroup);
			console.log("Static text setup complete.");

			// Initialize TV system AFTER text setup (ensures font likely loaded)
			TV.initTV(scene, houseGroup, textureLoader, fontLoader, {
				matcap_5: materials.matcap_5,
				matcap_7: materials.matcap_7,
				terrain_texture: materials.terrain_texture,
			});
			console.log("TV system initialized after text.");
		} else {
			console.error("Cannot setup text/TV: House or Blocky Character missing.");
		}
	} catch (error) {
		console.error("Error during async text/TV setup:", error);
	}
}
setupSceneTextAndTV(); // Call async setup

// --- Setup Interactions ---
// --- 修改：门交互暂时只对 Blocky 生效，后续可扩展 ---
if (blockyCharacterData && blockyCharacterData.character) {
	House.setupDoorInteraction(blockyCharacterData.character); // 初始绑定到 Blocky
} else {
	console.error("Blocky character data missing for door interaction setup.");
}

// --- Initialize UI/Control Modules ---
CSS3D.initCSS3D(css3dContainer, "./iPhone12/index.html", { width: window.innerWidth, height: window.innerHeight });
// --- 修改：传递共享的 characterDatas 对象 ---
if (characterDatas.blocky) {
	// 确保至少 blocky 存在
	Controls.initControlsAndResize(
		camera,
		renderer,
		clock,
		characterDatas, // <--- 传递共享对象
		instructionsElement,
		coordinatesElement,
		fullscreenButton
	);
	MiniMap.initMiniMap(
		renderer,
		scene,
		characterDatas, // <--- 传递共享对象
		Controls
	);
} else {
	console.error("Blocky character data missing for Controls/Minimap setup.");
}
// --- 结束修改 ---
// Pass renderer and textureMap to Debug init
// --- 修改：传递共享的 characterDatas 对象给 Debug ---
Debug.initDebugGUI(scene, renderer, textureMap, scene.fog, switchActiveCharacter, characterDatas); // <--- 添加 characterDatas

// --- Prepare Animation Loop References ---
// --- 修改：传递共享的 characterDatas 对象给 Animate ---
const animationRefs = {
	clock: clock,
	scene: scene,
	camera: camera,
	renderer: renderer,
	css3dRenderer: CSS3D.renderCSS3D,
	world: world,
	characterDatas: characterDatas, // <--- 传递共享对象
	debugParams: Debug.getDebugParams(),
	controlsUpdater: Controls,
	lightingUpdater: Lighting,
	houseUpdater: House,
	characterUpdater: Character,
	terrainUpdater: Terrain,
	galaxyUpdater: Galaxy,
	tvUpdater: TV,
	minimapUpdater: MiniMap,
	planetsUpdater: Planets,
	skyboxUpdater: Skybox,
};
// --- 结束修改 ---

// --- Initialize and Start Animation Loop ---
Animate.initAnimateLoop(animationRefs);
// Note: Animate.startAnimateLoop() is called in manager.onLoad

// --- Main Resize Handler ---
function handleResize() {
	const width = window.innerWidth;
	const height = window.innerHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	CSS3D.resizeCSS3D(width, height);

	console.log("Main resize handler executed.");
}
window.addEventListener("resize", handleResize);

// 确保体力条在游戏开始时可见
Debug.setStaminaBarVisible(true);

// --- Optional Cleanup on Window Unload ---
window.addEventListener("beforeunload", () => {
	console.log("Cleaning up before unload...");
	Animate.stopAnimateLoop();
	// Call dispose functions in reverse order of dependency if possible
	Debug.disposeDebugGUI();
	Controls.disposeControlsAndResize();
	CSS3D.disposeCSS3D();
	MiniMap.disposeMiniMap();
	TV.disposeTV();
	Skybox.disposeSkybox();
	// Add other dispose calls here (Text, House, etc. if implemented)
	// Note: Disposing all geometries/materials loaded by GLTF or TextureLoader
	// automatically can be complex and might require tracking them explicitly.
});

console.log("Main script setup complete. Waiting for assets to load...");

// --- 新增：角色切换逻辑 ---
/**
 * Switches the active controllable character.
 * Called by the Debug GUI dropdown.
 * @param {string} newCharacterType - The type to switch to ('Blocky' or 'MilkAnimated').
 */
export function switchActiveCharacter(newCharacterType) {
	// <--- 导出此函数
	console.log(`Script: Attempting to switch active character to: ${newCharacterType}`);

	// 获取两种角色的数据 (现在从共享对象获取最新状态)
	const blocky = characterDatas.blocky;
	const milk = characterDatas.milkAnimated; // 会获取到加载完成后的数据

	// --- 前置检查 ---
	if (!blocky || !blocky.character || !blocky.characterBody) {
		console.error("Blocky character data is incomplete, cannot switch.");
		return;
	}
	// 这个检查现在更可靠了，因为它检查的是可能已被回调更新的 milk 数据
	if (newCharacterType === "MilkAnimated" && (!milk || !milk.model || !milk.characterBody)) {
		console.error("MilkAnimated character data is not loaded or incomplete, cannot switch.");
		// 可以在 Debug GUI 中禁用该选项，直到 milk 数据准备好
		// Debug.updateCharacterOptions(characterDatas); // 假设 Debug 有此方法
		return;
	}

	// --- 执行切换 ---
	if (newCharacterType === "Blocky") {
		// 切换到 Blocky
		blocky.character.visible = true;
		// 将 Blocky 物理体添加回世界（如果不在）
		if (!world.bodies.includes(blocky.characterBody)) {
			world.addBody(blocky.characterBody);
			console.log("Added Blocky body to world.");
			// 可选：重置位置/速度？通常不需要，除非它被移除了很远
		}

		// 隐藏并移除 MilkAnimated (如果存在)
		if (milk && milk.model) milk.model.visible = false;
		if (milk && milk.characterBody && world.bodies.includes(milk.characterBody)) {
			world.removeBody(milk.characterBody);
			console.log("Removed MilkAnimated body from world.");
		}

		// 通知 Controls 模块更新活动角色
		Controls.setActiveCharacter("Blocky");
		// MiniMap 会自动通过 Controls 获取更新，无需单独通知

		// 更新门交互目标 (如果需要动态切换)
		// House.updateDoorInteractionTarget(blocky.character);
	} else if (newCharacterType === "MilkAnimated") {
		// 切换到 MilkAnimated
		milk.model.visible = true;
		// 将 MilkAnimated 物理体添加回世界（如果不在）
		if (!world.bodies.includes(milk.characterBody)) {
			// 将物理体位置同步到模型加载时的初始位置或当前 Blocky 位置？
			// 方案 A: 同步到 Blocky 当前位置
			if (blocky.characterBody) {
				milk.characterBody.position.copy(blocky.characterBody.position);
				milk.characterBody.quaternion.copy(blocky.characterBody.quaternion);
			}
			// 方案 B: 同步到模型的某个初始位置 (如果模型有)
			// milk.characterBody.position.copy(milk.model.position); // 可能不准确

			milk.characterBody.velocity.set(0, 0, 0); // 重置速度
			milk.characterBody.angularVelocity.set(0, 0, 0); // 重置角速度
			world.addBody(milk.characterBody);
			console.log("Added MilkAnimated body to world at Blocky's position.");
		}

		// 隐藏并移除 Blocky
		blocky.character.visible = false;
		if (world.bodies.includes(blocky.characterBody)) {
			world.removeBody(blocky.characterBody);
			console.log("Removed Blocky body from world.");
		}

		// 通知 Controls 模块更新活动角色
		Controls.setActiveCharacter("MilkAnimated");
		// MiniMap 会自动更新

		// 更新门交互目标 (如果需要动态切换)
		// House.updateDoorInteractionTarget(milk.model);
	}

	console.log(`Script: Active character switched to: ${newCharacterType}`);
}
