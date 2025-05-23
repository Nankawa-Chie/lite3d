// src/modules/physics.js
import * as CANNON from "cannon-es";

/**
 * Initializes and configures the Cannon.js physics world.
 * @returns {CANNON.World} The configured physics world instance.
 */
export function initPhysics() {
	const world = new CANNON.World();
	world.gravity.set(0, -9.82, 0); // Set standard gravity
	world.broadphase = new CANNON.NaiveBroadphase(); // Basic broadphase collision detection
	world.solver.iterations = 10; // Number of solver iterations for accuracy
	
	// 创建默认材质
	const defaultMaterial = new CANNON.Material('default');
	world.defaultMaterial = defaultMaterial;
	
	// 创建默认接触材质
	const defaultContactMaterial = new CANNON.ContactMaterial(
		defaultMaterial,
		defaultMaterial,
		{
			friction: 0.1,        // 降低默认摩擦系数
			restitution: 0.3,     // 适中的弹性
			contactEquationStiffness: 1e6,
			contactEquationRelaxation: 3
		}
	);
	
	// 添加默认接触材质
	world.addContactMaterial(defaultContactMaterial);
	
	// 设置默认接触参数
	world.defaultContactMaterial = defaultContactMaterial;

	console.log("Physics world initialized.");
	return world;
}

/**
 * Creates a static plane physics body for the ground.
 * @param {CANNON.World} world - The physics world to add the ground to.
 * @returns {CANNON.Body} The created ground body.
 */
export function createGroundPhysics(world) {
	const groundShape = new CANNON.Plane();
	const groundBody = new CANNON.Body({
		mass: 0, // Static, mass = 0
		shape: groundShape,
		material: new CANNON.Material({ friction: 0.3, restitution: 0.7 }), // Example material properties
	});
	// Rotate the plane to be horizontal (CANNON.Plane defaults to facing Z+)
	groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
	groundBody.position.set(0, 0, 0); // Set position at Y=0
	world.addBody(groundBody);
	console.log("Ground physics body created.");
	return groundBody;
}

// You might add more physics-related utility functions here later if needed,
// such as creating specific materials or handling contacts.
