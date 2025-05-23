// src/modules/tv.js
import * as THREE from 'three';
// import * as TWEEN from '@tweenjs/tween.js'; // TWEEN 不再用于字幕
// import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'; // FontLoader 由 script.js 传入
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'; // TextGeometry 必须显式导入 for r158

// --- Module State ---
let video;
let videoTexture;
let tvMesh;
let tvScreenMaterial;
let sceneRef;
let fontLoaderRef; // FontLoader instance passed from script.js
let loadedFont = null; // Store the loaded font for subtitles/timer
let progressBarFillMesh = null;
let timerMesh = null;

// Materials needed (passed during init)
let materials = {
    matcap_5: null, // For subtitles (MeshMatcapMaterial)
    matcap_7: null, // For timer (MeshMatcapMaterial)
    terrain_texture: null, // For TV sides (Texture)
};

// --- Subtitle State (Using Original Variable Names) ---
let isSubtitlesActive = false;
let currentSubtitleIndex = 0;
let subtitleParticles = []; // Array to hold currently displayed particle objects {mesh, moveTo}
let subtitleMeshGroup = null; // Group to hold subtitle character meshes
let currentSubtitles = null; // Array of current subtitle objects {start, end, text}
let charGeometryCache = {}; // Cache for character geometries

// --- Helper: Update Timer Mesh (Keep this as is) ---
function _updateTimerMesh(text) {
    if (!loadedFont || !sceneRef || !materials.matcap_7) return;
    if (timerMesh) {
        if (timerMesh.geometry) {
            timerMesh.geometry.dispose(); // Dispose old geometry
        }
        // Try removing from potential parents
        tvMesh?.remove(timerMesh); // Use optional chaining in case tvMesh isn't ready
        sceneRef?.remove(timerMesh); // Also try removing from scene as a fallback
        timerMesh = null; // Nullify the reference
    }
    const timerGeometry = new TextGeometry(text, { font: loadedFont, size: 0.1, height: 0.01, curveSegments: 4, bevelEnabled: false });
    timerGeometry.center();
    timerMesh = new THREE.Mesh(timerGeometry, materials.matcap_7);
    timerMesh.position.set(1.2, 0.3, -7.78); // Position relative to TV center
    if (tvMesh) { // Add timer relative to TV mesh's position if desired
        const timerWorldPos = new THREE.Vector3(1.2, - (2.25/2) - 0.1 * 1.5 , 0.11 + 0.01); // Below progress bar
        tvMesh.localToWorld(timerWorldPos); // Convert local offset to world
        // timerMesh.position.copy(timerWorldPos); // Option 1: Add to scene at world pos
        timerMesh.position.set(1.2, - (2.25/2) - 0.1 * 1.5 , 0.11 + 0.01); // Option 2: Add as child (adjust Z slightly forward)
        tvMesh.add(timerMesh); // Add as child of TV
    } else {
        sceneRef.add(timerMesh); // Fallback: add directly to scene
    }
}

// --- Message Listener (Keep this as is, but ensure subtitle state is reset) ---
function _handleVideoMessage(event) {
    const allowedOrigins = ["https://nankawa-chie.vercel.app"];
    const isLocalhost = event.origin.startsWith('http://localhost:') || event.origin.startsWith('http://127.0.0.1:');
    if (!isLocalhost && !allowedOrigins.includes(event.origin)) {
        console.warn(`Message rejected from origin: ${event.origin}`);
        return;
    }
    const data = event.data;
    if (data && data.type === 'VIDEO_CONTROL') {
        console.log("Received VIDEO_CONTROL message:", data);
        if (data.action === 'PLAY' && data.videoURL && video) {
            // --- Reset Subtitle State ---
            if (subtitleParticles.length > 0) {
                 disperseSubtitleParticles(); // Disperse old particles immediately
                 console.log("Dispersing previous subtitles due to new video.");
            }
            currentSubtitleIndex = 0;
            currentSubtitles = data.subtitles || null;
            isSubtitlesActive = false; // Reset flag, wait for user interaction or video start
            // --- End Reset ---

            video.src = data.videoURL;
            video.load();
            video.oncanplaythrough = () => {
                if (video.currentSrc === data.videoURL || video.currentSrc.endsWith(data.videoURL) ) {
                    video.play().catch(e => console.error("Video play failed:", e));
                    // Start subtitle processing when video actually starts playing
                    // The subtitlesTick loop will handle the timing
                    isSubtitlesActive = true; // Enable processing now
                    console.log("Video playing. Subtitles loaded:", currentSubtitles ? currentSubtitles.length : 0);
                } else { console.warn("Video source mismatch, not playing."); }
            };
            video.onerror = (e) => { console.error("Video loading error:", e, video.error); isSubtitlesActive = false; };
            if (tvScreenMaterial && tvScreenMaterial.map !== videoTexture) { tvScreenMaterial.map = videoTexture; tvScreenMaterial.needsUpdate = true; }
        } else if (data.action === 'PAUSE' && video) {
            video.pause();
            // isSubtitlesActive = false; // Don't disable tick, just stop creating/dispersing
            console.log("Video paused.");
        }
    }
}

// --- Subtitle Functions (Restored from Original Code) ---

// !! Use the original createSubtitleParticles function !!
function createSubtitleParticles(font, text) {
    if (!font || !subtitleMeshGroup || !materials.matcap_5) {
         console.error("Cannot create subtitles: Font, Group, or Material missing.");
         return;
    }
     // Clear previous immediately (gsap should handle interruption)
    // disperseSubtitleParticles(); // Called before PLAY now

	// Calculate width (using cache preferably)
	let totalWidth = 0;
	const charSpacing = 0.1;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (char === " ") { totalWidth += charSpacing * 2; continue; }
		const charGeometry = charGeometryCache[char]; // Use cache
		if (!charGeometry) { console.warn(`Geometry not cached for char: ${char}`); continue; }
		// Bounding box already computed during caching
		const charWidth = charGeometry.boundingBox.max.x - charGeometry.boundingBox.min.x;
		totalWidth += charWidth + charSpacing;
	}
	let currentXOffset = -totalWidth / 2;

	// Create meshes
    console.log(`Creating subtitle particles for: "${text}"`);
	subtitleParticles = []; // Clear array before adding new particles
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (char === " ") { currentXOffset += charSpacing * 2; continue; }
		const charGeometry = charGeometryCache[char];
		if (!charGeometry) continue; // Skip if not cached

        const charWidth = charGeometry.boundingBox.max.x - charGeometry.boundingBox.min.x;
		const posX = currentXOffset + charWidth / 2; // Center char
		currentXOffset += charWidth + charSpacing;

		// IMPORTANT: Use the matcap material instance passed during init
		const material = materials.matcap_5;
		const charMesh = new THREE.Mesh(charGeometry, material);

		// Target position (relative to TV or scene?) Assume relative to TV position slightly forward
        const targetPos = new THREE.Vector3(posX, 3.2, -7.75); // Slightly more forward

		// Add to group *before* getting world position if target is world space
        // OR calculate world target position based on tvMesh's world position
        let worldTargetPos = new THREE.Vector3();
        if(tvMesh) {
            const localTarget = new THREE.Vector3(posX, 0, 0.15); // Local offset from TV center
             tvMesh.localToWorld(localTarget);
             worldTargetPos.copy(localTarget);
             // Adjust Y based on desired height in world
             worldTargetPos.y = 3.2; // Set absolute world Y height
        } else {
            worldTargetPos.copy(targetPos); // Fallback to absolute if tvMesh missing
        }


		subtitleMeshGroup.add(charMesh);
		subtitleParticles.push({
			mesh: charMesh,
			moveTo: worldTargetPos, // Store world target position
		});

        // Initial random position in world space
        charMesh.position.set(
            worldTargetPos.x + (Math.random() - 0.5) * 10,
            worldTargetPos.y + (Math.random() - 0.5) * 10 + 5, // Start higher
            worldTargetPos.z + (Math.random() - 0.5) * 10
        );
         // Initial random rotation
         charMesh.rotation.set(
             (Math.random() - 0.5) * Math.PI * 2,
             (Math.random() - 0.5) * Math.PI * 2,
             (Math.random() - 0.5) * Math.PI * 2
         );
          // Initial small scale
         charMesh.scale.set(0.01, 0.01, 0.01);


        // Animate using GSAP (assuming global gsap from CDN)
        if (typeof gsap !== 'undefined') {
            gsap.to(charMesh.position, {
                duration: 1.5, // Original duration
                x: worldTargetPos.x,
                y: worldTargetPos.y,
                z: worldTargetPos.z,
                ease: "power2.out", // Example ease
            });
             gsap.to(charMesh.rotation, {
                 duration: 1.5,
                 x: 0,
                 y: 0, // Align with TV? Might need character's rotation? Assume 0 for now
                 z: 0,
                 ease: "power2.out",
             });
              gsap.to(charMesh.scale, {
                  duration: 1.5,
                  x: 1,
                  y: 1,
                  z: 1,
                  ease: "power2.out",
              });
        } else {
             console.warn("GSAP not found for subtitle animation.");
             // Fallback: Set directly
             charMesh.position.copy(worldTargetPos);
             charMesh.rotation.set(0, 0, 0);
             charMesh.scale.set(1, 1, 1);
        }
	}
}

// !! Use the original disperseSubtitleParticles function !!
function disperseSubtitleParticles() {
    if (!subtitleMeshGroup || subtitleParticles.length === 0) return;
    console.log(`Dispersing ${subtitleParticles.length} subtitle particles.`);

	subtitleParticles.forEach((particle) => {
        if (!particle || !particle.mesh) return; // Safety check

        // Target random position relative to current position
		const randomPos = {
			x: particle.mesh.position.x + (Math.random() - 0.5) * 15, // Disperse wider
			y: particle.mesh.position.y + (Math.random() - 0.5) * 15,
			z: particle.mesh.position.z + (Math.random() - 0.5) * 15,
		};
        // Target random rotation
        const randomRot = {
             x: (Math.random() - 0.5) * Math.PI * 4,
             y: (Math.random() - 0.5) * Math.PI * 4,
             z: (Math.random() - 0.5) * Math.PI * 4,
         };
        // Target zero scale
         const targetScale = 0.01;

        if (typeof gsap !== 'undefined') {
            gsap.to(particle.mesh.position, {
                duration: 1.0, // Faster dispersal? Original was 3s
                x: randomPos.x,
                y: randomPos.y,
                z: randomPos.z,
                ease: "power1.in",
                // No onComplete needed here, cleanup happens below
            });
             gsap.to(particle.mesh.rotation, {
                 duration: 1.0,
                 x: randomRot.x,
                 y: randomRot.y,
                 z: randomRot.z,
                 ease: "power1.in",
             });
              gsap.to(particle.mesh.scale, {
                  duration: 1.0,
                  x: targetScale,
                  y: targetScale,
                  z: targetScale,
                  ease: "power1.in",
                  onComplete: () => {
                     // Remove and dispose ONLY after animation completes
                     if (particle.mesh.geometry) particle.mesh.geometry.dispose();
                     // Material is shared, don't dispose
                     subtitleMeshGroup.remove(particle.mesh);
                 }
              });
        } else {
            console.warn("GSAP not found for subtitle dispersal.");
             // Fallback: Remove immediately without animation
             if (particle.mesh.geometry) particle.mesh.geometry.dispose();
             subtitleMeshGroup.remove(particle.mesh);
        }
	});
	subtitleParticles = []; // Clear the array immediately after starting animations
}


// --- Subtitle Ticker Loop (Restored) ---
function subtitlesTick() {
    // Loop continuously regardless of isSubtitlesActive flag
    // The flag controls whether we *process* subtitles inside the loop

    if (isSubtitlesActive && video && video.readyState >= video.HAVE_ENOUGH_DATA && currentSubtitles && !video.paused) {
        const elapsedTime = video.currentTime;

        if (currentSubtitleIndex < currentSubtitles.length) {
            const subtitle = currentSubtitles[currentSubtitleIndex];
            const currentlyDisplaying = subtitleParticles.length > 0;

            if (elapsedTime >= subtitle.start && elapsedTime < subtitle.end) {
                 // If within time range and NOT already displaying, create particles
                if (!currentlyDisplaying) {
                    createSubtitleParticles(loadedFont, subtitle.text);
                }
            } else if (elapsedTime >= subtitle.end) {
                 // If past end time and particles ARE displaying, disperse them
                 if (currentlyDisplaying) {
                     disperseSubtitleParticles();
                 }
                 // Move to next subtitle index *only* if past the end time
                 currentSubtitleIndex++;
            } else if (elapsedTime < subtitle.start && currentlyDisplaying) {
                 // If time is before start (e.g., seek backwards) AND particles are showing, disperse them
                 disperseSubtitleParticles();
                 // Don't increment index here, wait for time to reach subtitle.start
            }
        } else {
             // Past the last subtitle, ensure any remaining particles are dispersed
            if (subtitleParticles.length > 0) {
                disperseSubtitleParticles();
            }
        }
    } else if (video && currentSubtitles && video.paused && subtitleParticles.length > 0) {
         // Optional: Disperse if video paused while subtitles are showing?
         // disperseSubtitleParticles();
    } else if (!currentSubtitles && subtitleParticles.length > 0) {
        // If no subtitles are loaded (e.g., video changed), disperse any leftovers
        disperseSubtitleParticles();
    }

    // Keep the loop running
    requestAnimationFrame(subtitlesTick);
}


// --- Exported Functions ---

export function initTV(scene, houseGroup, textureLoader, fontLoaderInstance, requiredMaterials) {
    if (!scene || !houseGroup || !textureLoader || !fontLoaderInstance || !requiredMaterials) { console.error("Missing arguments for initTV."); return; }
    sceneRef = scene;
    fontLoaderRef = fontLoaderInstance; // Store FontLoader instance

    // Store material references
    materials.matcap_5 = requiredMaterials.matcap_5;
    materials.matcap_7 = requiredMaterials.matcap_7;
    materials.terrain_texture = requiredMaterials.terrain_texture?.clone(); // Clone texture for TV sides if needed
    if (!materials.matcap_5 || !materials.matcap_7 || !materials.terrain_texture) { console.error("Required materials not provided in initTV."); return; }

    // --- Video Element & Texture ---
    video = document.createElement('video');
    video.setAttribute('playsinline', ''); video.muted = false; video.loop = false;
    videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter; videoTexture.magFilter = THREE.LinearFilter; videoTexture.format = THREE.RGBAFormat; // Use RGBA

    // --- TV Materials & Mesh ---
    tvScreenMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.FrontSide, color: 0xcccccc }); // Start greyish
    const sideMaterial = new THREE.MeshStandardMaterial({ map: materials.terrain_texture });
    const tvMaterials = [sideMaterial, sideMaterial, sideMaterial, sideMaterial, tvScreenMaterial, sideMaterial];
    const tvGeometry = new THREE.BoxGeometry(4, 2.25, 0.2);
    tvMesh = new THREE.Mesh(tvGeometry, tvMaterials);
    tvMesh.position.set(0, 1.6, -7.9);
    houseGroup.add(tvMesh);

    // --- Subtitle Group ---
    subtitleMeshGroup = new THREE.Group();
    sceneRef.add(subtitleMeshGroup); // Add to main scene

    // --- Progress Bar (Keep as before) ---
    const barWidth = 2, barHeight = 0.1, barDepth = 0.02;
    const progressBarBgGeometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
    const progressBarBgMaterial = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.7 });
    const progressBarBgMesh = new THREE.Mesh(progressBarBgGeometry, progressBarBgMaterial);
    progressBarBgMesh.position.set(0, - (2.25/2) - barHeight * 1.5 , 0.11);
    tvMesh.add(progressBarBgMesh);
    const progressBarFillGeometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
    const progressBarFillMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    progressBarFillMesh = new THREE.Mesh(progressBarFillGeometry, progressBarFillMaterial);
    progressBarFillMesh.scale.x = 0;
    progressBarFillMesh.position.set(-barWidth / 2, 0, 0.01);
    progressBarBgMesh.add(progressBarFillMesh);

    // --- Load Font & Start Ticker ---
    console.log("TV Module: Loading font...");
    fontLoaderRef.load('fonts/Ma_Shan_Zheng_Regular.json', // Use correct font name from original
        (font) => {
            loadedFont = font;
            console.log("TV module font loaded. Caching geometries...");
            // --- Pre-cache geometries (Restored from original) ---
            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ—夜就恐梦来留我扛日坎难场却压勇远漂这后比艰避流孤昨狂黑风丽法扰作新境要自今停活会对拂重坚惶够决敢安骤成颊头渐任逃正脸忆困暗背慎永惧刻凭条地行雨此渺脱徐坷使著人纵愿沉掌失在仿稍害多带只前紧解还眼下向没往是飘从手独么实怕获上又明定现迷放回起曾个佛过的错时中能路握咽色强纷再不确清得于无戒囊走天随一袭面心让美 ";
            charGeometryCache = {}; // Clear previous cache if any
            for (let i = 0; i < chars.length; i++) {
                const char = chars[i];
                if (!charGeometryCache[char]) { // Check if already cached (unlikely here)
                    try {
                        charGeometryCache[char] = new TextGeometry(char, { font: loadedFont, size: 0.2, height: 0.01, curveSegments: 4, bevelEnabled: false });
                        charGeometryCache[char].computeBoundingBox(); // Pre-compute
                    } catch (geomError) {
                         console.error(`Error creating geometry for char: ${char}`, geomError);
                    }
                }
            }
            console.log(`Cached ${Object.keys(charGeometryCache).length} character geometries.`);
            // --- End Cache ---

            _updateTimerMesh("00:00"); // Init timer text
            subtitlesTick(); // <<<--- START THE TICKER LOOP HERE ---<<<
            console.log("Subtitle ticker started.");
        },
        undefined,
        (err) => { console.error("Failed to load font for TV module:", err); }
    );

    // --- Message Listener ---
    window.addEventListener('message', _handleVideoMessage);
    console.log("TV system initialized.");
}

// updateTV function now ONLY handles texture, progress bar, timer
export function updateTV(time) { // time might not be needed if TWEEN isn't used
    // Update video texture (only needs update if paused/resumed? VideoTexture updates automatically)
    // if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
    //     videoTexture.needsUpdate = true; // Generally not needed for VideoTexture
    // }

    // Update Progress Bar & Timer
    if (video && video.duration > 0 && progressBarFillMesh && loadedFont) {
        const progress = video.currentTime / video.duration;
        if (isFinite(progress)) {
            progressBarFillMesh.scale.x = Math.max(0, Math.min(1, progress));
            progressBarFillMesh.position.x = - (progressBarFillMesh.geometry.parameters.width / 2) * (1 - progressBarFillMesh.scale.x);
            const currentTime = video.currentTime;
            const minutes = Math.floor(currentTime / 60).toString().padStart(2, '0');
            const seconds = Math.floor(currentTime % 60).toString().padStart(2, '0');
            _updateTimerMesh(`${minutes}:${seconds}`);
        }
    } else if (progressBarFillMesh) {
        // Reset progress bar if no duration or video stopped
         progressBarFillMesh.scale.x = 0;
         progressBarFillMesh.position.x = -progressBarFillMesh.geometry.parameters.width / 2;
         _updateTimerMesh("00:00"); // Reset timer text
    }

    // No TWEEN update needed here anymore for subtitles
    // TWEEN.update(time);
}

export function disposeTV() {
    window.removeEventListener('message', _handleVideoMessage);
    if (video) { video.pause(); video.src = ""; video = null; }
    if (videoTexture) { videoTexture.dispose(); videoTexture = null; }
    if (tvScreenMaterial) { tvScreenMaterial.dispose(); tvScreenMaterial = null; }
    // Dispose cached geometries
    Object.values(charGeometryCache).forEach(geom => geom.dispose());
    charGeometryCache = {};
    // Dispose subtitle particles (should be handled by disperse on stop/change)
    subtitleParticles.forEach(p => {
        if (p.mesh?.geometry) p.mesh.geometry.dispose(); // Dispose remaining geometries
        subtitleMeshGroup?.remove(p.mesh); // Remove from group
    });
    subtitleParticles = [];
    if (subtitleMeshGroup) { sceneRef?.remove(subtitleMeshGroup); subtitleMeshGroup = null;}
    if (timerMesh) { if (timerMesh.geometry) timerMesh.geometry.dispose(); sceneRef?.remove(timerMesh); tvMesh?.remove(timerMesh); timerMesh = null; }
    // ProgressBar meshes are children of tvMesh, disposed when tvMesh is removed/disposed implicitly if parent is removed.
    sceneRef = null; fontLoaderRef = null; loadedFont = null;
    materials.matcap_5 = null; materials.matcap_7 = null; materials.terrain_texture = null;
    console.log("TV system disposed.");
}