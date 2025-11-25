const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 1. MANEJO DE ESTADOS Y VARIABLES GLOBALES ---
let gameState = 'MENU'; // 'MENU', 'OPTIONS', 'PLAYING', 'PAUSED', 'GAME_OVER'
let score = 0;
let isMusicOn = true; 
let masterVolume = 0.5; // Volumen general (0.0 a 1.0)

// --- 1.2. DEFINICIÓN DE CARRETERAS ---
const roadWidth = 80;
const horizontalRoad = {
    x: 0,
    y: canvas.height / 2 - roadWidth / 2,
    width: canvas.width,
    height: roadWidth
};
const verticalRoad1 = {
    x: canvas.width / 4 - roadWidth / 2,
    y: 0,
    width: roadWidth,
    height: canvas.height
};
const verticalRoad2 = {
    x: canvas.width * 3 / 4 - roadWidth / 2,
    y: 0,
    width: roadWidth,
    height: canvas.height
};

// --- 1.5. OBJETOS DE AUDIO Y EFECTOS ---
const gameMusic = new Audio('musica/inicio.mp3'); 
gameMusic.loop = true;
// La música de fondo suele ser más suave, así que usamos un % del volumen maestro
gameMusic.volume = masterVolume * 0.6; 

const sfx = {
    pickup: new Audio('musica/pickupstudent.wav'),
    crash: new Audio('musica/explosion.wav'), 
    lose:  new Audio('musica/gameover.mp3'),
    click: new Audio('musica/click.wav'),
    pause: new Audio('musica/pausa.wav') 
};

// Función auxiliar para reproducir efectos
function playSfx(soundName) {
    if (isMusicOn && sfx[soundName]) {
        sfx[soundName].currentTime = 0; 
        // Los efectos usan el volumen maestro completo
        sfx[soundName].volume = masterVolume;    
        sfx[soundName].play().catch(e => console.error("Error SFX:", e));
    }
}

// Función para ajustar volumen global
function adjustVolume(amount) {
    masterVolume += amount;
    // Limitar entre 0.0 y 1.0
    if (masterVolume > 1.0) masterVolume = 1.0;
    if (masterVolume < 0.0) masterVolume = 0.0;
    
    // Ajustar música en tiempo real si está sonando
    if (isMusicOn) {
        gameMusic.volume = masterVolume * 0.6;
    }
}

// --- 1.6. VARIABLES DE TECLAS ---
const keyBindings = {
    pause: 'p',
    escape: 'Escape',
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight'
};
let currentRebindingAction = null;

// --- 2. DEFINICIÓN DE OBJETOS ---
const player = { x: 100, y: 100, baseWidth: 50, baseHeight: 30, width: 50, height: 30, speed: 5, color: 'blue', direction: 'right' };
const student = { x: 400, y: 300, width: 20, height: 20, color: 'green' };
const obstacle = { x: 600, y: 400, width: 40, height: 40, color: 'red' };
const amet = { x: canvas.width / 2 - 25, y: 50, baseWidth: 50, baseHeight: 30, width: 50, height: 30, speed: 3, color: 'black', direction: 'right', dx: 3, dy: 3 };

// --- 3. DEFINICIÓN DE BOTONES ---
const startButton = { x: canvas.width / 2 - 100, y: canvas.height / 2, width: 200, height: 50, color: 'green', text: 'Iniciar Juego' };
const optionsButton = { x: canvas.width / 2 - 100, y: canvas.height / 2 + 70, width: 200, height: 50, color: 'gray', text: 'Opciones' };
const testAudioButton = { x: canvas.width / 2 - 100, y: canvas.height / 2 + 140, width: 200, height: 50, color: 'orange', text: 'Probar Audio' };

// Botones de Opciones
const toggleMusicButton = { x: canvas.width/2 - 150, y: 150, width: 300, height: 40, action: 'toggleMusic', text: 'Música' };

// NUEVOS BOTONES DE VOLUMEN (Debajo de Música)
const volumeDownButton = { x: canvas.width/2 - 150, y: 210, width: 60, height: 40, text: '-' };
const volumeUpButton   = { x: canvas.width/2 + 90, y: 210, width: 60, height: 40, text: '+' };

// Reasignación de teclas (Movidas más abajo para hacer espacio)
const rebindButtons = {
    pause:  { x: canvas.width/2 - 150, y: 270, width: 300, height: 40, action: 'pause', text: 'Pausa' },
    escape: { x: canvas.width/2 - 150, y: 320, width: 300, height: 40, action: 'escape', text: 'Escape' },
    up:     { x: canvas.width/2 - 150, y: 370, width: 300, height: 40, action: 'up', text: 'Arriba' },
    down:   { x: canvas.width/2 - 150, y: 420, width: 300, height: 40, action: 'down', text: 'Abajo' },
    left:   { x: canvas.width/2 - 150, y: 470, width: 300, height: 40, action: 'left', text: 'Izquierda' },
    right:  { x: canvas.width/2 - 150, y: 520, width: 300, height: 40, action: 'right', text: 'Derecha' }
};

// Botón volver (ajustado un poco más abajo)
const optionsBackButton = { x: canvas.width/2 - 100, y: 570, width: 200, height: 40, color: 'gray', text: 'Volver' };

const keys = {};
let lastHoveredButton = null; 

// --- 4. MANEJADORES DE EVENTOS ---
window.addEventListener('keydown', (e) => {
    
    if (currentRebindingAction) {
        keyBindings[currentRebindingAction] = e.key; 
        currentRebindingAction = null; 
        playSfx('click'); 
        return; 
    }

    if (e.key === keyBindings.pause) {
        playSfx('pause'); 

        if (gameState === 'PLAYING') {
            gameState = 'PAUSED';
            manageMusic('PAUSED'); 
        } else if (gameState === 'PAUSED') {
            gameState = 'PLAYING';
            manageMusic('PLAYING'); 
        }
    }

    if (e.key === keyBindings.escape) {
        if (gameState === 'PLAYING' || gameState === 'PAUSED') {
            gameState = 'MENU';
            manageMusic('MENU'); 
        } else if (gameState === 'OPTIONS') { 
            gameState = 'MENU';
            manageMusic('MENU'); 
        }
    }
    
    if (e.key === 'Enter' && gameState === 'GAME_OVER') {
        playSfx('click');
        gameState = 'PLAYING';
        manageMusic('PLAYING'); 
        resetGame();
    }
    
    keys[e.key] = true;

    if ([keyBindings.up, keyBindings.down, keyBindings.left, keyBindings.right].includes(e.key)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('click', (e) => {
    if (currentRebindingAction) return;

    const rect = canvas.getBoundingClientRect();
    const mouse = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };

    if (gameState === 'MENU') {
        if (isPointInRect(mouse, startButton)) {
            playSfx('click'); 
            gameState = 'PLAYING';
            manageMusic('PLAYING'); 
            resetGame();
        }
        if (isPointInRect(mouse, optionsButton)) {
            playSfx('click'); 
            gameState = 'OPTIONS'; 
            manageMusic('OPTIONS'); 
        }
        
        if (isPointInRect(mouse, testAudioButton)) {
            playSfx('click'); 
            console.log('Probando audio...');
            gameMusic.currentTime = 0;
            gameMusic.play().catch(e => {
                console.error("¡Error al reproducir audio!", e);
                alert("Error al reproducir audio. Revisa la consola (F12).");
            });
        }
    
    } else if (gameState === 'OPTIONS') {
        if (isPointInRect(mouse, optionsBackButton)) {
            playSfx('click'); 
            gameState = 'MENU';
            manageMusic('MENU'); 
        }

        if (isPointInRect(mouse, toggleMusicButton)) {
            playSfx('click'); 
            isMusicOn = !isMusicOn; 
            if (!isMusicOn) {
                manageMusic(gameState); 
            } else {
                gameMusic.play();
            }
        }
        
        // --- LÓGICA DE VOLUMEN ---
        if (isPointInRect(mouse, volumeDownButton)) {
            playSfx('click');
            adjustVolume(-0.1); // Bajar 10%
        }
        if (isPointInRect(mouse, volumeUpButton)) {
            playSfx('click');
            adjustVolume(0.1); // Subir 10%
        }

        for (const button of Object.values(rebindButtons)) {
            if (isPointInRect(mouse, button)) {
                playSfx('click'); 
                currentRebindingAction = button.action; 
            }
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouse = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };

    let currentHoveredButton = null;
    let activeButtons = [];

    if (gameState === 'MENU') {
        activeButtons = [startButton, optionsButton, testAudioButton];
    } else if (gameState === 'OPTIONS') {
        // Agregamos los nuevos botones de volumen a la lista de "hover"
        activeButtons = [
            optionsBackButton, 
            toggleMusicButton, 
            volumeDownButton, 
            volumeUpButton, 
            ...Object.values(rebindButtons)
        ];
    }

    for (let btn of activeButtons) {
        if (isPointInRect(mouse, btn)) {
            currentHoveredButton = btn;
            break; 
        }
    }

    if (currentHoveredButton && currentHoveredButton !== lastHoveredButton) {
        playSfx('click'); 
        canvas.style.cursor = 'pointer'; 
    } else if (!currentHoveredButton) {
        canvas.style.cursor = 'default'; 
    }

    lastHoveredButton = currentHoveredButton;
});

// --- 5. FUNCIONES DE LÓGICA ---
function manageMusic(newState) {
    if (!isMusicOn) {
        gameMusic.pause(); 
        return;
    }

    if (newState === 'PAUSED') {
        gameMusic.volume = masterVolume * 0.3; // Más bajo en pausa
    } else if (newState === 'PLAYING') {
        gameMusic.volume = masterVolume * 0.6; // Volumen normal
        gameMusic.play().catch(e => console.error("Error música:", e));
    } else if (newState === 'GAME_OVER') {
        gameMusic.pause();
        gameMusic.currentTime = 0;
        playSfx('lose'); 
    } else {
        gameMusic.pause(); 
    }
}

function updateMovement() {
    if (keys[keyBindings.up]) {
        player.direction = 'up';
        player.width = player.baseHeight;
        player.height = player.baseWidth;
        if (player.y > 0) {
            player.y -= player.speed;
        }
    } else if (keys[keyBindings.down]) {
        player.direction = 'down';
        player.width = player.baseHeight;
        player.height = player.baseWidth;
        if (player.y < canvas.height - player.height) {
            player.y += player.speed;
        }
    } else if (keys[keyBindings.left]) {
        player.direction = 'left';
        player.width = player.baseWidth;
        player.height = player.baseHeight;
        if (player.x > 0) {
            player.x -= player.speed;
        }
    } else if (keys[keyBindings.right]) {
        player.direction = 'right';
        player.width = player.baseWidth;
        player.height = player.baseHeight;
        if (player.x < canvas.width - player.width) {
            player.x += player.speed;
        }
    }
}

function updateAmetMovement() {
    amet.x += amet.dx;

    amet.width = amet.baseWidth;
    amet.height = amet.baseHeight;
    
    if (amet.x + amet.width > canvas.width) {
        amet.x = canvas.width - amet.width; 
        amet.dx = -amet.speed; 
        amet.direction = 'left';
    } 
    else if (amet.x < 0) {
        amet.x = 0; 
        amet.dx = amet.speed; 
        amet.direction = 'right';
    }
}


function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function isPointInRect(point, rect) {
    return (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
    );
}

function isPlayerOnRoad() {
    const isOnHorizontal = checkCollision(player, horizontalRoad);
    const isOnVertical1 = checkCollision(player, verticalRoad1);
    const isOnVertical2 = checkCollision(player, verticalRoad2);

    return isOnHorizontal || isOnVertical1 || isOnVertical2;
}

function getValidSpawnPoint(objectWidth, objectHeight) {
    let roadChoice = Math.floor(Math.random() * 3);
    let spawnRect;
    
    if (roadChoice === 0) spawnRect = horizontalRoad;
    else if (roadChoice === 1) spawnRect = verticalRoad1;
    else spawnRect = verticalRoad2;

    let x = spawnRect.x + Math.random() * (spawnRect.width - objectWidth);
    let y = spawnRect.y + Math.random() * (spawnRect.height - objectHeight);
    
    x = Math.max(spawnRect.x, x);
    y = Math.max(spawnRect.y, y);
    
    return { x, y };
}

// --- 6. FUNCIONES PRINCIPALES (UPDATE Y DRAW) ---
function update() {
    switch(gameState) {
        case 'PLAYING':
            updateMovement();
            updateAmetMovement(); 

            if (!isPlayerOnRoad()) {
                playSfx('crash'); 
                gameState = 'GAME_OVER';
                manageMusic('GAME_OVER');
                return; 
            }

            if (checkCollision(player, student)) {
                score++;
                playSfx('pickup'); 
                const newStudentPos = getValidSpawnPoint(student.width, student.height);
                student.x = newStudentPos.x;
                student.y = newStudentPos.y;
            }

            if (checkCollision(player, obstacle) || checkCollision(player, amet)) {
                playSfx('crash'); 
                gameState = 'GAME_OVER';
                manageMusic('GAME_OVER'); 
            }
            break;
        case 'MENU':
        case 'PAUSED':
        case 'OPTIONS': 
        case 'GAME_OVER':
            break;
    }
}

// --- Funciones de Dibujo ---
function drawMainMenu() {
    ctx.fillStyle = 'black';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('"El Loco Riggo"', canvas.width / 2, 100); 

    ctx.fillStyle = startButton.color;
    ctx.fillRect(startButton.x, startButton.y, startButton.width, startButton.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText(startButton.text, canvas.width / 2, startButton.y + 35);

    ctx.fillStyle = optionsButton.color;
    ctx.fillRect(optionsButton.x, optionsButton.y, optionsButton.width, optionsButton.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText(optionsButton.text, canvas.width / 2, optionsButton.y + 35);

    ctx.fillStyle = testAudioButton.color;
    ctx.fillRect(testAudioButton.x, testAudioButton.y, testAudioButton.width, testAudioButton.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial'; 
    ctx.fillText(testAudioButton.text, canvas.width / 2, testAudioButton.y + 35);
}

function drawOptionsMenu() {
    ctx.fillStyle = 'black';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Opciones', canvas.width / 2, 100);

    // -- Botón Música --
    ctx.font = '20px Arial';
    const musicText = toggleMusicButton.text + (isMusicOn ? ': Activada' : ': Desactivada');
    const musicColor = isMusicOn ? 'green' : 'red';
    ctx.fillStyle = musicColor;
    ctx.fillRect(toggleMusicButton.x, toggleMusicButton.y, toggleMusicButton.width, toggleMusicButton.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(musicText, toggleMusicButton.x + 10, toggleMusicButton.y + 27);

    // -- NUEVO: Control de Volumen --
    ctx.fillStyle = 'gray';
    // Botón Menos [-]
    ctx.fillRect(volumeDownButton.x, volumeDownButton.y, volumeDownButton.width, volumeDownButton.height);
    // Botón Más [+]
    ctx.fillRect(volumeUpButton.x, volumeUpButton.y, volumeUpButton.width, volumeUpButton.height);
    
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '30px Arial';
    ctx.fillText('-', volumeDownButton.x + 30, volumeDownButton.y + 30);
    ctx.fillText('+', volumeUpButton.x + 30, volumeUpButton.y + 30);
    
    // Texto del % en el medio
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    const volPercent = Math.round(masterVolume * 100) + '%';
    ctx.fillText(`Volumen: ${volPercent}`, canvas.width / 2, volumeDownButton.y + 27);


    // -- Botones de Reasignación --
    for (const button of Object.values(rebindButtons)) {
        ctx.fillStyle = 'gray';
        ctx.fillRect(button.x, button.y, button.width, button.height);
        
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText(button.text, button.x + 10, button.y + 27);

        ctx.textAlign = 'right';
        let keyText = `[ ${keyBindings[button.action]} ]`;
        
        if (currentRebindingAction === button.action) {
            keyText = "[ PRESIONA UNA TECLA... ]";
            ctx.fillStyle = 'yellow'; 
        }

        ctx.fillText(keyText, button.x + button.width - 10, button.y + 27);
    }

    // -- Botón Volver --
    ctx.fillStyle = optionsBackButton.color;
    ctx.fillRect(optionsBackButton.x, optionsBackButton.y, optionsBackButton.width, optionsBackButton.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(optionsBackButton.text, canvas.width / 2, optionsBackButton.y + 30);
}

function drawRoads() {
    const laneWidth = 10;
    const dashLength = 20;
    const gapLength = 20;
    
    ctx.fillStyle = '#333'; 
    ctx.fillRect(horizontalRoad.x, horizontalRoad.y, horizontalRoad.width, horizontalRoad.height);
    ctx.fillRect(verticalRoad1.x, verticalRoad1.y, verticalRoad1.width, verticalRoad1.height);
    ctx.fillRect(verticalRoad2.x, verticalRoad2.y, verticalRoad2.width, verticalRoad2.height);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = laneWidth;
    ctx.setLineDash([dashLength, gapLength]);

    ctx.beginPath();
    ctx.moveTo(horizontalRoad.x, horizontalRoad.y + horizontalRoad.height / 2);
    ctx.lineTo(horizontalRoad.x + horizontalRoad.width, horizontalRoad.y + horizontalRoad.height / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(verticalRoad1.x + verticalRoad1.width / 2, verticalRoad1.y);
    ctx.lineTo(verticalRoad1.x + verticalRoad1.width / 2, verticalRoad1.y + verticalRoad1.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(verticalRoad2.x + verticalRoad2.width / 2, verticalRoad2.y);
    ctx.lineTo(verticalRoad2.x + verticalRoad2.width / 2, verticalRoad2.y + verticalRoad2.height);
    ctx.stroke();

    ctx.setLineDash([]); 
}

function drawGameObjects() {
    drawRoads();

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = student.color;
    ctx.fillRect(student.x, student.y, student.width, student.height);
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.fillStyle = amet.color;
    ctx.fillRect(amet.x, amet.y, amet.width, amet.height);
    
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Estudiantes: ${score}`, 10, 30);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'black';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('¡JUEGO TERMINADO!', canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '30px Arial';
    ctx.fillText(`Puntuación Final: ${score}`, canvas.width / 2, canvas.height / 2); 
    ctx.font = '20px Arial';
    ctx.fillText('Presiona "Enter" para reiniciar', canvas.width / 2, canvas.height / 2 + 40); 
}

function drawPauseMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSA', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText(`Presiona "${keyBindings.pause}" para continuar`, canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText(`Presiona "${keyBindings.escape}" para volver al menú`, canvas.width / 2, canvas.height / 2 + 80);
}

function draw() {
    ctx.fillStyle = '#228B22'; // Forest Green
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'PLAYING' || gameState === 'PAUSED') {
        drawGameObjects();
    }

    switch(gameState) {
        case 'MENU':
            drawMainMenu();
            break;
        case 'OPTIONS': 
            drawOptionsMenu();
            break;
        case 'PAUSED':
            drawPauseMenu();
            break;
        case 'GAME_OVER':
            drawGameOverScreen();
            break;
        case 'PLAYING':
            break;
    }
}

// --- 7. INICIO DEL JUEGO ---
function resetGame() {
    score = 0;
    
    player.x = 10; 
    player.y = horizontalRoad.y + (horizontalRoad.height / 2) - (player.baseHeight / 2);
    player.direction = 'right';
    player.width = player.baseWidth;
    player.height = player.baseHeight;

    const studentPos = getValidSpawnPoint(student.width, student.height);
    student.x = studentPos.x;
    student.y = studentPos.y;

    const obstaclePos = getValidSpawnPoint(obstacle.width, obstacle.height);
    obstacle.x = obstaclePos.x;
    obstacle.y = obstaclePos.y;
    
    amet.x = canvas.width / 2 - 25;
    amet.y = horizontalRoad.y + (horizontalRoad.height / 2) - (amet.baseHeight / 2);
    amet.dx = amet.speed; 
    amet.dy = 0; 
    amet.direction = 'right';
    amet.width = amet.baseWidth;
    amet.height = amet.baseHeight;
}

// --- 8. GAME LOOP ---
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- 9. INICIO DEL JUEGO ---
gameLoop();
