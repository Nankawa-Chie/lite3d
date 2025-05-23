// src/modules/models.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as CANNON from "cannon-es";

// --- Module State ---
// Store references to loaded models if they need to be accessed later
const loadedModels = {
	tank: null,
	bathroom: null,
	uniform: null,
	milk: null, // <--- 添加 milk 模型引用
	milkAnimated: { model: null, mixer: null, animations: [] }, // <--- 为带动画的模型添加结构
	mita: null,
	garden: null // <--- 添加 garden 模型引用
};

// 存储物理体辅助线对象
const physicsHelpers = {
	bathroom: [],
};

let sceneRef = null; // 存储场景引用

// --- Helper Function for Bathroom Physics ---
function _addBathroomPhysics(world, scene, modelScene) {
	sceneRef = scene; // 保存场景引用
	// modelScene is the gltf.scene added to the main scene
	modelScene.traverse((child) => {
		if (child.isMesh) {
			// 1. Ensure geometry and bounding box exist in LOCAL space
			if (!child.geometry) {
				console.warn("Mesh has no geometry:", child.name);
				return;
			}
			child.geometry.computeBoundingBox(); // Compute local bounding box
			if (!child.geometry.boundingBox) {
				console.warn("Mesh geometry has no bounding box:", child.name);
				return;
			}

			const localBox = child.geometry.boundingBox;
			const size = new THREE.Vector3();
			localBox.getSize(size);

			// Check for valid size to avoid CANNON errors
			if (size.x > 0.001 && size.y > 0.001 && size.z > 0.001) {
				// 2. Calculate the LOCAL center of the geometry's bounding box
				const localCenter = new THREE.Vector3();
				localBox.getCenter(localCenter); // Center relative to the mesh's origin

				// 3. Create the physics shape based on the LOCAL size
				const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));

				const body = new CANNON.Body({
					mass: 0, // Static
					shape: shape,
					// Optional: Add material if needed
				});

				// 4. Transform the LOCAL center point to WORLD space using the mesh's world matrix
				// We need a world position vector to store the result
				const worldPosition = new THREE.Vector3();
				// Apply the mesh's world matrix to the local center point
				worldPosition.copy(localCenter).applyMatrix4(child.matrixWorld);
				body.position.copy(worldPosition); // Set physics body position to the calculated world position

				// 5. Get the WORLD rotation of the mesh
				const worldQuaternion = new THREE.Quaternion();
				child.getWorldQuaternion(worldQuaternion);
				body.quaternion.copy(worldQuaternion); // Apply world rotation to physics body

				world.addBody(body);

				// 创建物理体辅助线但默认不添加到场景
				const worldBox = localBox.clone().applyMatrix4(child.matrixWorld);
				const boxHelper = new THREE.Box3Helper(worldBox, 0xffff00); // 黄色
				boxHelper.visible = false; // 默认不可见
				scene.add(boxHelper);
				physicsHelpers.bathroom.push(boxHelper);
				
				// Link body to mesh if needed for updates (e.g., if mass > 0)
			} else {
				console.warn("Skipping physics for potentially zero-sized mesh:", child.name, size);
			}
		}
	});
	console.log("Physics added for bathroom model.");
}

// --- Exported Loading Functions ---

/**
 * Loads the Tiger Tank model.
 * @param {GLTFLoader} loader - The GLTFLoader instance.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {function(object):void} [onLoadCallback] - Optional callback function when loading completes, receives the tank object.
 */
export function loadTankModel(loader, scene, onLoadCallback) {
	loader.load(
		"models/tiger2_1k.glb",
		(gltf) => {
			const tank = gltf.scene;
			tank.position.set(-12, 0, 28);
			tank.scale.set(2.5, 2.5, 2.5);
			scene.add(tank);
			loadedModels.tank = tank; // Store reference
			console.log("Tank model loaded.");

			// Enable shadows for the tank model
			tank.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});

			// Optional: Add physics for the tank if needed (e.g., a simple Box shape)

			if (onLoadCallback) {
				onLoadCallback(tank);
			}
		},
		undefined, // onProgress callback (optional)
		(error) => {
			console.error("Error loading tank model:", error);
		}
	);
}

/**
 * 加载 Mita房间 模型。
 * @param {GLTFLoader} loader - GLTFLoader 实例。
 * @param {THREE.Scene} scene - Three.js 主场景。
 * @param {function(object):void} [onLoadCallback] - 可选的回调函数，在加载完成时调用，接收 mita 对象。
 */
export function loadMitaRoomModel(loader, scene, onLoadCallback) {
	loader.load(
		"models/mita_room.glb", // 假设模型路径是这个
		(gltf) => {
			const mita = gltf.scene;
			mita.position.set(17, 0.02, 16); // 设置在卫生间附近
			mita.scale.set(1, 1, 1); // 根据需要调整大小
			mita.rotation.set(0, Math.PI / 2, 0);
			// mita.rotation.y = Math.PI; // 根据需要调整旋转

			mita.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;

					// --- 为 Mita Room 模型材质添加自发光效果 ---
					if (child.material) {
						const materials = Array.isArray(child.material) ? child.material : [child.material];
						materials.forEach(material => {
							if (material.isMeshStandardMaterial || material.isMeshPhongMaterial || material.isMeshLambertMaterial) { // Check for common material types
									if (material.isMeshStandardMaterial) { // Includes MeshPhysicalMaterial
										
										material.metalness = 0.0; // Force non-metallic
										material.roughness = 0.9; // Force very rough for diffuse appearance
										
									}
									material.needsUpdate = true; // Important to update material
								}
						});
					}
					// --- 结束材质调整 ---
				}
			});

			scene.add(mita);
			loadedModels.mita = mita; // 存储模型引用
			console.log("Mita model loaded and materials adjusted.");

			if (onLoadCallback) {
				onLoadCallback(mita);
			}
		},
		undefined, // onProgress callback (optional)
		(error) => {
			console.error("Error loading mita model:", error);
		}
	);
}

/**
 * Loads the Bathroom model and adds physics bodies for its parts.
 * @param {GLTFLoader} loader - The GLTFLoader instance.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {CANNON.World} world - The Cannon.js physics world.
 */
// --- Make sure the physics are added AFTER matrix updates ---
export function loadBathroomModel(loader, scene, world) {
	if (!world) {
		console.error("Physics world required for loadBathroomModel.");
		return;
	}
	loader.load(
		"models/卫生间.glb",
		(gltf) => {
			const bathroom = gltf.scene;
			// Set position and scale *before* adding to scene if possible
			bathroom.position.set(19, 1.31, 6);
			bathroom.scale.set(1, 1, 1);
			scene.add(bathroom); // Add to scene
			loadedModels.bathroom = bathroom;
			console.log("Bathroom model loaded.");

			// Enable shadows for the bathroom model
			bathroom.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});

			// Force update of matrices for the entire model hierarchy
			bathroom.updateMatrixWorld(true); // Force update immediately

			// Add physics immediately after ensuring matrices are updated
			_addBathroomPhysics(world, scene, bathroom);

			// Note: The setTimeout(..., 0) approach can also work but forcing update is more direct.
		},
		undefined,
		(error) => {
			console.error("Error loading bathroom model:", error);
		}
	);
}

/**
 * Loads the Mita Uniform model.
 * @param {GLTFLoader} loader - The GLTFLoader instance.
 * @param {THREE.Scene} scene - The main Three.js scene.
 */
export function loadUniformModel(loader, scene) {
	loader.load(
		"models/米塔校服.glb", // Assuming the path is correct
		(gltf) => {
			const uniform = gltf.scene;
			uniform.position.set(20, 0.01, 6.6);
			uniform.scale.set(1, 1, 1);
			uniform.rotation.y = -Math.PI / 2; // Rotate
			scene.add(uniform);
			loadedModels.uniform = uniform; // Store reference
			console.log("Uniform model loaded.");

			// Enable shadows for the uniform model
			uniform.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});

			// Optional: Add physics if needed
		},
		undefined, // onProgress callback (optional)
		(error) => {
			console.error("Error loading uniform model:", error);
		}
	);
}

/**
 * Loads the Milk character model.
 * @param {GLTFLoader} loader - The GLTFLoader instance.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {function(object):void} [onLoadCallback] - Optional callback function when loading completes, receives the milk object.
 * @param {object} [options] - Optional settings { position: THREE.Vector3, scale: THREE.Vector3, rotation: THREE.Euler }.
 */
// --- 修改 loadMilkModel 函数名以区分 ---
/**
 * Loads the static Milk character model (without animation handling).
 * @param {GLTFLoader} loader - The GLTFLoader instance.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {function(object):void} [onLoadCallback] - Optional callback function when loading completes, receives the milk object.
 * @param {object} [options] - Optional settings { position: THREE.Vector3, scale: THREE.Vector3, rotation: THREE.Euler }.
 */
export function loadMilkStaticModel(loader, scene, onLoadCallback, options = {}) { // <--- 重命名函数
	const {
		position = new THREE.Vector3(0, 0, 0),
		scale = new THREE.Vector3(0.03, 0.03, 0.03),
		rotation = new THREE.Euler(0, 0, 0),
	} = options;

	loader.load(
		"models/Milk.glb", // 确认这是静态模型的路径
		(gltf) => {
			const milk = gltf.scene;
			milk.position.copy(position);
			milk.scale.copy(scale);
			milk.rotation.copy(rotation);

			milk.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});

			scene.add(milk);
			loadedModels.milk = milk; // 存储静态模型引用
			console.log("Static Milk model loaded at:", position);

			// Enable shadows for the static milk model
			milk.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});

			if (onLoadCallback) {
				onLoadCallback(milk);
			}
		},
		undefined,
		(error) => {
			console.error("Error loading static milk model:", error);
		}
	);
}


// --- 新增：加载带动画的 Milk 模型 ---
/**
 * Loads the animated Milk character model (Milk_standup.glb).
 * Stores the model, animation mixer, and animations.
 * @param {GLTFLoader} loader - The GLTFLoader instance.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {function(object):void} [onLoadCallback] - Optional callback, receives { model, mixer, animations }.
 * @param {object} [options] - Optional settings { position, scale, rotation }.
 */
export function loadMilkAnimatedModel(loader, scene, onLoadCallback, options = {}) {
	const {
		position = new THREE.Vector3(2, 0, 15), // 默认位置 (调整)
		scale = new THREE.Vector3(0.03, 0.03, 0.03), // 默认缩放 (调整)
		rotation = new THREE.Euler(0, Math.PI, 0), // 默认旋转 (调整, 例如面向 Z 轴负方向)
	} = options;

	loader.load(
		"models/Milk_ani_inplace_2.glb", // 确认这是带动画模型的路径
		(gltf) => {
			const model = gltf.scene;
			const animations = gltf.animations;

			model.position.copy(position);
			model.scale.copy(scale);
			model.rotation.copy(rotation);

			model.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});

			scene.add(model);

			// Enable shadows for the animated milk model
			model.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});

			// 创建 AnimationMixer
			const mixer = new THREE.AnimationMixer(model);

			// 存储模型、混合器和动画
			loadedModels.milkAnimated.model = model;
			loadedModels.milkAnimated.mixer = mixer;
			loadedModels.milkAnimated.animations = animations;

			console.log(`Animated Milk model loaded with ${animations.length} animations.`);

			// 可选：立即播放第一个动画作为默认动作
			if (animations.length > 0) {
				const action = mixer.clipAction(animations[0]);
				action.play();
				console.log(`Playing default animation: ${animations[0].name}`);
			}

			// 回调，传递包含模型、混合器和动画的对象
			if (onLoadCallback) {
				onLoadCallback(loadedModels.milkAnimated);
			}
		},
		undefined,
		(error) => {
			console.error("Error loading animated milk model:", error);
		}
	);
}

// --- 新增：加载花园模型 ---
/**
 * 加载花园模型 (garden.glb)
 * @param {GLTFLoader} loader - GLTFLoader 实例。
 * @param {THREE.Scene} scene - Three.js 主场景。
 * @param {function(object):void} [onLoadCallback] - 可选的回调函数，在加载完成时调用，接收 garden 对象。
 * @param {object} [options] - 可选设置 { position, scale, rotation }。
 */
export function loadGardenModel(loader, scene, onLoadCallback, options = {}) {
	const {
		position = new THREE.Vector3(0, 0.15, 10), // 默认位置 Z=50
		scale = new THREE.Vector3(2.2, 2.2, 2.2),    // 默认缩放
		rotation = new THREE.Euler(0, Math.PI, 0),   // 默认旋转
	} = options;

	loader.load(
		"models/garden.glb",
		(gltf) => {
			const garden = gltf.scene;
			garden.position.copy(position);
			garden.scale.copy(scale);
			garden.rotation.copy(rotation);

			garden.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});

			scene.add(garden);
			loadedModels.garden = garden; // 存储模型引用
			console.log("Garden model loaded at:", position);

			// Enable shadows for the garden model
			garden.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});

			if (onLoadCallback) {
				onLoadCallback(garden);
			}
		},
		undefined,
		(error) => {
			console.error("Error loading garden model:", error);
		}
	);
}



/**
 * Returns references to the loaded models.
 * Note: Models might be null if called before loading is complete.
 * @returns {object} Object containing references: { tank, bathroom, uniform, milk, milkAnimated, mita, garden } // 更新了注释
 */
export function getLoadedModels() {
	return loadedModels;
}

/**
 * 切换物理体辅助线的显示状态
 * @param {boolean} visible - 是否显示物理体辅助线
 */
export function togglePhysicsHelpers(visible) {
	// 遍历所有物理体辅助线并设置可见性
	Object.values(physicsHelpers).forEach(helpers => {
		helpers.forEach(helper => {
			helper.visible = visible;
		});
	});
	
	console.log(`Physics helpers visibility set to: ${visible}`);
}
