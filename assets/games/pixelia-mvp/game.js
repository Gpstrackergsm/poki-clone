(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const viewport = { width: canvas.width, height: canvas.height };
  const state = {
    map: null,
    player: null,
    npc: null,
    camera: { x: 0, y: 0 },
    dialog: { lines: [], active: false, index: 0 }
  };

  const keyboard = { up: false, down: false, left: false, right: false };
  const joystickState = { active: false, x: 0, y: 0 };

  const joystick = document.getElementById("joystick");
  const joystickStick = joystick.querySelector(".stick");
  const dialogBox = document.getElementById("dialog");
  const dialogText = dialogBox.querySelector(".dialog-text");

  function loadMap() {
    fetch("map.json")
      .then((res) => res.json())
      .then(initialize)
      .catch((error) => {
        console.error("Failed to load map:", error);
      });
  }

  function initialize(map) {
    state.map = map;
    if (!map) return;
    const tileSize = map.tileSize;
    state.player = {
      x: map.playerStart.x * tileSize,
      y: map.playerStart.y * tileSize,
      width: tileSize * 0.6,
      height: tileSize * 0.7,
      direction: "down",
      frame: 0,
      animTimer: 0,
      moving: false,
      speed: tileSize * 3.1
    };

    state.npc = {
      x: map.npc.x * tileSize,
      y: map.npc.y * tileSize,
      baseX: map.npc.x * tileSize,
      baseY: map.npc.y * tileSize,
      sprite: SPRITES.npc.idle,
      bobTimer: 0
    };

    state.dialog.lines = map.dialog || [];

    setupControls();
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
  }

  const keyBindings = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right"
  };

  function setupControls() {
    window.addEventListener("keydown", (event) => {
      if (event.code in keyBindings) {
        keyboard[keyBindings[event.code]] = true;
      } else if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        handleInteraction();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.code in keyBindings) {
        keyboard[keyBindings[event.code]] = false;
      }
    });

    canvas.addEventListener("pointerup", (event) => {
      // quick taps trigger interaction on touch devices
      if (event.pointerType !== "mouse") {
        handleInteraction();
      }
    });

    joystick.addEventListener("pointerdown", startJoystick);
    joystick.addEventListener("pointermove", moveJoystick);
    joystick.addEventListener("pointerup", endJoystick);
    joystick.addEventListener("pointercancel", endJoystick);
    joystick.addEventListener("lostpointercapture", endJoystick);
  }

  function startJoystick(event) {
    if (joystick.setPointerCapture) {
      try {
        joystick.setPointerCapture(event.pointerId);
      } catch (err) {
        // ignore capture failures in unsupported environments
      }
    }
    joystickState.active = true;
    updateJoystick(event);
    event.preventDefault();
  }

  function moveJoystick(event) {
    if (!joystickState.active) return;
    updateJoystick(event);
    event.preventDefault();
  }

  function endJoystick(event) {
    if (!joystickState.active) return;
    joystickState.active = false;
    joystickState.x = 0;
    joystickState.y = 0;
    joystickStick.style.transform = "translate(0px, 0px)";
    if (joystick.releasePointerCapture) {
      try {
        joystick.releasePointerCapture(event.pointerId);
      } catch (err) {
        // ignore release failures in unsupported environments
      }
    }
    event.preventDefault();
  }

  function updateJoystick(event) {
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const radius = rect.width / 2;
    const distance = Math.min(Math.hypot(dx, dy), radius);
    const angle = Math.atan2(dy, dx);

    let normalizedX = Math.cos(angle) * (distance / radius);
    let normalizedY = Math.sin(angle) * (distance / radius);

    const deadZone = 0.2;
    if (Math.abs(normalizedX) < deadZone) normalizedX = 0;
    if (Math.abs(normalizedY) < deadZone) normalizedY = 0;

    joystickState.x = normalizedX;
    joystickState.y = normalizedY;

    const stickRange = radius * 0.4;
    joystickStick.style.transform = `translate(${normalizedX * stickRange}px, ${normalizedY * stickRange}px)`;
  }

  function getMovementVector() {
    if (joystickState.active) {
      return { x: joystickState.x, y: joystickState.y };
    }

    const x = (keyboard.right ? 1 : 0) - (keyboard.left ? 1 : 0);
    const y = (keyboard.down ? 1 : 0) - (keyboard.up ? 1 : 0);
    return { x, y };
  }

  function normalizeVector(vector) {
    const length = Math.hypot(vector.x, vector.y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: vector.x / length, y: vector.y / length };
  }

  function collides(x, y) {
    const { map, player } = state;
    const tileSize = map.tileSize;
    const halfW = player.width / 2;
    const halfH = player.height / 2;

    const points = [
      { x: x - halfW, y: y - halfH },
      { x: x + halfW, y: y - halfH },
      { x: x - halfW, y: y + halfH },
      { x: x + halfW, y: y + halfH }
    ];

    return points.some((point) => {
      if (point.x < 0 || point.y < 0) return true;
      if (point.x >= map.width * tileSize || point.y >= map.height * tileSize) return true;
      const tileX = Math.floor(point.x / tileSize);
      const tileY = Math.floor(point.y / tileSize);
      const index = tileY * map.width + tileX;
      const tile = map.tiles[index];
      return map.solid.includes(tile);
    });
  }

  function updatePlayer(dt) {
    const { player, map } = state;
    const tileSize = map.tileSize;
    const movement = getMovementVector();
    const normalized = normalizeVector(movement);

    player.moving = normalized.x !== 0 || normalized.y !== 0;

    if (player.moving) {
      if (Math.abs(normalized.x) > Math.abs(normalized.y)) {
        player.direction = normalized.x > 0 ? "right" : "left";
      } else {
        player.direction = normalized.y > 0 ? "down" : "up";
      }
    }

    const speed = player.speed;
    const dx = normalized.x * speed * dt;
    const dy = normalized.y * speed * dt;

    if (dx !== 0) {
      const newX = player.x + dx;
      if (!collides(newX, player.y)) {
        player.x = newX;
      }
    }

    if (dy !== 0) {
      const newY = player.y + dy;
      if (!collides(player.x, newY)) {
        player.y = newY;
      }
    }

    if (player.moving) {
      player.animTimer += dt * 8;
      player.frame = Math.floor(player.animTimer) % 2;
    } else {
      player.animTimer = 0;
      player.frame = 0;
    }

  }

  function updateCamera() {
    const { map, player } = state;
    if (!map) return;
    const tileSize = map.tileSize;
    const worldWidth = map.width * tileSize;
    const worldHeight = map.height * tileSize;

    state.camera.x = clamp(player.x - viewport.width / 2, 0, Math.max(0, worldWidth - viewport.width));
    state.camera.y = clamp(player.y - viewport.height / 2, 0, Math.max(0, worldHeight - viewport.height));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateNpc(dt) {
    const { npc, map } = state;
    if (!npc || !map) return;
    npc.bobTimer += dt * 2;
    const bobDistance = map.tileSize * 0.2;
    npc.y = npc.baseY + Math.sin(npc.bobTimer) * bobDistance;
    npc.x = npc.baseX + Math.cos(npc.bobTimer * 0.5) * (map.tileSize * 0.1);
  }

  function clearCanvas() {
    ctx.fillStyle = "#07121d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawMap() {
    const { map, camera } = state;
    const tileSize = map.tileSize;
    const scale = tileSize;
    const colors = {
      0: ["#274b35", "#305e3f", "#1f3a28"],
      1: ["#1a2735"],
      2: ["#c7b07d", "#b79c66"],
      3: ["#1f3f55", "#2f5f7b"]
    };

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const index = y * map.width + x;
        const tile = map.tiles[index];
        const screenX = x * scale - camera.x;
        const screenY = y * scale - camera.y;

        if (screenX + scale < 0 || screenY + scale < 0 || screenX > viewport.width || screenY > viewport.height) {
          continue;
        }

        const palette = colors[tile] || ["#000000"];
        ctx.fillStyle = palette[0];
        ctx.fillRect(Math.floor(screenX), Math.floor(screenY), scale + 1, scale + 1);

        if (tile === 0 && palette.length > 1) {
          ctx.fillStyle = palette[1];
          ctx.fillRect(Math.floor(screenX) + 6, Math.floor(screenY) + 6, 4, 4);
          ctx.fillRect(Math.floor(screenX) + 20, Math.floor(screenY) + 10, 3, 3);
        } else if (tile === 2 && palette.length > 1) {
          ctx.fillStyle = palette[1];
          ctx.fillRect(Math.floor(screenX) + 0, Math.floor(screenY) + scale - 6, scale, 6);
          ctx.fillRect(Math.floor(screenX) + 10, Math.floor(screenY) + 10, 12, 6);
        } else if (tile === 3 && palette.length > 1) {
          ctx.fillStyle = palette[1];
          ctx.fillRect(Math.floor(screenX) + 4, Math.floor(screenY) + 4, scale - 8, scale - 8);
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.fillRect(Math.floor(screenX) + 6, Math.floor(screenY) + 6, scale - 12, 4);
        }
      }
    }
  }

  function drawEntities() {
    const { player, npc, camera, map } = state;
    const tileSize = map.tileSize;
    const spriteScale = tileSize / SPRITES.size;

    function drawSprite(sprite, worldX, worldY) {
      const renderWidth = sprite.width * spriteScale;
      const renderHeight = sprite.height * spriteScale;
      const screenX = Math.floor(worldX - camera.x - renderWidth / 2);
      const screenY = Math.floor(worldY - camera.y - renderHeight + tileSize * 0.5);
      ctx.drawImage(sprite, screenX, screenY, renderWidth, renderHeight);
    }

    const npcSprite = npc.sprite;
    drawSprite(npcSprite, npc.x, npc.y);

    const dir = player.direction;
    let sprite = SPRITES.player.idle[dir];
    if (player.moving) {
      sprite = SPRITES.player.walk[dir][player.frame];
    }
    drawSprite(sprite, player.x, player.y);
  }

  function drawHighlights() {
    const { player, npc, camera, map, dialog } = state;
    const tileSize = map.tileSize;
    const distance = Math.hypot(player.x - npc.x, player.y - npc.y);
    if (distance < tileSize * 1.1 && !dialog.active) {
      const screenX = Math.floor(npc.x - camera.x - 30);
      const screenY = Math.floor(npc.y - camera.y - tileSize * 0.2 - 40);
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fillRect(screenX, screenY, 120, 28);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.strokeRect(screenX + 0.5, screenY + 0.5, 119, 27);
      ctx.fillStyle = "#f6f9fc";
      ctx.font = "12px 'Trebuchet MS', sans-serif";
      ctx.textBaseline = "top";
      ctx.fillText("Press SPACE or TAP", screenX + 8, screenY + 6);
      ctx.fillText("to talk", screenX + 38, screenY + 16);
    }
  }

  function updateDialogBox() {
    if (!state.dialog.active) {
      dialogBox.classList.add("hidden");
      return;
    }
    dialogBox.classList.remove("hidden");
    dialogText.textContent = state.dialog.lines[state.dialog.index] || "...";
  }

  function handleInteraction() {
    const { player, npc, map, dialog } = state;
    if (!map) return;
    const distance = Math.hypot(player.x - npc.x, player.y - npc.y);
    if (distance > map.tileSize * 1.1) {
      if (dialog.active) {
        dialog.active = false;
        dialog.index = 0;
        updateDialogBox();
      }
      return;
    }

    if (!dialog.active) {
      dialog.active = true;
      dialog.index = 0;
    } else {
      dialog.index += 1;
      if (dialog.index >= dialog.lines.length) {
        dialog.active = false;
        dialog.index = 0;
      }
    }
    updateDialogBox();
  }

  let lastTimestamp = 0;
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    updatePlayer(dt);
    updateNpc(dt);
    updateCamera();
    clearCanvas();
    drawMap();
    drawEntities();
    drawHighlights();
    updateDialogBox();

    requestAnimationFrame(gameLoop);
  }

  loadMap();
})();
