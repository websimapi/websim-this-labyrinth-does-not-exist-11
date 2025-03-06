import * as THREE from 'three';

class BiomeGenerator {
    constructor(scene, labyrinthData) {
        this.scene = scene;
        this.labyrinthData = labyrinthData;
        this.biomeType = labyrinthData.biomeType;
        this.biomeEffects = [];
        this.wallTexture = null;
        this.floorTexture = null;
        this.textureLoader = new THREE.TextureLoader();
    }

    async loadTextures(wallTextureUrl, floorTextureUrl) {
        try {
            // Load wall texture
            this.wallTexture = await new Promise((resolve, reject) => {
                this.textureLoader.load(
                    wallTextureUrl,
                    texture => {
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.set(1, 1);
                        resolve(texture);
                    },
                    undefined,
                    reject
                );
            });

            // Load floor texture
            this.floorTexture = await new Promise((resolve, reject) => {
                this.textureLoader.load(
                    floorTextureUrl,
                    texture => {
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.set(10, 10);
                        resolve(texture);
                    },
                    undefined,
                    reject
                );
            });

            return { wallTexture: this.wallTexture, floorTexture: this.floorTexture };
        } catch (error) {
            console.error('Error loading textures:', error);
            
            // Create fallback textures if loading fails
            this.createFallbackTextures();
            return { wallTexture: this.wallTexture, floorTexture: this.floorTexture };
        }
    }

    createFallbackTextures() {
        // Create a fallback wall texture
        const wallCanvas = document.createElement('canvas');
        wallCanvas.width = 128;
        wallCanvas.height = 128;
        const wallCtx = wallCanvas.getContext('2d');
        
        // Fill based on biome
        const wallColors = this.getBiomeWallColors();
        wallCtx.fillStyle = wallColors.base;
        wallCtx.fillRect(0, 0, 128, 128);
        
        // Add some texture details
        wallCtx.fillStyle = wallColors.detail;
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const size = Math.random() * 8 + 2;
            wallCtx.fillRect(x, y, size, size);
        }
        
        this.wallTexture = new THREE.CanvasTexture(wallCanvas);
        this.wallTexture.wrapS = THREE.RepeatWrapping;
        this.wallTexture.wrapT = THREE.RepeatWrapping;
        
        // Create a fallback floor texture
        const floorCanvas = document.createElement('canvas');
        floorCanvas.width = 128;
        floorCanvas.height = 128;
        const floorCtx = floorCanvas.getContext('2d');
        
        // Fill based on biome
        const floorColors = this.getBiomeFloorColors();
        floorCtx.fillStyle = floorColors.base;
        floorCtx.fillRect(0, 0, 128, 128);
        
        // Add some texture details
        floorCtx.fillStyle = floorColors.detail;
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const size = Math.random() * 4 + 1;
            floorCtx.fillRect(x, y, size, size);
        }
        
        this.floorTexture = new THREE.CanvasTexture(floorCanvas);
        this.floorTexture.wrapS = THREE.RepeatWrapping;
        this.floorTexture.wrapT = THREE.RepeatWrapping;
        this.floorTexture.repeat.set(10, 10);
    }

    getBiomeWallColors() {
        switch (this.biomeType) {
            case 'forest':
                return { base: '#2D4F1E', detail: '#1A2E0F' };
            case 'desert':
                return { base: '#D2B48C', detail: '#A67F53' };
            case 'ice':
                return { base: '#A5F2F3', detail: '#7FC9E6' };
            case 'volcanic':
                return { base: '#3D1C12', detail: '#6B271A' };
            case 'crystal':
                return { base: '#5F9EA0', detail: '#4682B4' };
            case 'underwater':
                return { base: '#0D4F8B', detail: '#063361' };
            case 'space':
                return { base: '#0C0E1A', detail: '#1E1E42' };
            case 'ancient':
                return { base: '#8B7355', detail: '#6B5640' };
            default:
                return { base: '#555555', detail: '#333333' };
        }
    }

    getBiomeFloorColors() {
        switch (this.biomeType) {
            case 'forest':
                return { base: '#4F7942', detail: '#3A5A30' };
            case 'desert':
                return { base: '#E8C17D', detail: '#C7A76C' };
            case 'ice':
                return { base: '#E0FFFF', detail: '#B0E0E6' };
            case 'volcanic':
                return { base: '#3F3F3F', detail: '#8B0000' };
            case 'crystal':
                return { base: '#B0C4DE', detail: '#4682B4' };
            case 'underwater':
                return { base: '#00688B', detail: '#104E8B' };
            case 'space':
                return { base: '#000000', detail: '#191970' };
            case 'ancient':
                return { base: '#8B7355', detail: '#6B5640' };
            default:
                return { base: '#888888', detail: '#666666' };
        }
    }

    addBiomeElements(maze, wallPositions, mazeSize) {
        // Clear previous effects
        this.biomeEffects = [];
        
        // Add skybox
        this.addSkybox();
        
        // Add biome-specific decorative elements
        switch (this.biomeType) {
            case 'forest':
                this.addForestElements(maze, wallPositions, mazeSize);
                break;
            case 'desert':
                this.addDesertElements(maze, wallPositions, mazeSize);
                break;
            case 'ice':
                this.addIceElements(maze, wallPositions, mazeSize);
                break;
            case 'volcanic':
                this.addVolcanicElements(maze, wallPositions, mazeSize);
                break;
            case 'crystal':
                this.addCrystalElements(maze, wallPositions, mazeSize);
                break;
            case 'underwater':
                this.addUnderwaterElements(maze, wallPositions, mazeSize);
                break;
            case 'space':
                this.addSpaceElements(maze, wallPositions, mazeSize);
                break;
            case 'ancient':
                this.addAncientElements(maze, wallPositions, mazeSize);
                break;
            default:
                // Default decorations for any other biome
                this.addDefaultElements(maze, wallPositions, mazeSize);
        }
    }

    addSkybox() {
        // Create a skybox based on the biome
        let skyboxTexture;
        
        // Create a canvas for the skybox
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Fill based on biome
        let gradient;
        
        switch (this.biomeType) {
            case 'forest':
                gradient = ctx.createLinearGradient(0, 0, 0, 1024);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.5, '#B0E2FF');
                gradient.addColorStop(1, '#98FB98');
                break;
            case 'desert':
                gradient = ctx.createLinearGradient(0, 0, 0, 1024);
                gradient.addColorStop(0, '#FFDEAD');
                gradient.addColorStop(0.5, '#FFA07A');
                gradient.addColorStop(1, '#D2B48C');
                break;
            case 'ice':
                gradient = ctx.createLinearGradient(0, 0, 0, 1024);
                gradient.addColorStop(0, '#B0E0E6');
                gradient.addColorStop(0.5, '#ADD8E6');
                gradient.addColorStop(1, '#F0F8FF');
                break;
            case 'volcanic':
                gradient = ctx.createLinearGradient(0, 0, 0, 1024);
                gradient.addColorStop(0, '#8B0000');
                gradient.addColorStop(0.5, '#CD5C5C');
                gradient.addColorStop(1, '#A52A2A');
                break;
            case 'crystal':
                gradient = ctx.createLinearGradient(0, 0, 0, 1024);
                gradient.addColorStop(0, '#E6E6FA');
                gradient.addColorStop(0.5, '#B0C4DE');
                gradient.addColorStop(1, '#87CEFA');
                break;
            case 'underwater':
                gradient = ctx.createLinearGradient(0, 0, 0, 1024);
                gradient.addColorStop(0, '#00008B');
                gradient.addColorStop(0.5, '#0000CD');
                gradient.addColorStop(1, '#4169E1');
                break;
            case 'space':
                gradient = ctx.createLinearGradient(0, 0, 0, 1024);
                gradient.addColorStop(0, '#000000');
                gradient.addColorStop(0.5, '#191970');
                gradient.addColorStop(1, '#483D8B');
                break;
            case 'ancient':
                gradient = ctx.createLinearGradient(0, 0, 0, 1024);
                gradient.addColorStop(0, '#8B4513');
                gradient.addColorStop(0.5, '#A0522D');
                gradient.addColorStop(1, '#D2691E');
                break;
            default:
                gradient = ctx.createLinearGradient(0, 0, 0, 1024);
                gradient.addColorStop(0, '#4682B4');
                gradient.addColorStop(1, '#B0C4DE');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1024, 1024);
        
        // Add details based on biome
        if (this.biomeType === 'space') {
            // Add stars
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 200; i++) {
                const x = Math.random() * 1024;
                const y = Math.random() * 1024;
                const size = Math.random() * 2 + 1;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.biomeType === 'forest' || this.biomeType === 'desert') {
            // Add clouds
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            for (let i = 0; i < 10; i++) {
                const x = Math.random() * 1024;
                const y = Math.random() * 300;
                const width = Math.random() * 200 + 100;
                const height = Math.random() * 60 + 30;
                ctx.beginPath();
                ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Create texture from canvas
        skyboxTexture = new THREE.CanvasTexture(canvas);
        
        // Create a simple skybox
        const skyboxGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyboxMaterial = new THREE.MeshBasicMaterial({
            map: skyboxTexture,
            side: THREE.BackSide
        });
        
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        this.scene.add(skybox);
    }

    addForestElements(maze, wallPositions, mazeSize) {
        // Add trees
        const treeCount = Math.floor(mazeSize / 2);
        const availablePositions = this.getAvailablePositions(wallPositions, mazeSize);
        
        for (let i = 0; i < treeCount && i < availablePositions.length; i++) {
            const position = availablePositions[i];
            
            // Create tree trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 3, 8);
            const trunkMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8B4513, 
                roughness: 0.8 
            });
            
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(position.x, 1.5, position.z);
            trunk.castShadow = true;
            maze.add(trunk);
            
            // Create tree foliage
            const foliageGeometry = new THREE.ConeGeometry(1, 2, 8);
            const foliageMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x2E8B57, 
                roughness: 0.7 
            });
            
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.set(position.x, 3, position.z);
            foliage.castShadow = true;
            maze.add(foliage);
        }
        
        // Add grass tufts
        const grassCount = mazeSize * 2;
        const grassGeometry = new THREE.PlaneGeometry(0.5, 0.5);
        const grassMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x7CFC00,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < grassCount; i++) {
            if (i >= availablePositions.length) break;
            
            const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
            
            const grass = new THREE.Mesh(grassGeometry, grassMaterial);
            grass.position.set(
                position.x + (Math.random() - 0.5), 
                0.25, 
                position.z + (Math.random() - 0.5)
            );
            grass.rotation.x = Math.PI / 2;
            grass.rotation.z = Math.random() * Math.PI;
            maze.add(grass);
            
            // Add to effects for animation
            this.biomeEffects.push({
                object: grass,
                type: 'sway',
                originalPosition: grass.position.clone(),
                originalRotation: grass.rotation.z,
                speed: Math.random() * 0.5 + 0.5
            });
        }
    }

    addDesertElements(maze, wallPositions, mazeSize) {
        // Add cacti
        const cactusCount = Math.floor(mazeSize / 3);
        const availablePositions = this.getAvailablePositions(wallPositions, mazeSize);
        
        for (let i = 0; i < cactusCount && i < availablePositions.length; i++) {
            const position = availablePositions[i];
            
            // Create cactus
            const cactusGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
            const cactusMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x2E8B57, 
                roughness: 0.7 
            });
            
            const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
            cactus.position.set(position.x, 1, position.z);
            cactus.castShadow = true;
            maze.add(cactus);
            
            // Add arms to some cacti
            if (Math.random() > 0.5) {
                const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
                const arm = new THREE.Mesh(armGeometry, cactusMaterial);
                arm.position.set(0, 0.3, 0);
                arm.rotation.z = Math.PI / 2;
                arm.position.x += 0.7;
                cactus.add(arm);
            }
        }
        
        // Add sand dunes
        const duneCount = Math.floor(mazeSize / 4);
        const duneGeometry = new THREE.SphereGeometry(1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const duneMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xDEB887, 
            roughness: 0.9 
        });
        
        for (let i = 0; i < duneCount; i++) {
            if (i >= availablePositions.length) break;
            
            const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
            
            const dune = new THREE.Mesh(duneGeometry, duneMaterial);
            dune.position.set(
                position.x, 
                -0.1, 
                position.z
            );
            dune.scale.set(
                Math.random() + 0.5, 
                Math.random() * 0.3 + 0.2, 
                Math.random() + 0.5
            );
            dune.rotation.y = Math.random() * Math.PI * 2;
            maze.add(dune);
        }
        
        // Add heat mirage effect
        this.addHeatMirage(maze, mazeSize);
    }

    addHeatMirage(maze, mazeSize) {
        // Create a plane with a wavy material for the heat mirage effect
        const mirageGeometry = new THREE.PlaneGeometry(mazeSize * 2, mazeSize * 2, 32, 32);
        const mirageMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        
        const mirage = new THREE.Mesh(mirageGeometry, mirageMaterial);
        mirage.rotation.x = -Math.PI / 2;
        mirage.position.y = 0.1;
        maze.add(mirage);
        
        // Add to effects for animation
        this.biomeEffects.push({
            object: mirage,
            type: 'mirage',
            vertices: mirageGeometry.attributes.position.array.slice(),
            phase: 0
        });
    }

    addIceElements(maze, wallPositions, mazeSize) {
        // Add ice crystals
        const crystalCount = Math.floor(mazeSize / 2);
        const availablePositions = this.getAvailablePositions(wallPositions, mazeSize);
        
        for (let i = 0; i < crystalCount && i < availablePositions.length; i++) {
            const position = availablePositions[i];
            
            // Create ice crystal
            const crystalGeometry = new THREE.ConeGeometry(0.5, 1.5, 6);
            const crystalMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xADD8E6, 
                transparent: true,
                opacity: 0.7,
                roughness: 0.2,
                metalness: 0.8
            });
            
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            crystal.position.set(position.x, 0.75, position.z);
            crystal.rotation.x = Math.PI;
            crystal.castShadow = true;
            maze.add(crystal);
            
            // Add to effects for animation
            this.biomeEffects.push({
                object: crystal,
                type: 'glow',
                originalIntensity: 0.7,
                phase: Math.random() * Math.PI * 2
            });
        }
        
        // Add snow piles
        const snowPileCount = Math.floor(mazeSize / 3);
        const snowGeometry = new THREE.SphereGeometry(0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const snowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF, 
            roughness: 0.9 
        });
        
        for (let i = 0; i < snowPileCount; i++) {
            if (i >= availablePositions.length) break;
            
            const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
            
            const snowPile = new THREE.Mesh(snowGeometry, snowMaterial);
            snowPile.position.set(
                position.x, 
                0, 
                position.z
            );
            snowPile.scale.set(
                Math.random() + 0.8, 
                Math.random() * 0.5 + 0.2, 
                Math.random() + 0.8
            );
            maze.add(snowPile);
        }
        
        // Add falling snow particles
        this.addSnowParticles(maze, mazeSize);
    }

    addSnowParticles(maze, mazeSize) {
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * mazeSize * 2;
            positions[i3 + 1] = Math.random() * 10;
            positions[i3 + 2] = (Math.random() - 0.5) * mazeSize * 2;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.1,
            transparent: true,
            opacity: 0.7
        });
        
        const snow = new THREE.Points(geometry, material);
        maze.add(snow);
        
        // Add to effects for animation
        this.biomeEffects.push({
            object: snow,
            type: 'snow',
            originalPositions: positions.slice(),
            mazeSize: mazeSize * 2
        });
    }

    addVolcanicElements(maze, wallPositions, mazeSize) {
        // Add lava pools
        const poolCount = Math.floor(mazeSize / 4);
        const availablePositions = this.getAvailablePositions(wallPositions, mazeSize);
        
        for (let i = 0; i < poolCount && i < availablePositions.length; i++) {
            const position = availablePositions[i];
            
            // Create lava pool
            const poolGeometry = new THREE.CircleGeometry(0.7, 16);
            const poolMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xFF4500, 
                emissive: 0xFF4500,
                emissiveIntensity: 0.5,
                roughness: 0.7
            });
            
            const pool = new THREE.Mesh(poolGeometry, poolMaterial);
            pool.position.set(position.x, 0.01, position.z);
            pool.rotation.x = -Math.PI / 2;
            maze.add(pool);
            
            // Add to effects for animation
            this.biomeEffects.push({
                object: pool,
                type: 'glow',
                originalIntensity: 0.5,
                phase: Math.random() * Math.PI * 2
            });
        }
        
        // Add volcanic rocks
        const rockCount = Math.floor(mazeSize / 3);
        
        for (let i = 0; i < rockCount; i++) {
            if (i >= availablePositions.length) break;
            
            const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
            
            // Create rock
            const rockGeometry = new THREE.DodecahedronGeometry(0.5, 0);
            const rockMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x3F3F3F, 
                roughness: 0.9 
            });
            
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                position.x + (Math.random() - 0.5), 
                0.25, 
                position.z + (Math.random() - 0.5)
            );
            rock.rotation.set(
                Math.random() * Math.PI, 
                Math.random() * Math.PI, 
                Math.random() * Math.PI
            );
            rock.scale.set(
                Math.random() * 0.5 + 0.3,
                Math.random() * 0.5 + 0.3,
                Math.random() * 0.5 + 0.3
            );
            maze.add(rock);
        }
        
        // Add ember particles
        this.addEmberParticles(maze, mazeSize);
    }

    addEmberParticles(maze, mazeSize) {
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * mazeSize * 2;
            positions[i3 + 1] = Math.random() * 5;
            positions[i3 + 2] = (Math.random() - 0.5) * mazeSize * 2;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xFF4500,
            size: 0.1,
            transparent: true,
            opacity: 0.7
        });
        
        const embers = new THREE.Points(geometry, material);
        maze.add(embers);
        
        // Add to effects for animation
        this.biomeEffects.push({
            object: embers,
            type: 'embers',
            originalPositions: positions.slice(),
            mazeSize: mazeSize * 2
        });
    }

    addCrystalElements(maze, wallPositions, mazeSize) {
        // Add crystal formations
        const crystalCount = Math.floor(mazeSize / 2);
        const availablePositions = this.getAvailablePositions(wallPositions, mazeSize);
        
        for (let i = 0; i < crystalCount && i < availablePositions.length; i++) {
            const position = availablePositions[i];
            
            // Create crystal formation
            const crystalGroup = new THREE.Group();
            crystalGroup.position.set(position.x, 0, position.z);
            
            // Create multiple crystals in the formation
            const crystalCount = Math.floor(Math.random() * 3) + 2;
            
            for (let j = 0; j < crystalCount; j++) {
                const crystalGeometry = new THREE.ConeGeometry(
                    Math.random() * 0.2 + 0.1, 
                    Math.random() * 1.5 + 0.5, 
                    6
                );
                
                // Random crystal color
                const colors = [0x9966CC, 0x4169E1, 0x40E0D0, 0x98FB98];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                const crystalMaterial = new THREE.MeshStandardMaterial({ 
                    color: color, 
                    transparent: true,
                    opacity: 0.8,
                    roughness: 0.2,
                    metalness: 0.8
                });
                
                const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
                crystal.position.set(
                    (Math.random() - 0.5) * 0.5,
                    Math.random() * 0.5 + 0.25,
                    (Math.random() - 0.5) * 0.5
                );
                
                crystal.rotation.set(
                    Math.random() * 0.3,
                    Math.random() * Math.PI * 2,
                    Math.random() * 0.3
                );
                
                crystal.castShadow = true;
                crystalGroup.add(crystal);
                
                // Add to effects for animation
                this.biomeEffects.push({
                    object: crystal,
                    type: 'crystalGlow',
                    originalColor: color,
                    phase: Math.random() * Math.PI * 2
                });
            }
            
            maze.add(crystalGroup);
        }
        
        // Add point lights to some crystal formations
        const lightCount = Math.floor(mazeSize / 5);
        
        for (let i = 0; i < lightCount; i++) {
            if (i >= availablePositions.length) break;
            
            const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
            
            // Create point light
            const colors = [0x9966CC, 0x4169E1, 0x40E0D0, 0x98FB98];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const light = new THREE.PointLight(color, 1, 5);
            light.position.set(position.x, 1, position.z);
            maze.add(light);
            
            // Add to effects for animation
            this.biomeEffects.push({
                object: light,
                type: 'pulseLight',
                originalIntensity: 1,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    addUnderwaterElements(maze, wallPositions, mazeSize) {
        // Add seaweed
        const seaweedCount = Math.floor(mazeSize / 2);
        const availablePositions = this.getAvailablePositions(wallPositions, mazeSize);
        
        for (let i = 0; i < seaweedCount && i < availablePositions.length; i++) {
            const position = availablePositions[i];
            
            // Create seaweed
            const seaweedGroup = new THREE.Group();
            seaweedGroup.position.set(position.x, 0, position.z);
            
            // Create multiple strands in the formation
            const strandCount = Math.floor(Math.random() * 4) + 1;
            
            for (let j = 0; j < strandCount; j++) {
                const height = Math.random() * 1.5 + 1;
                const segments = Math.floor(height * 2);
                
                const strandGroup = new THREE.Group();
                strandGroup.position.set(
                    (Math.random() - 0.5) * 0.5,
                    0,
                    (Math.random() - 0.5) * 0.5
                );
                
                // Create segments for the seaweed strand
                for (let k = 0; k < segments; k++) {
                    const segmentGeometry = new THREE.BoxGeometry(0.1, height / segments, 0.05);
                    const segmentMaterial = new THREE.MeshStandardMaterial({ 
                        color: 0x2E8B57, 
                        roughness: 0.7 
                    });
                    
                    const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
                    segment.position.y = (k + 0.5) * (height / segments);
                    strandGroup.add(segment);
                }
                
                seaweedGroup.add(strandGroup);
                
                // Add to effects for animation
                this.biomeEffects.push({
                    object: strandGroup,
                    type: 'sway',
                    originalRotation: 0,
                    speed: Math.random() * 0.5 + 0.5
                });
            }
            
            maze.add(seaweedGroup);
        }
        
        // Add coral
        const coralCount = Math.floor(mazeSize / 3);
        
        for (let i = 0; i < coralCount; i++) {
            if (i >= availablePositions.length) break;
            
            const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
            
            // Create coral
            const colors = [0xFF6EB4, 0xFF7F50, 0xFFB347, 0xFF69B4];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const coralGeometry = new THREE.DodecahedronGeometry(0.4, 1);
            const coralMaterial = new THREE.MeshStandardMaterial({ 
                color: color, 
                roughness: 0.7 
            });
            
            const coral = new THREE.Mesh(coralGeometry, coralMaterial);
            coral.position.set(
                position.x, 
                0.2, 
                position.z
            );
            coral.scale.set(
                Math.random() * 0.5 + 0.7,
                Math.random() * 0.5 + 0.7,
                Math.random() * 0.5 + 0.7
            );
            coral.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            maze.add(coral);
        }
        
        // Add bubble particles
        this.addBubbleParticles(maze, mazeSize);
    }

    addBubbleParticles(maze, mazeSize) {
        const particleCount = 50;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * mazeSize * 2;
            positions[i3 + 1] = Math.random() * 3;
            positions[i3 + 2] = (Math.random() - 0.5) * mazeSize * 2;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.1,
            transparent: true,
            opacity: 0.5
        });
        
        const bubbles = new THREE.Points(geometry, material);
        maze.add(bubbles);
        
        // Add to effects for animation
        this.biomeEffects.push({
            object: bubbles,
            type: 'bubbles',
            originalPositions: positions.slice(),
            mazeSize: mazeSize * 2
        });
    }

    addSpaceElements(maze, wallPositions, mazeSize) {
        // Add space debris
        const debrisCount = Math.floor(mazeSize / 3);
        const availablePositions = this.getAvailablePositions(wallPositions, mazeSize);
        
        for (let i = 0; i < debrisCount && i < availablePositions.length; i++) {
            const position = availablePositions[i];
            
            // Create space debris
            const debrisGeometry = new THREE.TetrahedronGeometry(Math.random() * 0.3 + 0.2, 0);
            const debrisMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x888888, 
                roughness: 0.7,
                metalness: 0.5
            });
            
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            debris.position.set(
                position.x + (Math.random() - 0.5), 
                Math.random() * 2, 
                position.z + (Math.random() - 0.5)
            );
            debris.rotation.set(
                Math.random() * Math.PI, 
                Math.random() * Math.PI, 
                Math.random() * Math.PI
            );
            maze.add(debris);
            
            // Add to effects for animation
            this.biomeEffects.push({
                object: debris,
                type: 'float',
                originalPosition: debris.position.clone(),
                speed: Math.random() * 0.3 + 0.1
            });
        }
        
        // Add stars in the background
        const starCount = 500;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const radius = 200 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            const i3 = i * 3;
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
        }
        
        const starsGeometry = new THREE.BufferGeometry();
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
        
        // Add to effects for animation
        this.biomeEffects.push({
            object: stars,
            type: 'twinkle',
            opacity: 0.8
        });
        
        // Add space nebula
        this.addSpaceNebula(maze, mazeSize);
    }

    addSpaceNebula(maze, mazeSize) {
        // Create a nebula-like effect with a particle system
        const nebulaColors = [0x6600FF, 0x4169E1, 0x8A2BE2, 0x9400D3];
        const color = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
        
        const particleCount = 1000;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const radius = 100 + Math.random() * 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            const i3 = i * 3;
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
        }
        
        const nebulaGeometry = new THREE.BufferGeometry();
        nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const nebulaMaterial = new THREE.PointsMaterial({
            color: color,
            size: 3,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
        this.scene.add(nebula);
        
        // Add to effects for animation
        this.biomeEffects.push({
            object: nebula,
            type: 'rotate',
            speed: 0.0005
        });
    }

    addAncientElements(maze, wallPositions, mazeSize) {
        // Add pillars
        const pillarCount = Math.floor(mazeSize / 4);
        const availablePositions = this.getAvailablePositions(wallPositions, mazeSize);
        
        for (let i = 0; i < pillarCount && i < availablePositions.length; i++) {
            const position = availablePositions[i];
            
            // Create pillar
            const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
            const pillarMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xD2B48C, 
                roughness: 0.9 
            });
            
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(position.x, 1.5, position.z);
            pillar.castShadow = true;
            maze.add(pillar);
            
            // Add decorative capital to the pillar
            const capitalGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
            const capital = new THREE.Mesh(capitalGeometry, pillarMaterial);
            capital.position.y = 1.5;
            pillar.add(capital);
        }
        
        // Add statues
        const statueCount = Math.floor(mazeSize / 6);
        
        for (let i = 0; i < statueCount; i++) {
            if (i >= availablePositions.length) break;
            
            const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
            
            // Create statue base
            const baseGeometry = new THREE.BoxGeometry(1, 0.3, 1);
            const baseMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8B7355, 
                roughness: 0.8 
            });
            
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.set(position.x, 0.15, position.z);
            maze.add(base);
            
            // Create statue figure (simplified)
            const figureGeometry = new THREE.ConeGeometry(0.3, 1.5, 8);
            const figureMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xD2B48C, 
                roughness: 0.8 
            });
            
            const figure = new THREE.Mesh(figureGeometry, figureMaterial);
            figure.position.set(position.x, 1.05, position.z);
            maze.add(figure);
        }
        
        // Add ancient runes
        this.addAncientRunes(maze, wallPositions, mazeSize);
    }

    addAncientRunes(maze, wallPositions, mazeSize) {
        // Add glowing runes to some walls
        const runeCount = Math.floor(mazeSize / 3);
        
        for (let i = 0; i < runeCount && i < wallPositions.length; i++) {
            const wallPos = wallPositions[Math.floor(Math.random() * wallPositions.length)];
            
            // Create a rune on a random side of the wall
            const side = Math.floor(Math.random() * 4);
            let runeX = wallPos.x;
            let runeZ = wallPos.z;
            let runeRotY = 0;
            
            switch (side) {
                case 0: // North
                    runeZ -= 1;
                    runeRotY = 0;
                    break;
                case 1: // East
                    runeX += 1;
                    runeRotY = Math.PI / 2;
                    break;
                case 2: // South
                    runeZ += 1;
                    runeRotY = Math.PI;
                    break;
                case 3: // West
                    runeX -= 1;
                    runeRotY = -Math.PI / 2;
                    break;
            }
            
            // Create rune
            const runeGeometry = new THREE.PlaneGeometry(0.5, 0.5);
            const runeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xFFD700,
                emissive: 0xFFD700,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            rune.position.set(runeX, 1.5, runeZ);
            rune.rotation.y = runeRotY;
            maze.add(rune);
            
            // Add to effects for animation
            this.biomeEffects.push({
                object: rune,
                type: 'glow',
                originalIntensity: 0.5,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    addDefaultElements(maze, wallPositions, mazeSize) {
        // Add generic decorative elements
        const elementCount = Math.floor(mazeSize / 3);
        const availablePositions = this.getAvailablePositions(wallPositions, mazeSize);
        
        for (let i = 0; i < elementCount && i < availablePositions.length; i++) {
            const position = availablePositions[i];
            
            // Create decorative element
            const elementGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const elementMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x888888, 
                roughness: 0.7 
            });
            
            const element = new THREE.Mesh(elementGeometry, elementMaterial);
            element.position.set(position.x, 0.3, position.z);
            maze.add(element);
        }
    }

    getAvailablePositions(wallPositions, mazeSize) {
        // Create a grid to track occupied positions
        const gridSize = mazeSize * 2;
        const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
        
        // Mark wall positions as occupied
        for (const wall of wallPositions) {
            const gridX = Math.floor(wall.x + mazeSize);
            const gridZ = Math.floor(wall.z + mazeSize);
            
            if (gridX >= 0 && gridX < gridSize && gridZ >= 0 && gridZ < gridSize) {
                grid[gridX][gridZ] = true;
            }
        }
        
        // Find available positions
        const availablePositions = [];
        
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                if (!grid[x][z]) {
                    availablePositions.push({
                        x: x - mazeSize + 0.5,
                        z: z - mazeSize + 0.5
                    });
                }
            }
        }
        
        // Shuffle available positions
        return this.shuffleArray(availablePositions);
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    updateEffects(delta) {
        for (const effect of this.biomeEffects) {
            switch (effect.type) {
                case 'sway':
                    // Swaying animation for plants
                    if (effect.object) {
                        const time = Date.now() * 0.001;
                        effect.object.rotation.z = effect.originalRotation + 
                            Math.sin(time * effect.speed) * 0.1;
                    }
                    break;
                    
                case 'glow':
                    // Glowing animation for lights/crystals
                    if (effect.object && effect.object.material) {
                        const time = Date.now() * 0.001;
                        effect.object.material.emissiveIntensity = 
                            effect.originalIntensity * (0.7 + Math.sin(time + effect.phase) * 0.3);
                    }
                    break;
                    
                case 'crystalGlow':
                    // Color changing animation for crystals
                    if (effect.object && effect.object.material) {
                        const time = Date.now() * 0.001;
                        const hue = (Math.sin(time * 0.2 + effect.phase) * 0.1) + 0.5;
                        effect.object.material.emissive = new THREE.Color().setHSL(hue, 0.8, 0.5);
                        effect.object.material.emissiveIntensity = 0.3 + Math.sin(time * 0.5 + effect.phase) * 0.2;
                    }
                    break;
                    
                case 'float':
                    // Floating animation for space debris
                    if (effect.object) {
                        const time = Date.now() * 0.001;
                        effect.object.position.y = effect.originalPosition.y + 
                            Math.sin(time * effect.speed) * 0.3;
                        effect.object.rotation.x += delta * 0.2;
                        effect.object.rotation.y += delta * 0.1;
                    }
                    break;
                    
                case 'twinkle':
                    // Twinkling animation for stars
                    if (effect.object && effect.object.material) {
                        const time = Date.now() * 0.001;
                        effect.object.material.opacity = 
                            effect.opacity * (0.7 + Math.sin(time * 0.5) * 0.3);
                    }
                    break;
                    
                case 'rotate':
                    // Rotation animation
                    if (effect.object) {
                        effect.object.rotation.y += effect.speed;
                    }
                    break;
                    
                case 'pulseLight':
                    // Pulsing animation for lights
                    if (effect.object) {
                        const time = Date.now() * 0.001;
                        effect.object.intensity = 
                            effect.originalIntensity * (0.7 + Math.sin(time + effect.phase) * 0.3);
                    }
                    break;
                    
                case 'snow':
                    // Falling snow animation
                    if (effect.object && effect.object.geometry) {
                        const positions = effect.object.geometry.attributes.position.array;
                        const time = Date.now() * 0.001;
                        
                        for (let i = 0; i < positions.length; i += 3) {
                            // Move downward
                            positions[i + 1] -= delta * (0.2 + Math.random() * 0.3);
                            
                            // Add slight sideways movement
                            positions[i] += Math.sin(time + i) * 0.01;
                            
                            // Reset if below ground
                            if (positions[i + 1] < 0) {
                                positions[i] = effect.originalPositions[i] + (Math.random() - 0.5) * 5;
                                positions[i + 1] = 10;
                                positions[i + 2] = effect.originalPositions[i + 2] + (Math.random() - 0.5) * 5;
                            }
                        }
                        
                        effect.object.geometry.attributes.position.needsUpdate = true;
                    }
                    break;
                    
                case 'embers':
                    // Rising ember particles animation
                    if (effect.object && effect.object.geometry) {
                        const positions = effect.object.geometry.attributes.position.array;
                        const time = Date.now() * 0.001;
                        
                        for (let i = 0; i < positions.length; i += 3) {
                            // Move upward
                            positions[i + 1] += delta * (0.3 + Math.random() * 0.2);
                            
                            // Add slight sideways movement
                            positions[i] += Math.sin(time + i) * 0.02;
                            positions[i + 2] += Math.cos(time + i) * 0.02;
                            
                            // Reset if above ceiling
                            if (positions[i + 1] > 5) {
                                positions[i] = effect.originalPositions[i] + (Math.random() - 0.5) * 5;
                                positions[i + 1] = 0;
                                positions[i + 2] = effect.originalPositions[i + 2] + (Math.random() - 0.5) * 5;
                            }
                        }
                        
                        effect.object.geometry.attributes.position.needsUpdate = true;
                    }
                    break;
                    
                case 'bubbles':
                    // Rising bubble particles animation
                    if (effect.object && effect.object.geometry) {
                        const positions = effect.object.geometry.attributes.position.array;
                        const time = Date.now() * 0.001;
                        
                        for (let i = 0; i < positions.length; i += 3) {
                            // Move upward with slight sideways movement
                            positions[i + 1] += delta * (0.2 + Math.random() * 0.1);
                            positions[i] += Math.sin(time + i) * 0.01;
                            positions[i + 2] += Math.cos(time + i) * 0.01;
                            
                            // Reset if above ceiling
                            if (positions[i + 1] > 3) {
                                positions[i] = effect.originalPositions[i] + (Math.random() - 0.5) * 5;
                                positions[i + 1] = 0;
                                positions[i + 2] = effect.originalPositions[i + 2] + (Math.random() - 0.5) * 5;
                            }
                        }
                        
                        effect.object.geometry.attributes.position.needsUpdate = true;
                    }
                    break;
                    
                case 'mirage':
                    // Heat mirage effect for desert
                    if (effect.object && effect.object.geometry) {
                        const positions = effect.object.geometry.attributes.position.array;
                        const originalPositions = effect.vertices;
                        const time = Date.now() * 0.001;
                        
                        effect.phase += delta * 0.5;
                        
                        for (let i = 0; i < positions.length; i += 3) {
                            // Only modify Y positions
                            const distance = Math.sqrt(
                                originalPositions[i] * originalPositions[i] + 
                                originalPositions[i + 2] * originalPositions[i + 2]
                            );
                            
                            positions[i + 1] = originalPositions[i + 1] + 
                                Math.sin(distance * 0.5 + time) * 0.1;
                        }
                        
                        effect.object.geometry.attributes.position.needsUpdate = true;
                    }
                    break;
            }
        }
    }

    createCelebrationEffect(position) {
        // Create particle burst at the end point
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;
            
            // Random colors
            colors[i3] = Math.random();
            colors[i3 + 1] = Math.random();
            colors[i3 + 2] = Math.random();
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.2,
            transparent: true,
            opacity: 1.0,
            vertexColors: true
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        // Add to effects for animation
        this.biomeEffects.push({
            object: particles,
            type: 'burst',
            time: 0,
            duration: 2,
            velocities: Array(particleCount).fill().map(() => ({
                x: (Math.random() - 0.5) * 5,
                y: (Math.random() - 0.5) * 5 + 2,
                z: (Math.random() - 0.5) * 5
            }))
        });
    }
}

export default BiomeGenerator;

