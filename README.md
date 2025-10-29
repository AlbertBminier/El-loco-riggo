
"El Loco Riggo" constituye un prototipo de videojuego enmarcado en el género Arcade y Acción. El desarrollo del proyecto se ha realizado como un juego web, lo que implica su plena operatividad en cualquier navegador web moderno (e.g., Google Chrome, Firefox) compatible con HTML5 y JavaScript.
El prototipo actual funge como una base funcional que demuestra las mecánicas centrales del juego, la gestión de diversos estados (menús, pausa, juego) y la capacidad de configuración de controles por parte del usuario.2. Especificaciones Técnicas
Plataforma: Web (Navegador).
Tecnologías Base: HTML5 (específicamente la etiqueta <canvas>), CSS3 (para estilos básicos) y JavaScript ("Vanilla JS" o JavaScript puro, versión ES6+).
Arquitectura: El juego no emplea ningún motor o framework externo. Toda la lógica reside en el archivo game.js y se gestiona mediante:
Un bucle de juego principal (gameLoop) basado en requestAnimationFrame.
Una máquina de estados (gameState) para controlar las diferentes pantallas (Menú, Opciones, Jugando, Pausa, Game Over).
3. Concepto del Juego (Gameplay)
El jugador asume el control de un autobús (el player) con el objetivo principal de recoger estudiantes (representados como objetos verdes) para acumular puntos. El diseño del juego se enfoca en ofrecer un desafío que demande reacciones rápidas.

Condiciones de Derrota (Game Over):
Salida de la carretera: El jugador debe mantenerse dentro de las calles grises dibujadas. El contacto con el "césped" (fondo verde) resultará en la finalización de la partida.
Colisión con un obstáculo:
Baches: Colisión con uno de los baches estáticos (objetos rojos).
Patrulla: Colisión con el vehículo policial dinámico (objeto negro).
4. Características Implementadas
La siguiente es una lista de las funcionalidades actualmente programadas en el prototipo:🗺️ Entorno de Juego

Mapa Dibujado: El juego se desarrolla sobre un fondo verde que simula césped. Un mapa de carreteras (una calle horizontal y dos verticales) se dibuja dinámicamente utilizando el <canvas>.
Límites de Carretera: El jugador está constreñido a conducir exclusivamente sobre las carreteras. Salirse de ellas conduce a un "Game Over".
🎮 Entidades (Objetos en Pantalla)
Jugador (Autobús):
Inicia en el extremo izquierdo de la carretera horizontal.
Rota su forma (modifica width y height) para "apuntar" en la dirección del movimiento (vertical u horizontal).
Estudiantes (Coleccionables):
Aparece un estudiante a la vez.
Al ser recogido, reaparece en una nueva ubicación aleatoria dentro de una de las tres carreteras.
Baches (Obstáculos Estáticos):
El juego genera dos baches por partida.
Su tamaño es de 30x30 píxeles.
Aparecen en ubicaciones aleatorias dentro de las carreteras.
Patrulla (IA Simple):
Es un obstáculo dinámico.
Sigue una ruta predeterminada: patrulla la carretera horizontal principal de izquierda a derecha y viceversa, invirtiendo su dirección al alcanzar los bordes.
⚙️ Sistema y Menús
Máquina de Estados: El juego gestiona 5 estados:
MENU: La pantalla de inicio con botones.
PLAYING: El juego se encuentra activo.
PAUSED: El juego está en pausa. La música de pausa se activa (si está habilitada).
OPTIONS: El menú de configuración.
GAME_OVER: La pantalla de puntuación final con la opción de reiniciar.
Menú de Opciones:
Reasignación de Teclas (Keybinding): El jugador puede modificar las teclas asignadas para Arriba, Abajo, Izquierda, Derecha, Pausa y Escape.
Control de Música: Un botón permite activar o desactivar la música (isMusicOn).
Sistema de Audio:
Carga un archivo de audio (musica/inicio.mp3).
La música está programada para sonar únicamente cuando el juego se encuentra en estado PAUSED (y si isMusicOn es true).
Se incluye un botón "Probar Audio" en el menú principal para fines de depuración.
5. Estructura de Archivos Asumida

(Carpeta Principal del Proyecto)

├── index.html
├── style.css
│
├── js/
│   └── game.js
│
└── musica/
└── inicio.mp3

