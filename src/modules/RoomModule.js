import * as THREE from "three";

class RoomModule {
	constructor(scene, roomWidth, roomHeight, roomDepth, textsSet1, textsSet2) {
		this.scene = scene;
		this.roomWidth = roomWidth;
		this.roomHeight = roomHeight;
		this.roomDepth = roomDepth;
		this.textsSet1 = textsSet1;
		this.textsSet2 = textsSet2;

		this.room = null;
		this.backWall = null;
		this.leftWall = null;
		this.rightWall = null;
		this.floor = null;
		this.ceiling = null;
		this.originalBackWallPositions = null;

		this.currentTextSet = 1;
		this.lastTextChangeTimestamp = 0;
	}

	createGridTexture(width, height, segmentsX, segmentsY, lineColor, backgroundColor) {
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");

		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, width, height);

		ctx.strokeStyle = lineColor;
		ctx.lineWidth = Math.max(1, Math.min(width, height) / 200); // Responsive line width

		const stepX = width / segmentsX;
		const stepY = height / segmentsY;

		for (let i = 0; i <= segmentsX; i++) {
			const x = i * stepX;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();
		}

		for (let i = 0; i <= segmentsY; i++) {
			const y = i * stepY;
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}
		return new THREE.CanvasTexture(canvas);
	}

	createTextTexture(
		text,
		baseTexture,
		textColor,
		fontDetails,
		canvasWidth,
		canvasHeight,
		textPlacement = { x: 0.5, y: 0.5, maxWidthFactor: 0.8, rotate: 0 }
	) {
		const canvas = document.createElement("canvas");
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		const ctx = canvas.getContext("2d");

		// Draw base texture (grid)
		if (baseTexture && baseTexture.image) {
			ctx.drawImage(baseTexture.image, 0, 0, canvasWidth, canvasHeight);
		} else {
			// Fallback if base texture is not ready or missing
			ctx.fillStyle = "#FFFFFF"; // Default white background
			ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		}

		// Text properties
		ctx.fillStyle = textColor;
		ctx.font = fontDetails;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		const lines = text.split("\n");
		const lineHeight = parseInt(fontDetails.match(/(\d+)px/)[1]) * 1.2;

		if (textPlacement.rotate) {
			ctx.save();
			ctx.translate(canvasWidth * textPlacement.x, canvasHeight * textPlacement.y);
			ctx.rotate((textPlacement.rotate * Math.PI) / 180);
			for (let i = 0; i < lines.length; i++) {
				ctx.fillText(
					lines[i],
					0,
					(i - (lines.length - 1) / 2) * lineHeight,
					canvasWidth * textPlacement.maxWidthFactor
				);
			}
			ctx.restore();
		} else {
			for (let i = 0; i < lines.length; i++) {
				ctx.fillText(
					lines[i],
					canvasWidth * textPlacement.x,
					canvasHeight * textPlacement.y + (i - (lines.length - 1) / 2) * lineHeight,
					canvasWidth * textPlacement.maxWidthFactor
				);
			}
		}

		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;
		return texture;
	}

	createRoom() {
		this.room = new THREE.Group();

		const segments = 10; // Grid segments

		// Textures
		const wallGridTexture = this.createGridTexture(512, 512, segments, segments, "#000000", "#FFFFFF"); // Black grid on white
		const floorGridTexture = this.createGridTexture(512, 512, segments, segments, "#000000", "#FFFFFF");
		const ceilingGridTexture = this.createGridTexture(512, 512, segments, segments, "#FFFFFF", "#000000"); // White grid on black

		// Materials
		const wallMaterial = new THREE.MeshBasicMaterial({ map: wallGridTexture });
		const floorMaterial = new THREE.MeshBasicMaterial({ map: floorGridTexture });
		const ceilingMaterial = new THREE.MeshBasicMaterial({ map: ceilingGridTexture });

		// Floor
		const floorGeometry = new THREE.PlaneGeometry(this.roomWidth, this.roomDepth, segments, segments);
		this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
		this.floor.rotation.x = -Math.PI / 2;
		this.floor.position.y = 0;
		this.room.add(this.floor);

		// Ceiling
		const ceilingGeometry = new THREE.PlaneGeometry(this.roomWidth, this.roomDepth, segments, segments);
		this.ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
		this.ceiling.rotation.x = Math.PI / 2;
		this.ceiling.position.y = this.roomHeight;
		this.room.add(this.ceiling);

		// Back Wall
		// More segments for smoother deformation
		const backWallGeometry = new THREE.PlaneGeometry(this.roomWidth, this.roomHeight, segments * 2, segments * 2);
		this.backWall = new THREE.Mesh(backWallGeometry, wallMaterial.clone()); // Clone material to allow unique text
		this.backWall.position.z = -this.roomDepth / 2;
		this.backWall.position.y = this.roomHeight / 2;
		this.room.add(this.backWall);
		// Store original positions for deformation
		this.originalBackWallPositions = this.backWall.geometry.attributes.position.clone();

		// Left Wall
		const leftWallGeometry = new THREE.PlaneGeometry(this.roomDepth, this.roomHeight, segments * 2, segments);
		this.leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial.clone());
		this.leftWall.rotation.y = Math.PI / 2;
		this.leftWall.position.x = -this.roomWidth / 2;
		this.leftWall.position.y = this.roomHeight / 2;
		this.room.add(this.leftWall);

		// Right Wall
		const rightWallGeometry = new THREE.PlaneGeometry(this.roomDepth, this.roomHeight, segments * 2, segments);
		this.rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial.clone());
		this.rightWall.rotation.y = -Math.PI / 2;
		this.rightWall.position.x = this.roomWidth / 2;
		this.rightWall.position.y = this.roomHeight / 2;
		this.room.add(this.rightWall);

		this.updateWallTexts(this.textsSet1);

		return this.room;
	}

	updateWallTexts(texts) {
		const textCanvasWidth = 1024; // Higher res for text
		const textCanvasHeight = 512; // Or square if text is rotated
		const sideWallCanvasHeight = 1024; // For potentially rotated text on side walls

		const baseFont = "bold 90px Arial, sans-serif"; // Larger base font size
		const textColor = "#000000"; // Black text

		// Back Wall Text
		if (texts.back && this.backWall.material.map) {
			const baseTextureForBack = this.createGridTexture(textCanvasWidth, textCanvasHeight, 10, 5, "#000000", "#FFFFFF");
			this.backWall.material.map = this.createTextTexture(
				texts.back,
				baseTextureForBack,
				textColor,
				baseFont,
				textCanvasWidth,
				textCanvasHeight
			);
			this.backWall.material.needsUpdate = true;
		} else if (!texts.back && this.backWall.material.map) {
			// Clear text if empty
			this.backWall.material.map = this.createGridTexture(512, 512, 10, 10, "#000000", "#FFFFFF");
			this.backWall.material.needsUpdate = true;
		}

		// Left Wall Text
		if (texts.left && this.leftWall.material.map) {
			// For "WHERE", text is horizontal on a canvas, then mapped to vertical wall
			const baseTextureForLeft = this.createGridTexture(
				textCanvasWidth,
				sideWallCanvasHeight,
				10,
				10,
				"#000000",
				"#FFFFFF"
			);
			this.leftWall.material.map = this.createTextTexture(
				texts.left,
				baseTextureForLeft,
				textColor,
				baseFont,
				textCanvasWidth,
				sideWallCanvasHeight,
				{ x: 0.5, y: 0.5, maxWidthFactor: 0.9 }
			);
			this.leftWall.material.needsUpdate = true;
		} else if (!texts.left && this.leftWall.material.map) {
			// Clear text if empty
			this.leftWall.material.map = this.createGridTexture(512, 512, 10, 10, "#000000", "#FFFFFF");
			this.leftWall.material.needsUpdate = true;
		}

		// Right Wall Text
		if (texts.right && this.rightWall.material.map) {
			const baseTextureForRight = this.createGridTexture(
				textCanvasWidth,
				sideWallCanvasHeight,
				10,
				10,
				"#000000",
				"#FFFFFF"
			);
			this.rightWall.material.map = this.createTextTexture(
				texts.right,
				baseTextureForRight,
				textColor,
				baseFont,
				textCanvasWidth,
				sideWallCanvasHeight,
				{ x: 0.5, y: 0.5, maxWidthFactor: 0.9 }
			);
			this.rightWall.material.needsUpdate = true;
		} else if (!texts.right && this.rightWall.material.map) {
			// Clear text
			this.rightWall.material.map = this.createGridTexture(512, 512, 10, 10, "#000000", "#FFFFFF");
			this.rightWall.material.needsUpdate = true;
		}
	}

	deformBackWall(time) {
		if (!this.backWall || !this.originalBackWallPositions) return;

		const positions = this.backWall.geometry.attributes.position;
		const vertex = new THREE.Vector3();
		const pulseSpeed = 1.5;
		const maxAmplitude = 0.3; // Subtle deformation

		for (let i = 0; i < positions.count; i++) {
			vertex.fromBufferAttribute(this.originalBackWallPositions, i);

			// Normalized coordinates relative to the center of the plane
			const normalizedX = vertex.x / (this.roomWidth / 2);
			const normalizedY = vertex.y / (this.roomHeight / 2);

			// Create a radial gradient for the effect (stronger at center, fades to edges)
			const distFromCenter = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
			const effectStrength = Math.cos((distFromCenter * Math.PI) / 2); // Strongest at center (1), 0 at edges

			if (effectStrength > 0) {
				const bulge = Math.sin(time * pulseSpeed) * maxAmplitude * effectStrength;
				positions.setZ(i, vertex.z + bulge);
			} else {
				positions.setZ(i, vertex.z); // No bulge if outside effect radius
			}
		}
		positions.needsUpdate = true;
	}

	update(elapsedTime, textChangeTime) {
		// Change text periodically
		if (elapsedTime - this.lastTextChangeTimestamp > textChangeTime) {
			if (this.currentTextSet === 1) {
				this.updateWallTexts(this.textsSet2);
				this.currentTextSet = 2;
			} else {
				this.updateWallTexts(this.textsSet1);
				this.currentTextSet = 1;
			}
			this.lastTextChangeTimestamp = elapsedTime;
		}

		this.deformBackWall(elapsedTime);
	}
}

export { RoomModule };
