// src/modules/soccerfield.js
import * as THREE from "three";
import * as CANNON from "cannon-es";

// --- 模块常量 ---
// 标准足球场尺寸（单位：米）
const FIELD_WIDTH = 68; // 标准宽度范围：64-75米
const FIELD_LENGTH = 105; // 标准长度范围：100-110米
const BOUNDARY_HEIGHT = 2; // 边界物理高度
const BOUNDARY_THICKNESS = 0.1; // 边界厚度

// 球门尺寸
const GOAL_WIDTH = 7.32; // 标准球门宽度：7.32米
const GOAL_HEIGHT = 2.44; // 标准球门高度：2.44米
const GOAL_DEPTH = 2; // 球门深度
const POST_THICKNESS = 0.12; // 门柱厚度

// 场地标记尺寸
const LINE_THICKNESS = 0.12; // 线条厚度（标准：10-12厘米）
const PENALTY_AREA_WIDTH = 40.32; // 禁区宽度（标准：16.5米 * 2 + 7.32米）
const PENALTY_AREA_LENGTH = 16.5; // 禁区长度（标准：16.5米）
const GOAL_AREA_WIDTH = 18.32; // 球门区宽度（标准：5.5米 * 2 + 7.32米）
const GOAL_AREA_LENGTH = 5.5; // 球门区长度（标准：5.5米）
const CENTER_CIRCLE_RADIUS = 9.15; // 中圈半径（标准：9.15米）
const CORNER_ARC_RADIUS = 1; // 角球区圆弧半径（标准：1米）
const PENALTY_SPOT_DISTANCE = 11; // 罚球点距离球门线（标准：11米）
const PENALTY_ARC_RADIUS = 9.15; // 罚球弧半径（标准：9.15米）

// --- 足球场目标位置 ---
const fieldTargetPosition = new THREE.Vector3(-100, 0, 0);

// --- 辅助函数：添加静态物理盒体（相对于目标位置） ---
function _addStaticBoxPhysics(world, localPosition, size, localQuaternion) {
	const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));

	// 计算世界坐标位置
	const worldPos = localPosition.clone().add(fieldTargetPosition);

	const body = new CANNON.Body({
		mass: 0, // 静态物体
		shape: shape,
		position: worldPos, // 使用计算后的世界坐标
	});

	if (localQuaternion) {
		body.quaternion.copy(localQuaternion);
	}

	world.addBody(body);
	return body;
}

// --- 辅助函数：创建球门 ---
function _createGoals(parentGroup, world) {
	const postMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.6 });

	const createSingleGoal = (zPos) => {
		const goalGroup = new THREE.Group(); // 单个球门的组
		const zDirection = Math.sign(zPos); // 确定球门朝向（1或-1）

		// --- 视觉部分（相对于0,0,0） ---
		// 门柱
		const postGeo = new THREE.BoxGeometry(POST_THICKNESS, GOAL_HEIGHT, POST_THICKNESS);
		const leftPost = new THREE.Mesh(postGeo, postMaterial);
		leftPost.position.set(-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, zPos);
		leftPost.castShadow = true;
		goalGroup.add(leftPost);

		const rightPost = new THREE.Mesh(postGeo, postMaterial);
		rightPost.position.set(GOAL_WIDTH / 2, GOAL_HEIGHT / 2, zPos);
		rightPost.castShadow = true;
		goalGroup.add(rightPost);

		// 横梁
		const crossbarGeo = new THREE.BoxGeometry(GOAL_WIDTH + POST_THICKNESS, POST_THICKNESS, POST_THICKNESS);
		const crossbar = new THREE.Mesh(crossbarGeo, postMaterial);
		crossbar.position.set(0, GOAL_HEIGHT, zPos);
		crossbar.castShadow = true;
		goalGroup.add(crossbar);

		// 后框架（完整的球门网架）
		const backDepth = GOAL_DEPTH * zDirection * -1; // 球门深度方向

		// 后立柱
		const backLeftPost = new THREE.Mesh(postGeo, postMaterial);
		backLeftPost.position.set(-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, zPos + backDepth);
		backLeftPost.castShadow = true;
		goalGroup.add(backLeftPost);

		const backRightPost = new THREE.Mesh(postGeo, postMaterial);
		backRightPost.position.set(GOAL_WIDTH / 2, GOAL_HEIGHT / 2, zPos + backDepth);
		backRightPost.castShadow = true;
		goalGroup.add(backRightPost);

		// 后横梁
		const backCrossbar = new THREE.Mesh(crossbarGeo, postMaterial);
		backCrossbar.position.set(0, GOAL_HEIGHT, zPos + backDepth);
		backCrossbar.castShadow = true;
		goalGroup.add(backCrossbar);

		// 顶部连接
		const topLeftGeo = new THREE.BoxGeometry(POST_THICKNESS, POST_THICKNESS, GOAL_DEPTH);
		const topLeft = new THREE.Mesh(topLeftGeo, postMaterial);
		topLeft.position.set(-GOAL_WIDTH / 2, GOAL_HEIGHT, zPos + backDepth / 2);
		topLeft.castShadow = true;
		goalGroup.add(topLeft);

		const topRightGeo = new THREE.BoxGeometry(POST_THICKNESS, POST_THICKNESS, GOAL_DEPTH);
		const topRight = new THREE.Mesh(topRightGeo, postMaterial);
		topRight.position.set(GOAL_WIDTH / 2, GOAL_HEIGHT, zPos + backDepth / 2);
		topRight.castShadow = true;
		goalGroup.add(topRight);

		// --- 物理部分 ---
		// 前门柱
		_addStaticBoxPhysics(world, leftPost.position, { x: POST_THICKNESS, y: GOAL_HEIGHT, z: POST_THICKNESS });
		_addStaticBoxPhysics(world, rightPost.position, { x: POST_THICKNESS, y: GOAL_HEIGHT, z: POST_THICKNESS });
		// 前横梁
		_addStaticBoxPhysics(world, crossbar.position, { x: GOAL_WIDTH, y: POST_THICKNESS, z: POST_THICKNESS });

		// 后门柱
		_addStaticBoxPhysics(world, backLeftPost.position, { x: POST_THICKNESS, y: GOAL_HEIGHT, z: POST_THICKNESS });
		_addStaticBoxPhysics(world, backRightPost.position, { x: POST_THICKNESS, y: GOAL_HEIGHT, z: POST_THICKNESS });
		// 后横梁
		_addStaticBoxPhysics(world, backCrossbar.position, { x: GOAL_WIDTH, y: POST_THICKNESS, z: POST_THICKNESS });

		// 顶部连接
		_addStaticBoxPhysics(world, topLeft.position, { x: POST_THICKNESS, y: POST_THICKNESS, z: GOAL_DEPTH });
		_addStaticBoxPhysics(world, topRight.position, { x: POST_THICKNESS, y: POST_THICKNESS, z: GOAL_DEPTH });

		parentGroup.add(goalGroup); // 将球门组添加到主场地组
	};

	// 在场地两端创建球门
	createSingleGoal(-FIELD_LENGTH / 2);
	createSingleGoal(FIELD_LENGTH / 2);
	console.log("球门创建完成");
}

// --- 辅助函数：创建场地标记 ---
function _createMarkings(parentGroup) {
	const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
	const lineY = 0.015; // 稍微高于地面以避免z-fighting

	// 创建场地边界线
	// 使用平面几何体而不是边缘几何体来创建边界线
	const outlineWidth = LINE_THICKNESS;

	// 上边线
	const topLineGeo = new THREE.PlaneGeometry(FIELD_WIDTH, outlineWidth);
	const topLineMesh = new THREE.Mesh(topLineGeo, lineMaterial);
	topLineMesh.rotation.x = -Math.PI / 2;
	topLineMesh.position.set(0, lineY, -FIELD_LENGTH / 2);
	parentGroup.add(topLineMesh);

	// 下边线
	const bottomLineGeo = new THREE.PlaneGeometry(FIELD_WIDTH, outlineWidth);
	const bottomLineMesh = new THREE.Mesh(bottomLineGeo, lineMaterial);
	bottomLineMesh.rotation.x = -Math.PI / 2;
	bottomLineMesh.position.set(0, lineY, FIELD_LENGTH / 2);
	parentGroup.add(bottomLineMesh);

	// 左边线
	const leftLineGeo = new THREE.PlaneGeometry(outlineWidth, FIELD_LENGTH);
	const leftLineMesh = new THREE.Mesh(leftLineGeo, lineMaterial);
	leftLineMesh.rotation.x = -Math.PI / 2;
	leftLineMesh.position.set(-FIELD_WIDTH / 2, lineY, 0);
	parentGroup.add(leftLineMesh);

	// 右边线
	const rightLineGeo = new THREE.PlaneGeometry(outlineWidth, FIELD_LENGTH);
	const rightLineMesh = new THREE.Mesh(rightLineGeo, lineMaterial);
	rightLineMesh.rotation.x = -Math.PI / 2;
	rightLineMesh.position.set(FIELD_WIDTH / 2, lineY, 0);
	parentGroup.add(rightLineMesh);

	// 中线
	const centerLineGeo = new THREE.PlaneGeometry(FIELD_WIDTH, LINE_THICKNESS);
	const centerLineMesh = new THREE.Mesh(centerLineGeo, lineMaterial);
	centerLineMesh.rotation.x = -Math.PI / 2;
	centerLineMesh.position.set(0, lineY, 0);
	parentGroup.add(centerLineMesh);

	// 中圈
	const centerCircleGeo = new THREE.RingGeometry(
		CENTER_CIRCLE_RADIUS - LINE_THICKNESS / 2,
		CENTER_CIRCLE_RADIUS + LINE_THICKNESS / 2,
		64
	);
	const centerCircleMesh = new THREE.Mesh(centerCircleGeo, lineMaterial);
	centerCircleMesh.rotation.x = -Math.PI / 2;
	centerCircleMesh.position.set(0, lineY, 0);
	parentGroup.add(centerCircleMesh);

	// 中点
	const centerSpotGeo = new THREE.CircleGeometry(LINE_THICKNESS, 16);
	const centerSpotMesh = new THREE.Mesh(centerSpotGeo, lineMaterial);
	centerSpotMesh.rotation.x = -Math.PI / 2;
	centerSpotMesh.position.set(0, lineY + 0.001, 0);
	parentGroup.add(centerSpotMesh);

	// 禁区和球门区
	const createAreaLines = (zSign) => {
		// zSign是+1或-1，表示场地的哪一半
		const penaltyLineZ = zSign * (FIELD_LENGTH / 2 - PENALTY_AREA_LENGTH);
		const goalLineZ = zSign * (FIELD_LENGTH / 2 - GOAL_AREA_LENGTH);

		// 禁区
		// 顶线
		const pLineTopGeo = new THREE.PlaneGeometry(PENALTY_AREA_WIDTH, LINE_THICKNESS);
		const pLineTop = new THREE.Mesh(pLineTopGeo, lineMaterial);
		pLineTop.rotation.x = -Math.PI / 2;
		pLineTop.position.set(0, lineY, penaltyLineZ);
		parentGroup.add(pLineTop);

		// 侧线
		const pLineSideGeo = new THREE.PlaneGeometry(LINE_THICKNESS, PENALTY_AREA_LENGTH);
		const pLineLeft = new THREE.Mesh(pLineSideGeo, lineMaterial);
		pLineLeft.rotation.x = -Math.PI / 2;
		pLineLeft.position.set(-PENALTY_AREA_WIDTH / 2, lineY, zSign * (FIELD_LENGTH / 2 - PENALTY_AREA_LENGTH / 2));
		parentGroup.add(pLineLeft);

		const pLineRight = new THREE.Mesh(pLineSideGeo, lineMaterial);
		pLineRight.rotation.x = -Math.PI / 2;
		pLineRight.position.set(PENALTY_AREA_WIDTH / 2, lineY, zSign * (FIELD_LENGTH / 2 - PENALTY_AREA_LENGTH / 2));
		parentGroup.add(pLineRight);

		// 球门区
		// 顶线
		const gLineTopGeo = new THREE.PlaneGeometry(GOAL_AREA_WIDTH, LINE_THICKNESS);
		const gLineTop = new THREE.Mesh(gLineTopGeo, lineMaterial);
		gLineTop.rotation.x = -Math.PI / 2;
		gLineTop.position.set(0, lineY, goalLineZ);
		parentGroup.add(gLineTop);

		// 侧线
		const gLineSideGeo = new THREE.PlaneGeometry(LINE_THICKNESS, GOAL_AREA_LENGTH);
		const gLineLeft = new THREE.Mesh(gLineSideGeo, lineMaterial);
		gLineLeft.rotation.x = -Math.PI / 2;
		gLineLeft.position.set(-GOAL_AREA_WIDTH / 2, lineY, zSign * (FIELD_LENGTH / 2 - GOAL_AREA_LENGTH / 2));
		parentGroup.add(gLineLeft);

		const gLineRight = new THREE.Mesh(gLineSideGeo, lineMaterial);
		gLineRight.rotation.x = -Math.PI / 2;
		gLineRight.position.set(GOAL_AREA_WIDTH / 2, lineY, zSign * (FIELD_LENGTH / 2 - GOAL_AREA_LENGTH / 2));
		parentGroup.add(gLineRight);

		// 罚球点
		const penaltySpotGeo = new THREE.CircleGeometry(LINE_THICKNESS * 1.2, 16);
		const penaltySpotMesh = new THREE.Mesh(penaltySpotGeo, lineMaterial);
		penaltySpotMesh.rotation.x = -Math.PI / 2;
		penaltySpotMesh.position.set(0, lineY + 0.001, zSign * (FIELD_LENGTH / 2 - PENALTY_SPOT_DISTANCE));
		parentGroup.add(penaltySpotMesh);

		// 罚球弧（禁区前沿的弧线）
		// 计算弧的起始和结束角度
		const arcCenterZ = zSign * (FIELD_LENGTH / 2 - PENALTY_SPOT_DISTANCE);

		// 检查并调整计算参数
		const halfPenaltyWidth = PENALTY_AREA_WIDTH / 2;
		const ratio = halfPenaltyWidth / PENALTY_ARC_RADIUS;

		// 确保比值在有效范围内（-1到1之间）
		const safeRatio = Math.min(Math.max(ratio, -0.99), 0.8);
		const arcStartAngle = Math.acos(safeRatio);
		const arcEndAngle = Math.PI - arcStartAngle;

		console.log(
			`罚球弧计算: 半宽=${halfPenaltyWidth}, 半径=${PENALTY_ARC_RADIUS}, 比值=${ratio}, 安全比值=${safeRatio}`
		);

		let startAngle, endAngle;
		if (zSign > 0) {
			// 场地下半部分
			startAngle = arcStartAngle;
			endAngle = arcEndAngle;
		} else {
			// 场地上半部分
			startAngle = Math.PI + arcStartAngle;
			endAngle = Math.PI + arcEndAngle;
		}

		// 确保角度参数有效，避免NaN
		if (isNaN(startAngle) || isNaN(endAngle) || Math.abs(endAngle - startAngle) < 0.01) {
			console.warn("罚球弧角度计算错误，使用默认值");
			if (zSign > 0) {
				startAngle = Math.PI / 4;
				endAngle = (Math.PI * 3) / 4;
			} else {
				startAngle = (Math.PI * 5) / 4;
				endAngle = (Math.PI * 7) / 4;
			}
		}

		// 确保内外半径有足够差异
		const innerRadius = Math.max(PENALTY_ARC_RADIUS - LINE_THICKNESS / 2, 0.01);
		const outerRadius = PENALTY_ARC_RADIUS + LINE_THICKNESS / 2;

		const penaltyArcGeo = new THREE.RingGeometry(innerRadius, outerRadius, 64, 1, startAngle, endAngle - startAngle);
		const penaltyArcMesh = new THREE.Mesh(penaltyArcGeo, lineMaterial);
		penaltyArcMesh.rotation.x = -Math.PI / 2;
		penaltyArcMesh.position.set(0, lineY, arcCenterZ);
		parentGroup.add(penaltyArcMesh);
	};

	createAreaLines(1); // 前半场
	createAreaLines(-1); // 后半场

	// 角球区圆弧
	const createCornerArc = (xSign, zSign, startAngle) => {
		// 确保内外半径有足够差异
		let cornerInnerRadius = CORNER_ARC_RADIUS - LINE_THICKNESS / 2;
		const cornerOuterRadius = CORNER_ARC_RADIUS + LINE_THICKNESS / 2;

		// 确保半径为正值
		if (cornerInnerRadius <= 0) {
			console.warn("角球区内半径过小，已调整");
			cornerInnerRadius = 0.01;
		}

		const cornerArcGeo = new THREE.RingGeometry(cornerInnerRadius, cornerOuterRadius, 32, 1, startAngle, Math.PI / 2);
		const cornerArcMesh = new THREE.Mesh(cornerArcGeo, lineMaterial);
		cornerArcMesh.rotation.x = -Math.PI / 2;
		cornerArcMesh.position.set((xSign * FIELD_WIDTH) / 2, lineY, (zSign * FIELD_LENGTH) / 2);
		parentGroup.add(cornerArcMesh);
	};

	createCornerArc(1, 1,Math.PI / 2); // 右下角
	createCornerArc(-1, 1, 0); // 左下角
	createCornerArc(1, -1, Math.PI); // 右上角
	createCornerArc(-1, -1, -Math.PI / 2); // 左上角

	console.log("场地标记创建完成");
}

// --- 创建足球 ---
function _createSoccerBall(scene, world, position = new THREE.Vector3(0, 1, 0)) {
	// 足球材质
	const ballRadius = 0.22; // 标准足球半径约22厘米
	const ballMass = 0.45; // 标准足球质量约450克

	// 创建足球纹理
	const ballTexture = new THREE.TextureLoader().load("textures/soccer_ball.jpg");
	const ballMaterial = new THREE.MeshStandardMaterial({
		map: ballTexture,
		roughness: 0.4,
		metalness: 0.1,
	});

	// 创建足球视觉模型
	const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
	const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
	ballMesh.castShadow = true;
	ballMesh.receiveShadow = true;
	
	// 确保足球视觉体初始位置正确
	ballMesh.position.copy(position);
	ballMesh.position.add(fieldTargetPosition);

	// 创建足球物理模型
	const ballShape = new CANNON.Sphere(ballRadius);
	const ballBody = new CANNON.Body({
		mass: ballMass,
		shape: ballShape,
		position: new CANNON.Vec3(
			position.x + fieldTargetPosition.x,
			position.y + fieldTargetPosition.y,
			position.z + fieldTargetPosition.z
		),
		material: new CANNON.Material({ restitution: 0.8, friction: 0.5 }),
	});

	// 添加阻尼以模拟空气阻力
	ballBody.linearDamping = 0.2;
	ballBody.angularDamping = 0.2;

	world.addBody(ballBody);
	scene.add(ballMesh);

	return {
		mesh: ballMesh,
		body: ballBody,
	};
}

/**
 * 创建完整的足球场，包括地面、边界、标记线和球门。
 * 所有视觉元素都添加到一个组中，然后定位。物理体使用世界坐标。
 * @param {THREE.Scene} scene - Three.js场景。
 * @param {CANNON.World} world - Cannon.js物理世界。
 * @returns {object} 包含引用的对象: { soccerFieldGroup, fieldBody, soccerBall }
 */
export function createSoccerField(scene, world) {
	if (!scene || !world) {
		console.error("创建足球场需要提供Scene和World参数。");
		return null;
	}

	// --- 主视觉元素组 ---
	const soccerFieldGroup = new THREE.Group();

	// --- 场地地面平面（视觉） ---
	const fieldGeometry = new THREE.PlaneGeometry(FIELD_WIDTH, FIELD_LENGTH);

	// 使用更真实的草地材质
	const fieldMaterial = new THREE.MeshStandardMaterial({
		color: 0x2e8b57, // 海洋绿色，更接近真实草坪
		roughness: 0.8,
		metalness: 0.1,
	});

	const fieldMesh = new THREE.Mesh(fieldGeometry, fieldMaterial);
	fieldMesh.rotation.x = -Math.PI / 2;
	fieldMesh.position.y = 0.01; // 稍微高于0
	fieldMesh.receiveShadow = true;
	soccerFieldGroup.add(fieldMesh);

	// --- 地面物理体（在目标世界位置） ---
	const fieldShape = new CANNON.Plane();
	const fieldBody = new CANNON.Body({
		mass: 0,
		shape: fieldShape,
		position: fieldTargetPosition.clone(),
		material: new CANNON.Material({ friction: 0.3, restitution: 0.4 }), // 适合足球的摩擦和反弹
	});
	fieldBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // 旋转物理平面
	world.addBody(fieldBody);

	// --- 边界（视觉添加到组，物理使用世界坐标） ---
	const boundaryMaterial = new THREE.MeshStandardMaterial({
		color: 0xf5f5f5, // 白色边界
		roughness: 0.7,
		metalness: 0.1,
	});
	const boundaryVisualHeight = 1.5; // 视觉高度可以不同

	// 左边界
	const leftBoundaryGeo = new THREE.BoxGeometry(BOUNDARY_THICKNESS, boundaryVisualHeight, FIELD_LENGTH);
	const leftBoundaryMesh = new THREE.Mesh(leftBoundaryGeo, boundaryMaterial);
	leftBoundaryMesh.position.set(-FIELD_WIDTH / 2 - BOUNDARY_THICKNESS / 2, boundaryVisualHeight / 2, 0);
	leftBoundaryMesh.castShadow = true;
	leftBoundaryMesh.receiveShadow = true;
	soccerFieldGroup.add(leftBoundaryMesh);
	_addStaticBoxPhysics(world, leftBoundaryMesh.position, {
		x: BOUNDARY_THICKNESS,
		y: BOUNDARY_HEIGHT,
		z: FIELD_LENGTH,
	});

	// 右边界
	const rightBoundaryGeo = new THREE.BoxGeometry(BOUNDARY_THICKNESS, boundaryVisualHeight, FIELD_LENGTH);
	const rightBoundaryMesh = new THREE.Mesh(rightBoundaryGeo, boundaryMaterial);
	rightBoundaryMesh.position.set(FIELD_WIDTH / 2 + BOUNDARY_THICKNESS / 2, boundaryVisualHeight / 2, 0);
	rightBoundaryMesh.castShadow = true;
	rightBoundaryMesh.receiveShadow = true;
	soccerFieldGroup.add(rightBoundaryMesh);
	_addStaticBoxPhysics(world, rightBoundaryMesh.position, {
		x: BOUNDARY_THICKNESS,
		y: BOUNDARY_HEIGHT,
		z: FIELD_LENGTH,
	});

	// 上边界（远Z）
	const topBoundaryGeo = new THREE.BoxGeometry(
		FIELD_WIDTH + BOUNDARY_THICKNESS * 2,
		boundaryVisualHeight,
		BOUNDARY_THICKNESS
	);
	const topBoundaryMesh = new THREE.Mesh(topBoundaryGeo, boundaryMaterial);
	topBoundaryMesh.position.set(0, boundaryVisualHeight / 2, -FIELD_LENGTH / 2 - BOUNDARY_THICKNESS / 2);
	topBoundaryMesh.castShadow = true;
	topBoundaryMesh.receiveShadow = true;
	soccerFieldGroup.add(topBoundaryMesh);
	_addStaticBoxPhysics(world, topBoundaryMesh.position, {
		x: FIELD_WIDTH + BOUNDARY_THICKNESS * 2,
		y: BOUNDARY_HEIGHT,
		z: BOUNDARY_THICKNESS,
	});

	// 下边界（近Z）
	const bottomBoundaryGeo = new THREE.BoxGeometry(
		FIELD_WIDTH + BOUNDARY_THICKNESS * 2,
		boundaryVisualHeight,
		BOUNDARY_THICKNESS
	);
	const bottomBoundaryMesh = new THREE.Mesh(bottomBoundaryGeo, boundaryMaterial);
	bottomBoundaryMesh.position.set(0, boundaryVisualHeight / 2, FIELD_LENGTH / 2 + BOUNDARY_THICKNESS / 2);
	bottomBoundaryMesh.castShadow = true;
	bottomBoundaryMesh.receiveShadow = true;
	soccerFieldGroup.add(bottomBoundaryMesh);
	_addStaticBoxPhysics(world, bottomBoundaryMesh.position, {
		x: FIELD_WIDTH + BOUNDARY_THICKNESS * 2,
		y: BOUNDARY_HEIGHT,
		z: BOUNDARY_THICKNESS,
	});

	// --- 创建场地标记（添加到组） ---
	_createMarkings(soccerFieldGroup);

	// --- 创建球门（添加到组，物理内部添加） ---
	_createGoals(soccerFieldGroup, world);

	// --- 创建足球 ---
	// 将足球放在场地中央，高度设为球体半径加一点点高度，确保它刚好放在地面上
	const ballRadius = 0.22;
	// 足球位置设置为场地中心点，高度为球体半径，确保不会插入地面
	const soccerBall = _createSoccerBall(scene, world, new THREE.Vector3(0, ballRadius * 1.1, 0));
	
	// 立即更新一次足球位置，确保视觉体与物理体同步
	updateSoccerBallPosition(soccerBall);

	// --- 定位整个视觉组 ---
	soccerFieldGroup.position.copy(fieldTargetPosition);
	soccerFieldGroup.name = "SoccerField";
	scene.add(soccerFieldGroup);

	console.log("足球场创建完成，位置:", fieldTargetPosition);

	// 更新足球位置的函数
	const updateSoccerBall = () => {
		if (soccerBall && soccerBall.mesh && soccerBall.body) {
			soccerBall.mesh.position.copy(soccerBall.body.position);
			soccerBall.mesh.quaternion.copy(soccerBall.body.quaternion);
		}
	};

	return {
		soccerFieldGroup, // 视觉组
		fieldBody, // 地面物理体
		soccerBall, // 足球对象
		updateSoccerBall, // 更新足球位置的函数
	};
}

// 导出更新足球位置的函数 - 确保在每帧调用此函数
export function updateSoccerBallPosition(soccerBall) {
	if (soccerBall && soccerBall.mesh && soccerBall.body) {
		// 直接从物理体复制位置和旋转到视觉体
		soccerBall.mesh.position.copy(soccerBall.body.position);
		soccerBall.mesh.quaternion.copy(soccerBall.body.quaternion);
	}
}
