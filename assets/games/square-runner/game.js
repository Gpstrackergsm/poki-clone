// Square Runner - simple dodging game
// The player controls a blue square and must avoid falling red obstacles.

const GAME_WIDTH = 500;
const GAME_HEIGHT = 500;
const PLAYER_SIZE = 30;
const PLAYER_SPEED = 260; // pixels per second
const OBSTACLE_SIZE = 30;
const INITIAL_SPAWN_INTERVAL = 1.1; // seconds
const MIN_SPAWN_INTERVAL = 0.45;
const INITIAL_OBSTACLE_SPEED = 180;

const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const obstaclesContainer = document.getElementById("obstacles");
const scoreDisplay = document.getElementById("score");
const restartBtn = document.getElementById("restartBtn");

let playerX = (GAME_WIDTH - PLAYER_SIZE) / 2;
let obstacles = [];
let keys = { left: false, right: false };
let pointerDirection = 0;
let gameRunning = false;
let lastTimestamp = 0;
let spawnTimer = 0;
let spawnInterval = INITIAL_SPAWN_INTERVAL;
let score = 0;
let scoreAccumulator = 0;

/**
 * Update the player's DOM element position.
 */
function renderPlayer() {
  player.style.transform = `translate(${playerX}px, 0)`;
}

/**
 * Spawn a new falling obstacle at a random horizontal position.
 */
function spawnObstacle() {
  const obstacleEl = document.createElement("div");
  obstacleEl.className = "obstacle";

  const x = Math.random() * (GAME_WIDTH - OBSTACLE_SIZE);
  const speedBoost = Math.min(score * 12, 220);
  const obstacleSpeed = INITIAL_OBSTACLE_SPEED + speedBoost;

  const obstacle = {
    x,
    y: -OBSTACLE_SIZE,
    speed: obstacleSpeed,
    element: obstacleEl,
  };

  obstacleEl.style.transform = `translate(${x}px, ${-OBSTACLE_SIZE}px)`;
  obstaclesContainer.appendChild(obstacleEl);
  obstacles.push(obstacle);
}

/**
 * Remove an obstacle from the DOM and the array.
 */
function removeObstacle(obstacle) {
  obstacles = obstacles.filter((item) => item !== obstacle);
  obstacle.element.remove();
}

/**
 * Check if the player and obstacle overlap.
 */
function checkCollision(obstacle) {
  const playerY = GAME_HEIGHT - 40 - PLAYER_SIZE; // matches CSS bottom offset
  const playerRect = {
    left: playerX,
    right: playerX + PLAYER_SIZE,
    top: playerY,
    bottom: playerY + PLAYER_SIZE,
  };

  const obstacleRect = {
    left: obstacle.x,
    right: obstacle.x + OBSTACLE_SIZE,
    top: obstacle.y,
    bottom: obstacle.y + OBSTACLE_SIZE,
  };

  return !(
    playerRect.right < obstacleRect.left ||
    playerRect.left > obstacleRect.right ||
    playerRect.bottom < obstacleRect.top ||
    playerRect.top > obstacleRect.bottom
  );
}

/**
 * End the game and show the restart button.
 */
function endGame() {
  gameRunning = false;
  restartBtn.hidden = false;
}

/**
 * Reset the game state to start a new run.
 */
function resetGame() {
  obstacles.forEach((obstacle) => obstacle.element.remove());
  obstacles = [];

  playerX = (GAME_WIDTH - PLAYER_SIZE) / 2;
  renderPlayer();

  score = 0;
  scoreAccumulator = 0;
  scoreDisplay.textContent = "Score: 0";

  spawnInterval = INITIAL_SPAWN_INTERVAL;
  spawnTimer = 0;
  lastTimestamp = performance.now();
  pointerDirection = 0;
  keys.left = false;
  keys.right = false;

  restartBtn.hidden = true;
  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

/**
 * Main game loop executed on each animation frame.
 * @param {DOMHighResTimeStamp} timestamp
 */
function gameLoop(timestamp) {
  if (!gameRunning) {
    return;
  }

  const delta = (timestamp - lastTimestamp) / 1000; // Convert to seconds
  lastTimestamp = timestamp;

  // Update player movement based on input
  let direction = 0;
  if (keys.left) direction -= 1;
  if (keys.right) direction += 1;
  if (pointerDirection !== 0) direction = pointerDirection;

  playerX += direction * PLAYER_SPEED * delta;
  playerX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, playerX));
  renderPlayer();

  // Spawn obstacles over time with increasing frequency
  spawnTimer += delta;
  const dynamicInterval = Math.max(
    MIN_SPAWN_INTERVAL,
    INITIAL_SPAWN_INTERVAL - score * 0.02
  );
  spawnInterval = dynamicInterval;

  if (spawnTimer >= spawnInterval) {
    spawnObstacle();
    spawnTimer = 0;
  }

  // Update obstacles position and detect collisions
  obstacles.slice().forEach((obstacle) => {
    obstacle.y += obstacle.speed * delta;
    obstacle.element.style.transform = `translate(${obstacle.x}px, ${obstacle.y}px)`;

    if (obstacle.y > GAME_HEIGHT) {
      removeObstacle(obstacle);
      return;
    }

    if (checkCollision(obstacle)) {
      endGame();
    }
  });

  // Update score once per second of survival
  scoreAccumulator += delta;
  if (scoreAccumulator >= 1) {
    score += Math.floor(scoreAccumulator);
    scoreAccumulator -= Math.floor(scoreAccumulator);
    scoreDisplay.textContent = `Score: ${score}`;
  }

  if (gameRunning) {
    requestAnimationFrame(gameLoop);
  }
}

// Keyboard input
window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "Left") {
    keys.left = true;
  } else if (event.key === "ArrowRight" || event.key === "Right") {
    keys.right = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key === "Left") {
    keys.left = false;
  } else if (event.key === "ArrowRight" || event.key === "Right") {
    keys.right = false;
  }
});

// Touch controls for mobile devices
function handleTouch(event) {
  event.preventDefault();
  const touch = event.touches[0] || event.changedTouches[0];
  if (!touch) {
    return;
  }

  const rect = gameArea.getBoundingClientRect();
  const touchX = touch.clientX;
  const midpoint = rect.left + rect.width / 2;

  pointerDirection = touchX < midpoint ? -1 : 1;
}

function stopTouch() {
  pointerDirection = 0;
}

gameArea.addEventListener("touchstart", handleTouch, { passive: false });
gameArea.addEventListener("touchmove", handleTouch, { passive: false });
gameArea.addEventListener("touchend", stopTouch);
gameArea.addEventListener("touchcancel", stopTouch);

// Restart button handler
restartBtn.addEventListener("click", () => {
  resetGame();
});

// Start the game when the script loads
resetGame();
