let scene, camera, renderer, player, ground;
let playerModel; // Add reference to the actual model
let obstacles = [];
let score = 0;
let gameSpeed = 0.2;
let isGameOver = false;
let isJumping = false;
let playerVelocity = 0;
const GRAVITY = 0.015;
const JUMP_FORCE = 0.5;
const GROUND_Y = 0;
const COLLISION_PADDING = 0.3; // Add padding for more forgiving collisions

function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87CEEB); // Sky blue
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Camera position
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 2, 0);

    createPlayer();
    createGround();
    createEnvironment();

    // Event listeners
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onWindowResize);

    animate();
}

function createPlayer() {
    // Create a temporary box as placeholder while model loads
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    player = new THREE.Group(); // Changed to Group to hold the model
    const placeholder = new THREE.Mesh(geometry, material);
    placeholder.visible = false;
    player.add(placeholder);
    player.position.y = GROUND_Y + 1;
    scene.add(player);

    // Load the T-Rex model
    const loader = new THREE.GLTFLoader();
    loader.load('base.glb', (gltf) => {
        playerModel = gltf.scene;
        
        // Apply materials
        playerModel.traverse((child) => {
            if (child.isMesh) {
                // Create new materials
                const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5a27 }); // Dark green
                const accentMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown
                
                // Apply materials based on mesh name or position
                // You might need to adjust this based on your model's structure
                if (child.name.toLowerCase().includes('accent') || 
                    child.name.toLowerCase().includes('belly') ||
                    child.name.toLowerCase().includes('limb')) {
                    child.material = accentMaterial;
                } else {
                    child.material = bodyMaterial;
                }
            }
        });

        // Scale and position the model appropriately
        playerModel.scale.set(0.8, 0.8, 0.8); // Increased from 0.5 to 0.8
        playerModel.rotation.y = Math.PI / 2; // Face right
        
        // Add the model to the player group
        player.add(playerModel);
        placeholder.visible = false;
    }, undefined, (error) => {
        console.error('Error loading model:', error);
    });
}

function createGround() {
    const geometry = new THREE.PlaneGeometry(1000, 100);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x90EE90,
        side: THREE.DoubleSide 
    });
    ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = GROUND_Y;
    scene.add(ground);
}

function createEnvironment() {
    // Add clouds
    for (let i = 0; i < 20; i++) {
        const cloud = createCloud();
        cloud.position.set(
            Math.random() * 100 - 50,
            10 + Math.random() * 5,
            Math.random() * 40 - 20
        );
        scene.add(cloud);
    }

    // Add trees
    for (let i = 0; i < 30; i++) {
        const tree = createTree();
        tree.position.set(
            Math.random() * 100 - 50,
            GROUND_Y,
            Math.random() * 40 - 20
        );
        scene.add(tree);
    }
}

function createCloud() {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(1, 8, 8);
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    
    for (let i = 0; i < 3; i++) {
        const cloud = new THREE.Mesh(geometry, material);
        cloud.position.x = i * 0.8;
        cloud.position.y = Math.random() * 0.2;
        cloud.scale.set(1 + Math.random() * 0.2, 1 + Math.random() * 0.2, 1);
        group.add(cloud);
    }
    return group;
}

function createTree() {
    const group = new THREE.Group();
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    group.add(trunk);
    
    // Leaves
    const leavesGeometry = new THREE.ConeGeometry(1, 2, 8);
    const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 2.5;
    group.add(leaves);
    
    return group;
}

function createObstacle() {
    const types = ['rock', 'log', 'fence'];
    const type = types[Math.floor(Math.random() * types.length)];
    let obstacle;

    switch(type) {
        case 'rock':
            const rockGeometry = new THREE.DodecahedronGeometry(0.7); 
            const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
            obstacle = new THREE.Mesh(rockGeometry, rockMaterial);
            break;
        case 'log':
            const logGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 8); 
            const logMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
            obstacle = new THREE.Mesh(logGeometry, logMaterial);
            obstacle.rotation.z = Math.PI / 2;
            break;
        case 'fence':
            const fenceGeometry = new THREE.BoxGeometry(1.8, 1.3, 0.2); 
            const fenceMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
            obstacle = new THREE.Mesh(fenceGeometry, fenceMaterial);
            break;
    }

    obstacle.position.set(30, GROUND_Y + obstacle.geometry.parameters.height / 2, 0);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function onKeyDown(event) {
    if ((event.code === 'Space' || event.key === 'ArrowUp') && !isJumping && !isGameOver) {
        isJumping = true;
        playerVelocity = JUMP_FORCE;
    }
}

function updatePlayer() {
    if (isJumping) {
        player.position.y += playerVelocity;
        playerVelocity -= GRAVITY;

        if (player.position.y <= GROUND_Y + 1) {
            player.position.y = GROUND_Y + 1;
            isJumping = false;
            playerVelocity = 0;
        }

        // Add some animation to the model while jumping
        if (playerModel) {
            playerModel.rotation.x = -playerVelocity * 0.5; // Tilt based on velocity
        }
    } else if (playerModel) {
        // Reset rotation when on ground
        playerModel.rotation.x = Math.sin(Date.now() * 0.01) * 0.1; // Slight idle animation
    }
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].position.x -= gameSpeed;

        const playerBox = new THREE.Box3().setFromObject(player);
        const obstacleBox = new THREE.Box3().setFromObject(obstacles[i]);
        
        playerBox.min.x += COLLISION_PADDING;
        playerBox.min.z += COLLISION_PADDING;
        playerBox.max.x -= COLLISION_PADDING;
        playerBox.max.z -= COLLISION_PADDING;
        
        obstacleBox.min.x += COLLISION_PADDING;
        obstacleBox.min.z += COLLISION_PADDING;
        obstacleBox.max.x -= COLLISION_PADDING;
        obstacleBox.max.z -= COLLISION_PADDING;

        if (playerBox.intersectsBox(obstacleBox)) {
            if (player.position.y < obstacles[i].position.y + 1.5) {
                gameOver();
            }
        }

        if (obstacles[i].position.x < -30) {
            scene.remove(obstacles[i]);
            obstacles.splice(i, 1);
        }
    }

    // Increase spawn rate from 0.01 to 0.025 for more frequent obstacles
    if (Math.random() < 0.025) { 
        createObstacle();
    }
}

function updateScore() {
    score++;
    document.getElementById('score').textContent = `Score: ${score}`;
    
    gameSpeed = 0.2 + (score / 5000);
}

function gameOver() {
    isGameOver = true;
    document.getElementById('gameOver').style.display = 'block';
}

function restartGame() {
    score = 0;
    gameSpeed = 0.2;
    isGameOver = false;
    player.position.y = GROUND_Y + 1;
    isJumping = false;
    playerVelocity = 0;
    
    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles = [];
    
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('gameOver').style.display = 'none';
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (!isGameOver) {
        updatePlayer();
        updateObstacles();
        updateScore();
    }

    renderer.render(scene, camera);
}

init();
