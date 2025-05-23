// src/modules/global.js

import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// PointerLockControls 和 FontLoader 会在需要它们的模块中单独引入或在此处管理，
// 但 FontLoader 依赖 LoadingManager，所以在此处创建比较合适。
// PointerLockControls 依赖 camera 和 document.body，可以在 controls 模块中创建。

/**
 * 加载管理器 Loading Manager
 */
const loadingManager = new THREE.LoadingManager();
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const loadingScreen = document.getElementById("loading-screen");

loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
	console.log("Started loading file: " + url + ".\nLoaded " + itemsLoaded + " of " + itemsTotal + " files.");
	if (loadingScreen) loadingScreen.style.display = "flex"; // Ensure loading screen is visible
	if (progressBar) progressBar.style.width = "0%";
	if (progressText) progressText.textContent = "Loading... 0%";
};

loadingManager.onLoad = function () {
	console.log("Loading complete!");
	if (loadingScreen) {
		// 隐藏加载界面
		loadingScreen.style.opacity = 1;
		let opacity = 1;
		const fadeOut = setInterval(() => {
			opacity -= 0.05;
			loadingScreen.style.opacity = opacity;
			if (opacity <= 0) {
				clearInterval(fadeOut);
				loadingScreen.style.display = "none";
			}
		}, 30); // Adjust timing if needed
	}
};

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
	console.log("Loading file: " + url + ".\nLoaded " + itemsLoaded + " of " + itemsTotal + " files.");
	if (itemsTotal > 0) {
		const progress = (itemsLoaded / itemsTotal) * 100;
		if (progressBar) progressBar.style.width = progress + "%"; // 更新进度条宽度
		if (progressText) progressText.textContent = `Loading... ${Math.round(progress)}%`; // 更新进度文本
	}
};

loadingManager.onError = function (url) {
	console.error("There was an error loading " + url);
	if (progressText) progressText.textContent = `Error loading: ${url}`;
};

/**
 * 核心 Three.js & Cannon.js 实例 Core Instances
 */
const scene = new THREE.Scene();
const world = new CANNON.World();
const clock = new THREE.Clock();

// 物理世界设置 Physics World Setup
world.gravity.set(0, -9.82, 0); // 重力向下
world.broadphase = new CANNON.NaiveBroadphase(); // 碰撞检测算法
world.solver.iterations = 10; // 解算器迭代次数
world.allowSleep = true; // 允许物体休眠以提高性能

/**
 * 尺寸 Sizes
 * 用于存储窗口尺寸，方便响应式处理
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

/**
 * 资源加载器 Loaders
 */
const textureLoader = new THREE.TextureLoader(loadingManager);
const fontLoader = new THREE.FontLoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);

/**
 * 共享变量 Shared Variables
 * 注意：直接在此处共享可变状态（如 keys）可能导致耦合。
 * 更好的做法是让需要这些状态的模块自行管理或通过事件/回调通信。
 * 但为了逐步迁移，我们暂时将 keys 放在这里。
 */
const keys = {}; // 用于跟踪按键状态

/**
 * 导出 Export Core Elements
 * 其他模块可以通过 import { scene, world, ... } from './global.js' 来访问这些实例。
 * Camera 和 Renderer 通常在主初始化流程中创建，因为它们依赖 DOM 或特定配置，
 * 但我们可以在这里声明变量，然后在主脚本中设置它们。
 */
let camera;
let renderer;
let controls; // PointerLockControls instance

export {
	scene,
	world,
	clock,
	loadingManager,
	sizes,
	textureLoader,
	fontLoader,
	gltfLoader,
	keys,
	camera, // Export variable placeholder
	renderer, // Export variable placeholder
	controls, // Export variable placeholder
};

// 提供设置函数允许主脚本或其他模块设置 camera 和 renderer
export function setCamera(newCamera) {
	camera = newCamera;
}

export function setRenderer(newRenderer) {
	renderer = newRenderer;
}

export function setControls(newControls) {
	controls = newControls;
}
