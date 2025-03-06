import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import MobileControls from './MobileControls.js';
import AudioManager from './AudioManager.js';
import BiomeGenerator from './BiomeGenerator.js';

// Main game engine
class LabyrinthEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.maze = null;
        this.player = null;
        this.playerCollider = null;
        this.labyrinthData = null;
        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.playerSpeed = 5;
        this.playerRotationSpeed = 3;
        this.mobileControls = null;
        this.audioManager = null;
        this.biomeGenerator = null;
        this.raycaster = new THREE.Raycaster();
        this.keyStates = {};
        this.wallHeight = 3;
        this.playerHeight = 1.7;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canMove = true;
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    init(container, labyrinthData) {
        if (this.isRunning) this.cleanup();
        
        this.labyrinthData = labyrinthData;
        this.container = container;
        
        // Initialize Three.js components
        this.initScene();
        this.initCamera();
        this.initRenderer();
        this.initControls();
        this.initLighting();
        
        // Add event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Initialize mobile controls if on mobile device
        if (this.isMobile) {
            this.mobileControls = new MobileControls(this);
            this.mobileControls.init(container);
        }
        
        // Initialize audio manager
        this.audioManager = new AudioManager();
        if (labyrinthData.musicUrl) {
            this.audioManager.loadAudio(labyrinthData.musicUrl);
        }
        
        // Initialize biome generator
        this.biomeGenerator = new BiomeGenerator(this.scene, labyrinthData);
        
        // Generate the maze
        this.generateMaze();
        
        // Add player
        this.addPlayer();
        
        // Start the animation loop
        this.isRunning = true;
        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Create fog based on biome type
        const fogColor = this.getBiomeFogColor(this.labyrinthData.biomeType);
        this.scene.fog = new THREE.FogExp2(fogColor, 0.05);
    }

    getBiomeFogColor(biomeType) {
        const fogColors = {
            forest: 0x1a472a,
            desert: 0xe8c17d,
            ice: 0xccf5ff,
            volcanic: 0x340808,
            crystal: 0x4fd5d6,
            underwater: 0x0a4a7a,
            space: 0x000011,
            ancient: 0x3f3e36
        };
        return fogColors[biomeType] || 0x000000;
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, this.playerHeight, 0);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        this.renderer.domElement.id = 'game-canvas';
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.enableZoom = false; // Disable zooming
        this.controls.enablePan = false; // Disable panning
        this.controls.enableRotate = !this.isMobile; // Disable rotation on mobile
        this.controls.maxPolarAngle = Math.PI / 2; // Limit vertical rotation
    }

    initLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun/moon)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
        
        // Add point lights throughout the maze based on biome
        this.addBiomeLights();
    }

    addBiomeLights() {
        const biomeType = this.labyrinthData.biomeType;
        let color, intensity;
        
        switch(biomeType) {
            case 'forest':
                color = 0x8dc78f; // Soft green
                intensity = 1.2;
                break;
            case 'desert':
                color = 0xffd966; // Warm yellow
                intensity = 1.5;
                break;
            case 'ice':
                color = 0xa5f2f3; // Ice blue
                intensity = 1.3;
                break;
            case 'volcanic':
                color = 0xff5500; // Orange red
                intensity = 1.2;
                break;
            case 'crystal':
                color = 0x9966cc; // Purple
                intensity = 1.4;
                break;
            case 'underwater':
                color = 0x39a0a4; // Teal
                intensity = 0.9;
                break;
            case 'space':
                color = 0x6666ff; // Blue purple
                intensity = 0.7;
                break;
            case 'ancient':
                color = 0xd4b886; // Antique gold
                intensity = 1.0;
                break;
            default:
                color = 0xffffff;
                intensity = 1.0;
        }
        
        // Add a hemisphere light appropriate for the biome
        const hemiLight = new THREE.HemisphereLight(color, 0x404040, intensity);
        this.scene.add(hemiLight);
    }

    generateMaze() {
        const { size, complexity, seed, loops } = this.labyrinthData.mazeParams;
        
        // Create a grid for the maze
        const mazeSize = size || 20;
        const grid = Array(mazeSize).fill().map(() => Array(mazeSize).fill(1)); // 1 = wall
        
        // Simple maze generation algorithm (Depth-First Search)
        const stack = [];
        const startX = 1;
        const startZ = 1;
        
        // Mark the starting cell as visited
        grid[startZ][startX] = 0; // 0 = path
        
        // Create a starting point
        stack.push({ x: startX, z: startZ });
        
        // Directions: [x, z]
        const directions = [
            [0, -2], // North
            [2, 0],  // East
            [0, 2],  // South
            [-2, 0]  // West
        ];
        
        // Helper function to get random element
        const getRandomDirection = (arr) => {
            return arr[Math.floor(Math.random() * arr.length)];
        };
        
        // Depth-First Search maze generation
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            
            // Get unvisited neighbors
            const unvisitedNeighbors = [];
            
            for (const [dx, dz] of directions) {
                const nx = current.x + dx;
                const nz = current.z + dz;
                
                // Check if the neighbor is within the bounds
                if (nx > 0 && nx < mazeSize - 1 && nz > 0 && nz < mazeSize - 1) {
                    // Check if the neighbor is unvisited
                    if (grid[nz][nx] === 1) {
                        unvisitedNeighbors.push({ x: nx, z: nz, dx, dz });
                    }
                }
            }
            
            // If there are unvisited neighbors
            if (unvisitedNeighbors.length > 0) {
                // Choose a random unvisited neighbor
                const { x, z, dx, dz } = getRandomDirection(unvisitedNeighbors);
                
                // Remove the wall between the current cell and the chosen neighbor
                grid[current.z + dz/2][current.x + dx/2] = 0;
                
                // Mark the chosen neighbor as visited
                grid[z][x] = 0;
                
                // Push the chosen neighbor to the stack
                stack.push({ x, z });
            } else {
                // Backtrack
                stack.pop();
            }
        }
        
        // Add loops to make the maze more interesting
        if (loops) {
            const loopCount = Math.floor(mazeSize * complexity);
            for (let i = 0; i < loopCount; i++) {
                const x = Math.floor(Math.random() * (mazeSize - 4)) + 2;
                const z = Math.floor(Math.random() * (mazeSize - 4)) + 2;
                if (x % 2 === 1 || z % 2 === 1) { // Only remove walls (odd coordinates)
                    grid[z][x] = 0;
                }
            }
        }
        
        // Add secret rooms
        const secretRoomCount = this.labyrinthData.mazeParams.secretRooms || 3;
        for (let i = 0; i < secretRoomCount; i++) {
            const roomSize = Math.floor(Math.random() * 2) + 2;
            const x = Math.floor(Math.random() * (mazeSize - roomSize - 4)) + 2;
            const z = Math.floor(Math.random() * (mazeSize - roomSize - 4)) + 2;
            
            // Create the room
            for (let rz = 0; rz < roomSize; rz++) {
                for (let rx = 0; rx < roomSize; rx++) {
                    grid[z + rz][x + rx] = 0;
                }
            }
            
            // Ensure there's at least one path to the room
            const dir = Math.floor(Math.random() * 4);
            switch (dir) {
                case 0: // North
                    grid[z - 1][x + Math.floor(roomSize / 2)] = 0;
                    break;
                case 1: // East
                    grid[z + Math.floor(roomSize / 2)][x + roomSize] = 0;
                    break;
                case 2: // South
                    grid[z + roomSize][x + Math.floor(roomSize / 2)] = 0;
                    break;
                case 3: // West
                    grid[z + Math.floor(roomSize / 2)][x - 1] = 0;
                    break;
            }
        }
        
        // Set start and end points
        const endX = mazeSize - 2;
        const endZ = mazeSize - 2;
        grid[endZ][endX] = 2; // 2 = end point
        
        // Generate the maze geometry
        this.maze = new THREE.Group();
        this.scene.add(this.maze);
        
        // Load textures
        this.biomeGenerator.loadTextures(this.labyrinthData.wallTexture, this.labyrinthData.floorTexture).then(() => {
            // Create floor
            const floorGeometry = new THREE.PlaneGeometry(mazeSize * 2, mazeSize * 2);
            const floorMaterial = new THREE.MeshStandardMaterial({
                map: this.biomeGenerator.floorTexture,
                roughness: 0.8,
                metalness: 0.2
            });
            
            const floor = new THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotation.x = -Math.PI / 2;
            floor.position.y = -0.1;
            floor.receiveShadow = true;
            this.maze.add(floor);
            
            // Create walls
            const wallGeometry = new THREE.BoxGeometry(2, this.wallHeight, 2);
            const wallMaterial = new THREE.MeshStandardMaterial({
                map: this.biomeGenerator.wallTexture,
                roughness: 0.7,
                metalness: 0.3
            });
            
            // Create a map to store wall positions (for collision detection)
            this.wallPositions = [];
            
            // Add walls and other elements
            for (let z = 0; z < mazeSize; z++) {
                for (let x = 0; x < mazeSize; x++) {
                    const posX = (x - mazeSize / 2) * 2;
                    const posZ = (z - mazeSize / 2) * 2;
                    
                    if (grid[z][x] === 1) { // Wall
                        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                        wall.position.set(posX, this.wallHeight / 2, posZ);
                        wall.castShadow = true;
                        wall.receiveShadow = true;
                        this.maze.add(wall);
                        
                        // Store wall position for collision detection
                        this.wallPositions.push({
                            x: posX,
                            z: posZ,
                            size: 2 // Size of the wall
                        });
                        
                    } else if (grid[z][x] === 2) { // End point
                        // Create a marker for the end point
                        const endPointGeometry = new THREE.SphereGeometry(1, 32, 32);
                        const endPointMaterial = new THREE.MeshStandardMaterial({
                            color: 0xffff00,
                            emissive: 0xffaa00,
                            emissiveIntensity: 0.5
                        });
                        
                        const endPoint = new THREE.Mesh(endPointGeometry, endPointMaterial);
                        endPoint.position.set(posX, 1.5, posZ);
                        
                        // Add animation
                        this.endPoint = endPoint;
                        this.maze.add(endPoint);
                    }
                }
            }
            
            // Add decorative elements based on biome
            this.biomeGenerator.addBiomeElements(this.maze, this.wallPositions, mazeSize);
            
            // Set player position at start
            if (this.player) {
                this.player.position.set(
                    (startX - mazeSize / 2) * 2,
                    this.playerHeight,
                    (startZ - mazeSize / 2) * 2
                );
                this.camera.position.copy(this.player.position);
            }
        });
    }

    addPlayer() {
        // Create player object
        this.player = new THREE.Group();
        this.player.position.y = this.playerHeight;
        
        // Add a light to the player
        const playerLight = new THREE.PointLight(0xffffff, 0.7, 10);
        playerLight.position.set(0, 0.5, 0);
        this.player.add(playerLight);
        
        // Create player collider
        this.playerCollider = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0.5);
        
        // Add player to scene
        this.scene.add(this.player);
        
        // Set camera as child of player
        this.player.add(this.camera);
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = true;
                break;
            case 'KeyM':
                if (this.audioManager) {
                    this.audioManager.toggleMute();
                }
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = false;
                break;
        }
    }

    updatePlayer(delta) {
        if (!this.player || !this.canMove) return;
        
        const speed = this.playerSpeed * delta;
        const rotationSpeed = this.playerRotationSpeed * delta;
        
        // Movement direction vector
        let direction = new THREE.Vector3();
        
        // Forward/backward
        if (this.moveForward) {
            direction.z -= 1;
        }
        if (this.moveBackward) {
            direction.z += 1;
        }
        
        // Left/right
        if (this.moveLeft) {
            direction.x -= 1;
        }
        if (this.moveRight) {
            direction.x += 1;
        }
        
        // Normalize the direction vector
        if (direction.length() > 0) {
            direction.normalize();
        }
        
        // Apply movement in the direction the camera is facing
        if (direction.z !== 0) {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this.camera.quaternion);
            forward.y = 0;
            forward.normalize();
            
            const moveVector = forward.multiplyScalar(direction.z * speed);
            
            // Check for wall collisions before moving
            if (!this.checkWallCollision(moveVector)) {
                this.player.position.add(moveVector);
            }
        }
        
        // Strafe movement (left/right)
        if (direction.x !== 0) {
            const right = new THREE.Vector3(1, 0, 0);
            right.applyQuaternion(this.camera.quaternion);
            right.y = 0;
            right.normalize();
            
            const moveVector = right.multiplyScalar(direction.x * speed);
            
            // Check for wall collisions before moving
            if (!this.checkWallCollision(moveVector)) {
                this.player.position.add(moveVector);
            }
        }
        
        // Update player collider position
        this.playerCollider.center.copy(this.player.position);
    }

    checkWallCollision(moveVector) {
        // Test the future position for wall collisions
        const futurePosition = this.player.position.clone().add(moveVector);
        
        // Check against walls
        for (const wall of this.wallPositions) {
            const wallMinX = wall.x - wall.size / 2;
            const wallMaxX = wall.x + wall.size / 2;
            const wallMinZ = wall.z - wall.size / 2;
            const wallMaxZ = wall.z + wall.size / 2;
            
            // Player radius
            const playerRadius = 0.5;
            
            // Check if the player's sphere intersects with the wall box
            if (
                futurePosition.x + playerRadius > wallMinX &&
                futurePosition.x - playerRadius < wallMaxX &&
                futurePosition.z + playerRadius > wallMinZ &&
                futurePosition.z - playerRadius < wallMaxZ
            ) {
                return true; // Collision detected
            }
        }
        
        return false; // No collision
    }

    checkEndPointCollision() {
        if (!this.endPoint || !this.player) return false;
        
        // Distance between player and end point
        const distance = this.player.position.distanceTo(this.endPoint.position);
        
        // If player is close enough to end point
        if (distance < 2) {
            return true;
        }
        
        return false;
    }

    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(this.animate.bind(this));
        
        const delta = this.clock.getDelta();
        
        // Update player movement
        this.updatePlayer(delta);
        
        // Check for end point collision
        if (this.checkEndPointCollision()) {
            this.handleLevelComplete();
        }
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Animate end point
        if (this.endPoint) {
            this.endPoint.position.y = 1.5 + Math.sin(Date.now() * 0.001) * 0.2;
            this.endPoint.rotation.y += delta * 0.5;
        }
        
        // Update biome effects
        if (this.biomeGenerator) {
            this.biomeGenerator.updateEffects(delta);
        }
        
        // Render scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    handleLevelComplete() {
        // Stop player movement
        this.canMove = false;
        
        // Celebration effects
        this.biomeGenerator.createCelebrationEffect(this.player.position);
        
        // Display success message
        const successElement = document.createElement('div');
        successElement.style.position = 'absolute';
        successElement.style.top = '50%';
        successElement.style.left = '50%';
        successElement.style.transform = 'translate(-50%, -50%)';
        successElement.style.color = 'white';
        successElement.style.fontSize = '2rem';
        successElement.style.background = 'rgba(0, 0, 0, 0.7)';
        successElement.style.padding = '2rem';
        successElement.style.borderRadius = '10px';
        successElement.style.textAlign = 'center';
        successElement.innerHTML = `
            <h2>Congratulations!</h2>
            <p>You have found your way through the labyrinth!</p>
            <button id="continue-btn">Continue</button>
        `;
        
        this.container.appendChild(successElement);
        
        // Add event listener to button
        document.getElementById('continue-btn').addEventListener('click', () => {
            // Remove success element
            successElement.remove();
            
            // Generate a new level with increased difficulty
            this.generateNewLevel();
        });
    }

    generateNewLevel() {
        // Reset player movement
        this.canMove = true;
        
        // Increase maze size and complexity
        this.labyrinthData.mazeParams.size = Math.min(this.labyrinthData.mazeParams.size + 2, 30);
        this.labyrinthData.mazeParams.complexity = Math.min(this.labyrinthData.mazeParams.complexity + 0.1, 0.8);
        
        // Clear old maze
        if (this.maze) {
            this.scene.remove(this.maze);
            this.maze = null;
        }
        
        // Generate new maze
        this.generateMaze();
    }

    cleanup() {
        // Stop the animation loop
        this.isRunning = false;
        
        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        document.removeEventListener('keydown', this.onKeyDown.bind(this));
        document.removeEventListener('keyup', this.onKeyUp.bind(this));
        
        // Clean up mobile controls if they exist
        if (this.mobileControls) {
            this.mobileControls.cleanup();
        }
        
        // Clean up audio
        if (this.audioManager) {
            this.audioManager.stop();
        }
        
        // Clean up three.js resources
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    if (object.geometry) {
                        object.geometry.dispose();
                    }
                    
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                }
            });
        }
        
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
        
        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.maze = null;
        this.player = null;
        this.playerCollider = null;
    }
}

export default new LabyrinthEngine();

