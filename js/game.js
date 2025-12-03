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
gameMusic.volume = masterVolume * 0.6; 

const sfx = {
    pickup: new Audio('musica/pickupstudent.wav'),
    crash: new Audio('musica/explosion.wav'), 
    lose:  new Audio('musica/gameover.mp3'),
    click: new Audio('musica/click.wav'),
    pause: new Audio('musica/pausa.wav') 
};

// --- 1.7. CARGA DE IMÁGENES ---
const logoImage = new Image();
logoImage.src = 'css/lclogo1.png';

// Función auxiliar para reproducir efectos
function playSfx(soundName) {
    if (isMusicOn && sfx[soundName]) {
        sfx[soundName].currentTime = 0; 
        sfx[soundName].volume = masterVolume;    
        sfx[soundName].play().catch(e => console.error("Error SFX:", e));
    }
}

// Función para ajustar volumen global
function adjustVolume(amount) {
    masterVolume += amount;
    if (masterVolume > 1.0) masterVolume = 1.0;
    if (masterVolume < 0.0) masterVolume = 0.0;
    
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

// BOTONES DE VOLUMEN
const volumeDownButton = { x: canvas.width/2 - 150, y: 210, width: 60, height: 40, text: '-' };
const volumeUpButton   = { x: canvas.width/2 + 90, y: 210, width: 60, height: 40, text: '+' };

// Reasignación de teclas
const rebindButtons = {
    pause:  { x: canvas.width/2 - 150, y: 270, width: 300, height: 40, action: 'pause', text: 'Pausa' },
    escape: { x: canvas.width/2 - 150, y: 320, width: 300, height: 40, action: 'escape', text: 'Escape' },
    up:     { x: canvas.width/2 - 150, y: 370, width: 300, height: 40, action: 'up', text: 'Arriba' },
    down:   { x: canvas.width/2 - 150, y: 420, width: 300, height: 40, action: 'down', text: 'Abajo' },
    left:   { x: canvas.width/2 - 150, y: 470, width: 300, height: 40, action: 'left', text: 'Izquierda' },
    right:  { x: canvas.width/2 - 150, y: 520, width: 300, height: 40, action: 'right', text: 'Derecha' }
};

const optionsBackButton = { x: canvas.width/2 - 100, y: 570, width: 200, height: 40, color: 'gray', text: 'Volver' };

const keys = {};
let lastHoveredButton = null; 

// --- 4. MANEJADORES DE EVENTOS (TECLADO Y MOUSE) ---
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
        
        if (isPointInRect(mouse, volumeDownButton)) {
            playSfx('click');
            adjustVolume(-0.1); 
        }
        if (isPointInRect(mouse, volumeUpButton)) {
            playSfx('click');
            adjustVolume(0.1); 
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

// --- 4.5. CONTROLES TÁCTILES (MÓVIL) ---

// Función para simular pulsación de tecla
function simulateKey(key, type) {
    if (type === 'down') {
        keys[key] = true;
    } else {
        keys[key] = false;
    }
}

// Configuración de los botones
const touchButtons = [
    { id: 'btnUp', key: 'ArrowUp' },
    { id: 'btnDown', key: 'ArrowDown' },
    { id: 'btnLeft', key: 'ArrowLeft' },
    { id: 'btnRight', key: 'ArrowRight' }
];

// Asignar eventos a las flechas (esperar a que cargue el DOM o ejecutar si el script está al final)
setTimeout(() => {
    touchButtons.forEach(btn => {
        const element = document.getElementById(btn.id);
        if (element) {
            // Eventos para celular (Touch)
            element.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Evita scroll o zoom
                simulateKey(btn.key, 'down');
            }, {passive: false});
            element.addEventListener('touchend', (e) => {
                e.preventDefault();
                simulateKey(btn.key, 'up');
            }, {passive: false});

            // Eventos para Mouse (PC)
            element.addEventListener('mousedown', () => simulateKey(btn.key, 'down'));
            element.addEventListener('mouseup', () => simulateKey(btn.key, 'up'));
            element.addEventListener('mouseleave', () => simulateKey(btn.key, 'up'));
        }
    });

    // Lógica para el botón de PAUSA
    const btnPause = document.getElementById('btnPause');
    if (btnPause) {
        const togglePause = (e) => {
            e.preventDefault();
            playSfx('pause');
            if (gameState === 'PLAYING') {
                gameState = 'PAUSED';
                manageMusic('PAUSED');
            } else if (gameState === 'PAUSED') {
                gameState = 'PLAYING';
                manageMusic('PLAYING');
            }
        };
        btnPause.addEventListener('touchstart', togglePause, {passive: false});
        btnPause.addEventListener('click', togglePause);
    }
}, 100); // Pequeño delay para asegurar que el HTML cargó

// --- 5. FUNCIONES DE LÓGICA ---
function manageMusic(newState) {
    if (!isMusicOn) {
        gameMusic.pause(); 
        return;
    }

    if (newState === 'PAUSED') {
        gameMusic.volume = masterVolume * 0.3; 
    } else if (newState === 'PLAYING') {
        gameMusic.volume = masterVolume * 0.6; 
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

                // --- DIFICULTAD PROGRESIVA ---
                amet.speed += 0.5; 
                if (amet.dx > 0) amet.dx = amet.speed;
                else amet.dx = -amet.speed;
                // -----------------------------

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
    // --- DIBUJAR LOGO ---
    if (logoImage.complete && logoImage.naturalWidth > 0) {
        const targetWidth = 500; 
        const aspectRatio = logoImage.naturalHeight / logoImage.naturalWidth;
        const targetHeight = targetWidth * aspectRatio;
        const xPos = (canvas.width - targetWidth) / 2;
        const yPos = 50; 
        ctx.drawImage(logoImage, xPos, yPos, targetWidth, targetHeight);
    } else {
        ctx.fillStyle = 'black';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('"El Loco Riggo"', canvas.width / 2, 150);
        ctx.font = '20px Arial';
        ctx.fillText('(Cargando logo...)', canvas.width / 2, 180);
    }

    // --- DIBUJAR BOTONES ---
    const buttonsStartY = canvas.height / 2 + 20; 

    // Botón Iniciar
    startButton.y = buttonsStartY; 
    ctx.fillStyle = startButton.color;
    ctx.fillRect(startButton.x, startButton.y, startButton.width, startButton.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText(startButton.text, canvas.width / 2, startButton.y + 35);

    // Botón Opciones
    optionsButton.y = buttonsStartY + 70;
    ctx.fillStyle = optionsButton.color;
    ctx.fillRect(optionsButton.x, optionsButton.y, optionsButton.width, optionsButton.height);
    ctx.fillStyle = 'white';
    ctx.fillText(optionsButton.text, canvas.width / 2, optionsButton.y + 35);

    // Botón Probar Audio
    testAudioButton.y = buttonsStartY + 140;
    ctx.fillStyle = testAudioButton.color;
    ctx.fillRect(testAudioButton.x, testAudioButton.y, testAudioButton.width, testAudioButton.height);
    ctx.fillStyle = 'white'; 
    ctx.fillText(testAudioButton.text, canvas.width / 2, testAudioButton.y + 35);
}

function drawOptionsMenu() {
    ctx.fillStyle = 'black';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Opciones', canvas.width / 2, 100);

    // Botón Música
    ctx.font = '20px Arial';
    const musicText = toggleMusicButton.text + (isMusicOn ? ': Activada' : ': Desactivada');
    const musicColor = isMusicOn ? 'green' : 'red';
    ctx.fillStyle = musicColor;
    ctx.fillRect(toggleMusicButton.x, toggleMusicButton.y, toggleMusicButton.width, toggleMusicButton.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(musicText, toggleMusicButton.x + 10, toggleMusicButton.y + 27);

    // Control de Volumen
    ctx.fillStyle = 'gray';
    ctx.fillRect(volumeDownButton.x, volumeDownButton.y, volumeDownButton.width, volumeDownButton.height);
    ctx.fillRect(volumeUpButton.x, volumeUpButton.y, volumeUpButton.width, volumeUpButton.height);
    
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '30px Arial';
    ctx.fillText('-', volumeDownButton.x + 30, volumeDownButton.y + 30);
    ctx.fillText('+', volumeUpButton.x + 30, volumeUpButton.y + 30);
    
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    const volPercent = Math.round(masterVolume * 100) + '%';
    ctx.fillText(`Volumen: ${volPercent}`, canvas.width / 2, volumeDownButton.y + 27);

    // Botones de Reasignación
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

    // Botón Volver
    ctx.fillStyle = optionsBackButton.color;
    ctx.fillRect(optionsBackButton.x, optionsBackButton.y, optionsBackButton.width, optionsBackButton.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(optionsBackButton.text, canvas.width / 2, optionsBackButton.y + 30);
}

function drawRoads() {
    const roadColor = '#555555';
    const curbColor = '#CCCCCC';
    const lineColor = '#FFD700';
    const curbSize = 4;

    function drawLane(rect, isVertical) {
        ctx.fillStyle = curbColor;
        ctx.fillRect(rect.x - curbSize, rect.y - curbSize, rect.width + curbSize*2, rect.height + curbSize*2);
        
        ctx.fillStyle = roadColor;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

        ctx.beginPath();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 20]); 
        
        if (!isVertical) {
            ctx.moveTo(rect.x, rect.y + rect.height / 2);
            ctx.lineTo(rect.x + rect.width, rect.y + rect.height / 2);
        } else {
            ctx.moveTo(rect.x + rect.width / 2, rect.y);
            ctx.lineTo(rect.x + rect.width / 2, rect.y + rect.height);
        }
        ctx.stroke();
        ctx.setLineDash([]); 
    }

    drawLane(horizontalRoad, false);
    drawLane(verticalRoad1, true);
    drawLane(verticalRoad2, true);
    
    ctx.fillStyle = roadColor;
    ctx.fillRect(verticalRoad1.x, horizontalRoad.y, verticalRoad1.width, horizontalRoad.height);
    ctx.fillRect(verticalRoad2.x, horizontalRoad.y, verticalRoad2.width, horizontalRoad.height);
}

function drawGameObjects() {
    drawRoads(); 
    drawSpriteStudent(student.x, student.y, student.width, student.height);
    drawSpriteHole(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    drawSpriteAmet(amet.x, amet.y, amet.width, amet.height);
    drawSpriteBus(player.x, player.y, player.width, player.height, player.direction);
    
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.shadowColor = "black";
    ctx.shadowBlur = 4;
    ctx.textAlign = 'left';
    ctx.fillText(`Estudiantes: ${score}`, 20, 40);
    ctx.shadowBlur = 0;
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
    ctx.fillStyle = '#2d8a2d'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#246b24'; 
    for(let i=0; i<canvas.width; i+=50) {
        for(let j=0; j<canvas.height; j+=50) {
            if ((i+j)%100 === 0) ctx.fillRect(i, j, 5, 5);
        }
    }

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
    
    // --- RESET DE DIFICULTAD ---
    amet.speed = 3; 
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

// --- 10. FUNCIONES DE ARTE (SPRITES) ---

function drawSpriteBus(x, y, w, h, dir) {
    ctx.save();
    
    // Sombra del autobús
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 5, y + 5, w, h);

    // Carrocería Amarilla
    ctx.fillStyle = '#FFD700'; 
    ctx.strokeStyle = '#DAA520'; 
    ctx.lineWidth = 2;
    
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    // Detalles según la dirección 
    ctx.fillStyle = '#87CEEB'; 
    
    if (dir === 'left' || dir === 'right') {
        const windowW = w / 4;
        const windowH = h - 6;
        ctx.fillRect(x + 5, y + 3, windowW, windowH);
        ctx.fillRect(x + 5 + windowW + 2, y + 3, windowW, windowH);
        ctx.fillRect(x + 5 + (windowW + 2)*2, y + 3, windowW, windowH);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 10, y + h, 10, 4); 
        ctx.fillRect(x + w - 20, y + h, 10, 4); 
        ctx.fillRect(x + 10, y - 4, 10, 4); 
        ctx.fillRect(x + w - 20, y - 4, 10, 4);

    } else { 
        ctx.fillRect(x + 3, y + 10, w - 6, h / 3);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(x - 4, y + 5, 4, 10);
        ctx.fillRect(x + w, y + 5, 4, 10);
        ctx.fillRect(x - 4, y + h - 15, 4, 10);
        ctx.fillRect(x + w, y + h - 15, 4, 10);
    }
    
    ctx.fillStyle = '#FFA500'; 
    ctx.fillRect(x + w/4, y + h/4, w/2, h/2);

    ctx.restore();
}

function drawSpriteStudent(x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#F1C27D'; 
    ctx.beginPath();
    ctx.arc(x + w/2, y + h/2 - 5, w/2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.fillRect(x, y + h/2, w, h/2);
    
    ctx.fillStyle = 'darkblue';
    ctx.fillRect(x + 2, y + h - 5, w/2 - 2, 5);
    ctx.fillRect(x + w/2 + 2, y + h - 5, w/2 - 2, 5);
    
    ctx.fillStyle = 'green';
    ctx.fillRect(x + w/4, y + h/2 + 2, w/2, h/2 - 2);
    ctx.restore();
}

function drawSpriteAmet(x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#1a1a1a'; 
    ctx.fillRect(x, y, w, h);
    
    const time = Date.now();
    if (Math.floor(time / 200) % 2 === 0) {
        ctx.fillStyle = 'red';
        ctx.fillRect(x + 2, y + 2, w/2 - 4, h/2);
        ctx.fillStyle = 'darkblue';
        ctx.fillRect(x + w/2 + 2, y + 2, w/2 - 4, h/2);
    } else {
        ctx.fillStyle = 'darkred';
        ctx.fillRect(x + 2, y + 2, w/2 - 4, h/2);
        ctx.fillStyle = 'blue';
        ctx.fillRect(x + w/2 + 2, y + 2, w/2 - 4, h/2);
    }
    
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.fillText('AMET', x + w/2 - 12, y + h - 2);
    ctx.restore();
}

function drawSpriteHole(x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#444'; 
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h/2, w/2, h/3, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.stroke();
    ctx.restore();
}
