const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("scoreDisplay");
const bestScoreDisplay = document.getElementById("bestScoreDisplay");
const restartBtn = document.getElementById("restartBtn");

const GAME_WIDTH = 900;
const GAME_HEIGHT = 400;
const GROUND_HEIGHT = 90;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

function resizeCanvas() {
    const scale = Math.min(
        window.innerWidth / GAME_WIDTH,
        window.innerHeight / (GAME_HEIGHT + 160)
    );
    const clamped = Math.max(Math.min(scale, 1), 0.45);
    canvas.style.width = `${GAME_WIDTH * clamped}px`;
    canvas.style.height = `${GAME_HEIGHT * clamped}px`;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const gravity = 0.85;
const jumpForce = 17;
const groundY = GAME_HEIGHT - GROUND_HEIGHT;

const player = {
    x: 100,
    y: groundY - 40,
    width: 40,
    height: 40,
    velocityY: 0,
    grounded: true,
    jump() {
        if (this.grounded) {
            this.velocityY = -jumpForce;
            this.grounded = false;
        }
    },
    reset() {
        this.x = 100;
        this.y = groundY - this.height;
        this.velocityY = 0;
        this.grounded = true;
    }
};

let obstacles = [];
let groundOffset = 0;
let spawnTimer = 0;
let spawnInterval = 1400;
let lastTime = 0;
let running = true;
let score = 0;
let bestScore = parseFloat(localStorage.getItem("squareRunnerBest") || "0");
let gameSpeed = 6;
let speedRamp = 0.00025;

bestScoreDisplay.textContent = `Best: ${Math.floor(bestScore)}`;

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const v0x = cx - ax;
    const v0y = cy - ay;
    const v1x = bx - ax;
    const v1y = by - ay;
    const v2x = px - ax;
    const v2y = py - ay;

    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;

    const denom = dot00 * dot11 - dot01 * dot01;
    if (denom === 0) return false;

    const invDenom = 1 / denom;
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return u >= 0 && v >= 0 && u + v <= 1;
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function createObstacle() {
    const typeRoll = Math.random();
    let obstacle;

    if (typeRoll < 0.45) {
        obstacle = {
            type: "spike",
            x: GAME_WIDTH + 40,
            width: 48,
            height: randomRange(60, 80),
            update(delta) {
                this.x -= gameSpeed * delta;
            },
            draw() {
                ctx.fillStyle = "#f87171";
                ctx.beginPath();
                ctx.moveTo(this.x, groundY);
                ctx.lineTo(this.x + this.width / 2, groundY - this.height);
                ctx.lineTo(this.x + this.width, groundY);
                ctx.closePath();
                ctx.fill();
            }
        };
    } else if (typeRoll < 0.85) {
        const height = randomRange(50, 110);
        obstacle = {
            type: "block",
            x: GAME_WIDTH + 40,
            y: groundY - height,
            width: randomRange(45, 65),
            height,
            update(delta) {
                this.x -= gameSpeed * delta;
            },
            draw() {
                const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
                gradient.addColorStop(0, "#38bdf8");
                gradient.addColorStop(1, "#1d4ed8");
                ctx.fillStyle = gradient;
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        };
    } else {
        const height = randomRange(40, 90);
        const amplitude = randomRange(18, 32);
        const baseY = groundY - height - randomRange(60, 120);
        const swing = randomRange(1.2, 1.8);
        obstacle = {
            type: "moving",
            x: GAME_WIDTH + 40,
            y: baseY,
            baseY,
            phase: Math.random() * Math.PI * 2,
            amplitude,
            frequency: swing,
            width: randomRange(45, 65),
            height,
            update(delta, time) {
                this.x -= gameSpeed * delta;
                this.y = this.baseY + Math.sin(time * 0.004 * this.frequency + this.phase) * this.amplitude;
            },
            draw() {
                ctx.fillStyle = "#facc15";
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        };
    }

    obstacles.push(obstacle);
}

function resetGame() {
    score = 0;
    gameSpeed = 6;
    spawnTimer = 0;
    spawnInterval = 1400;
    lastTime = 0;
    groundOffset = 0;
    obstacles = [];
    running = true;
    player.reset();
    restartBtn.classList.add("hidden");
    scoreDisplay.textContent = "Score: 0";
    const storedBest = localStorage.getItem("squareRunnerBest");
    if (storedBest !== null) {
        bestScore = parseFloat(storedBest) || 0;
    }
    bestScoreDisplay.textContent = `Best: ${Math.floor(bestScore)}`;
    requestAnimationFrame(gameLoop);
}

function endGame() {
    running = false;
    restartBtn.classList.remove("hidden");
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("squareRunnerBest", String(Math.floor(bestScore)));
    }
    bestScoreDisplay.textContent = `Best: ${Math.floor(bestScore)}`;
}

function handleJump(event) {
    if (!running) return;

    if (event.type === "keydown") {
        if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
            event.preventDefault();
            player.jump();
        }
    } else {
        if (event.target === restartBtn) return;
        if (event.type === "pointerdown" && typeof event.button === "number" && event.button !== 0) {
            return;
        }
        player.jump();
    }
}

document.addEventListener("keydown", handleJump);
window.addEventListener("pointerdown", handleJump, { passive: true });

restartBtn.addEventListener("click", resetGame);

function drawPlayer() {
    const gradient = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.height);
    gradient.addColorStop(0, "#22d3ee");
    gradient.addColorStop(1, "#0ea5e9");
    ctx.fillStyle = gradient;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 3;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
}

function updatePlayer(delta) {
    player.velocityY += gravity * delta;
    player.y += player.velocityY * delta;

    if (player.y + player.height >= groundY) {
        player.y = groundY - player.height;
        player.velocityY = 0;
        player.grounded = true;
    }
}

function updateGround(delta) {
    groundOffset = (groundOffset + gameSpeed * delta) % 60;
    ctx.fillStyle = "#0b1120";
    ctx.fillRect(0, groundY, GAME_WIDTH, GROUND_HEIGHT);

    ctx.fillStyle = "#111827";
    for (let x = -60 + groundOffset; x < GAME_WIDTH; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x + 40, groundY);
        ctx.lineTo(x + 20, groundY + 24);
        ctx.closePath();
        ctx.fill();
    }
}

function checkCollision(obstacle) {
    if (obstacle.type === "spike") {
        const baseLeft = { x: obstacle.x, y: groundY };
        const baseRight = { x: obstacle.x + obstacle.width, y: groundY };
        const tip = { x: obstacle.x + obstacle.width / 2, y: groundY - obstacle.height };

        const corners = [
            { x: player.x, y: player.y },
            { x: player.x + player.width, y: player.y },
            { x: player.x, y: player.y + player.height },
            { x: player.x + player.width, y: player.y + player.height }
        ];

        for (const corner of corners) {
            if (pointInTriangle(corner.x, corner.y, baseLeft.x, baseLeft.y, baseRight.x, baseRight.y, tip.x, tip.y)) {
                return true;
            }
        }

        // Bounding box overlap for additional safety
        const spikeTop = groundY - obstacle.height;
        const intersectsBox =
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < groundY &&
            player.y + player.height > spikeTop;

        return intersectsBox && player.y + player.height > spikeTop + (groundY - spikeTop) * 0.35;
    }

    const rectCollision =
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y;

    return rectCollision;
}

function updateObstacles(delta, time) {
    obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > -120);

    for (const obstacle of obstacles) {
        obstacle.update(delta, time);
        obstacle.draw();

        if (checkCollision(obstacle)) {
            endGame();
            break;
        }
    }
}

function drawBackground() {
    ctx.fillStyle = "#0e1726";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const stars = 18;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    for (let i = 0; i < stars; i++) {
        const x = (i * 53.7 + groundOffset * 0.3) % GAME_WIDTH;
        const y = 40 + (i * 29) % (groundY - 140);
        ctx.fillRect(x, y, 2, 2);
    }

    ctx.fillStyle = "rgba(33, 150, 243, 0.12)";
    for (let i = 0; i < 4; i++) {
        const parallaxX = (groundOffset * (0.2 + i * 0.08)) % GAME_WIDTH;
        ctx.fillRect(parallaxX - GAME_WIDTH, groundY - 120 - i * 30, GAME_WIDTH, 12);
        ctx.fillRect(parallaxX, groundY - 120 - i * 30, GAME_WIDTH, 12);
    }
}

function gameLoop(timestamp) {
    if (!running) return;
    if (!lastTime) lastTime = timestamp;
    const deltaMs = timestamp - lastTime;
    const deltaTime = deltaMs / (1000 / 60);
    lastTime = timestamp;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    drawBackground();

    updateGround(deltaTime);
    updatePlayer(deltaTime);
    drawPlayer();
    updateObstacles(deltaTime, timestamp);

    if (!running) {
        return;
    }

    spawnTimer += deltaMs;
    const minInterval = Math.max(550, 1200 - gameSpeed * 70);
    if (spawnTimer >= spawnInterval) {
        createObstacle();
        spawnTimer = 0;
        spawnInterval = randomRange(minInterval, minInterval + 500);
    }

    score += gameSpeed * deltaTime * 0.5;
    scoreDisplay.textContent = `Score: ${Math.floor(score)}`;

    if (score > bestScore) {
        bestScore = score;
        bestScoreDisplay.textContent = `Best: ${Math.floor(bestScore)}`;
    }

    gameSpeed += speedRamp * deltaMs;

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
