const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const dialogBox = document.getElementById('dialog-box');
const dialogName = document.getElementById('dialog-name');
const dialogText = document.getElementById('dialog-text');
const dialogNext = document.getElementById('dialog-next');
const inventoryWindow = document.getElementById('inventory-window');
const inventoryGrid = document.getElementById('inventory-grid');
const questLog = document.getElementById('quest-log');
const questEntries = document.getElementById('quest-entries');
const hudClock = document.getElementById('clock-display');
const touchInteract = document.getElementById('touch-interact');
const joystick = document.getElementById('joystick');
const joystickStick = document.getElementById('joystick-stick');

const KEY_STATE = {};
const INPUTS = {
  interact: false,
  inventory: false,
  quests: false
};

const GAME = {
  tileSize: 32,
  currentMapName: 'overworld',
  maps: {},
  npcs: [],
  npcData: [],
  quests: [],
  questStates: {},
  items: {},
  groundItems: [],
  activeDialog: null,
  dialogQueue: [],
  player: {
    x: 0,
    y: 0,
    speed: 120,
    width: 20,
    height: 24,
    direction: 'down',
    frameTime: 0,
    frameIndex: 0,
    vx: 0,
    vy: 0,
    inventory: new Array(12).fill(null),
    activeSlot: 0,
    coins: 0,
    health: 100,
    footstepTimer: 0
  },
  camera: {
    x: 0,
    y: 0
  },
  time: 0,
  day: 1,
  dayLength: 120000,
  lastFrame: 0,
  farmland: {},
  farmlandLookup: {},
  fade: 0,
  fadeTarget: 0,
  overlayNight: 0,
  nightToneTimer: 0
};

const CYCLE_SEGMENTS = {
  morning: [6, 12],
  noon: [12, 18],
  evening: [18, 24]
};

const COLLISION_TILES = new Set([2, 3, 5]);

const DOOR_TILE = 4;

const ITEM_LOCATIONS = [
  { id: 'coin_pouch', x: 30, y: 30, map: 'overworld' }
];

let tooltipElem = null;

async function loadData() {
  const [mapData, npcData, questData, itemData] = await Promise.all([
    fetch('map.json').then(r => r.json()),
    fetch('npc.json').then(r => r.json()),
    fetch('quests.json').then(r => r.json()),
    fetch('items.json').then(r => r.json())
  ]);
  GAME.tileSize = mapData.tileSize || SPRITES.tileSize;
  delete mapData.tileSize;
  GAME.maps = mapData;
  GAME.npcData = npcData;
  GAME.quests = questData;
  GAME.items = itemData;

  for (const mapName of Object.keys(GAME.maps)) {
    GAME.farmland[mapName] = {};
    const map = GAME.maps[mapName];
    if (map.farmland) {
      GAME.farmlandLookup[mapName] = new Set(map.farmland.map(f => `${f.x},${f.y}`));
    } else {
      GAME.farmlandLookup[mapName] = new Set();
    }
  }

  GAME.groundItems = ITEM_LOCATIONS.map(item => ({ ...item, picked: false, timer: 0 }));

  initGame();
}

function initGame() {
  const spawn = GAME.maps.overworld.spawn || { x: 30, y: 30 };
  GAME.player.x = spawn.x * GAME.tileSize;
  GAME.player.y = spawn.y * GAME.tileSize;
  GAME.currentMapName = 'overworld';
  GAME.camera.x = GAME.player.x - canvas.width / 2;
  GAME.camera.y = GAME.player.y - canvas.height / 2;

  // Starting inventory
  addItem('hoe', 1);
  addItem('watering_can', 1);
  addItem('wheat_seeds', 3);

  setupInventoryUI();
  setupInput();
  spawnNPCs();
  requestAnimationFrame(gameLoop);
}

function setupInventoryUI() {
  inventoryGrid.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.dataset.index = i;
    slot.addEventListener('click', () => {
      GAME.player.activeSlot = i;
      updateInventoryUI();
    });
    slot.addEventListener('mouseenter', e => showTooltip(e, i));
    slot.addEventListener('mouseleave', hideTooltip);
    inventoryGrid.appendChild(slot);
  }
}

function setupInput() {
  window.addEventListener('keydown', e => {
    KEY_STATE[e.key.toLowerCase()] = true;
    if (e.key === 'e') {
      INPUTS.interact = true;
    }
    if (e.key.toLowerCase() === 'i') {
      togglePanel(inventoryWindow);
    }
    if (e.key.toLowerCase() === 'q') {
      togglePanel(questLog);
    }
  });
  window.addEventListener('keyup', e => {
    KEY_STATE[e.key.toLowerCase()] = false;
  });
  dialogNext.addEventListener('click', advanceDialog);
  touchInteract.addEventListener('click', () => {
    INPUTS.interact = true;
  });
  setupTouchControls();
}

function togglePanel(panel) {
  panel.classList.toggle('hidden');
}

function setupTouchControls() {
  if (!('ontouchstart' in window)) {
    joystick.style.display = 'none';
    touchInteract.style.display = 'none';
    return;
  }
  let active = false;
  let rect = null;

  const reset = () => {
    joystickStick.style.left = '50%';
    joystickStick.style.top = '50%';
    joystickStick.style.transform = 'translate(-50%, -50%)';
    ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].forEach(k => {
      KEY_STATE[k] = false;
    });
  };

  const updateFromEvent = e => {
    if (!active) return;
    const x = e.clientX;
    const y = e.clientY;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const max = rect.width / 2;
    const dist = Math.min(max, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle) * (dist / max);
    const ny = Math.sin(angle) * (dist / max);
    joystickStick.style.left = `${50 + nx * 40}%`;
    joystickStick.style.top = `${50 + ny * 40}%`;
    KEY_STATE['arrowleft'] = nx < -0.25;
    KEY_STATE['arrowright'] = nx > 0.25;
    KEY_STATE['arrowup'] = ny < -0.25;
    KEY_STATE['arrowdown'] = ny > 0.25;
  };

  joystick.addEventListener('pointerdown', e => {
    active = true;
    rect = joystick.getBoundingClientRect();
    joystick.setPointerCapture(e.pointerId);
    updateFromEvent(e);
  });
  joystick.addEventListener('pointermove', updateFromEvent);
  const end = e => {
    if (!active) return;
    joystick.releasePointerCapture(e.pointerId);
    active = false;
    reset();
  };
  joystick.addEventListener('pointerup', end);
  joystick.addEventListener('pointercancel', end);
}

function addItem(id, quantity = 1) {
  for (let i = 0; i < GAME.player.inventory.length; i++) {
    const slot = GAME.player.inventory[i];
    if (slot && slot.id === id) {
      slot.quantity += quantity;
      updateInventoryUI();
      return true;
    }
  }
  for (let i = 0; i < GAME.player.inventory.length; i++) {
    if (!GAME.player.inventory[i]) {
      GAME.player.inventory[i] = { id, quantity };
      updateInventoryUI();
      return true;
    }
  }
  return false;
}

function removeItem(id, quantity = 1) {
  for (let i = 0; i < GAME.player.inventory.length; i++) {
    const slot = GAME.player.inventory[i];
    if (slot && slot.id === id) {
      slot.quantity -= quantity;
      if (slot.quantity <= 0) {
        GAME.player.inventory[i] = null;
      }
      updateInventoryUI();
      return true;
    }
  }
  return false;
}

function getActiveItem() {
  return GAME.player.inventory[GAME.player.activeSlot] || null;
}

function showTooltip(evt, index) {
  const item = GAME.player.inventory[index];
  if (!item) return;
  const data = GAME.items[item.id];
  if (!data) return;
  tooltipElem = document.createElement('div');
  tooltipElem.className = 'tooltip';
  tooltipElem.innerHTML = `<strong>${data.name}</strong><br>${data.description}`;
  document.body.appendChild(tooltipElem);
  const rect = evt.target.getBoundingClientRect();
  tooltipElem.style.left = `${rect.left}px`;
  tooltipElem.style.top = `${rect.top - 40}px`;
}

function hideTooltip() {
  if (tooltipElem) {
    tooltipElem.remove();
    tooltipElem = null;
  }
}

function updateInventoryUI() {
  const slots = inventoryGrid.children;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    slot.innerHTML = '';
    slot.style.borderColor = i === GAME.player.activeSlot ? '#f7d774' : 'rgba(255,255,255,0.2)';
    const item = GAME.player.inventory[i];
    if (item) {
      const sprite = SPRITES.items[item.id];
      if (sprite) {
        const img = document.createElement('canvas');
        img.width = SPRITES.tileSize;
        img.height = SPRITES.tileSize;
        const ictx = img.getContext('2d');
        ictx.drawImage(sprite, 0, 0);
        img.style.width = '32px';
        img.style.height = '32px';
        slot.appendChild(img);
      }
      const qty = document.createElement('span');
      qty.textContent = item.quantity;
      slot.appendChild(qty);
    }
  }
}

function spawnNPCs() {
  GAME.npcs = GAME.npcData.map((data, idx) => ({
    ...data,
    x: data.x * GAME.tileSize,
    y: data.y * GAME.tileSize,
    map: 'overworld',
    dialogIndex: 0,
    targetIndex: 0,
    waitTime: 0,
    sprite: SPRITES.npc[data.spriteIndex % SPRITES.npc.length],
    activeRoute: []
  }));
}

function getCurrentMap() {
  return GAME.maps[GAME.currentMapName];
}

function coordinateToIndex(x, y, map = getCurrentMap()) {
  return y * map.width + x;
}

function tileAt(x, y, map = getCurrentMap()) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return 2;
  return map.tiles[coordinateToIndex(x, y, map)];
}

function isCollidable(x, y) {
  const tile = tileAt(x, y);
  if (tile === DOOR_TILE) return false;
  return COLLISION_TILES.has(tile);
}

function updatePlayer(delta) {
  const speed = GAME.player.speed;
  let vx = 0;
  let vy = 0;
  if (KEY_STATE['arrowup'] || KEY_STATE['w']) vy -= 1;
  if (KEY_STATE['arrowdown'] || KEY_STATE['s']) vy += 1;
  if (KEY_STATE['arrowleft'] || KEY_STATE['a']) vx -= 1;
  if (KEY_STATE['arrowright'] || KEY_STATE['d']) vx += 1;

  const len = Math.hypot(vx, vy) || 1;
  vx = (vx / len) * speed;
  vy = (vy / len) * speed;

  GAME.player.vx = vx;
  GAME.player.vy = vy;

  if (vx !== 0 || vy !== 0) {
    const dir = Math.abs(vx) > Math.abs(vy)
      ? (vx > 0 ? 'right' : 'left')
      : (vy > 0 ? 'down' : 'up');
    GAME.player.direction = dir;
    GAME.player.frameTime += delta;
    if (GAME.player.frameTime > 0.12) {
      GAME.player.frameTime = 0;
      GAME.player.frameIndex = (GAME.player.frameIndex + 1) % 3;
    }
  } else {
    GAME.player.frameIndex = 1;
    GAME.player.frameTime = 0;
  }

  moveWithCollision(GAME.player, vx * delta, vy * delta);

  if (vx !== 0 || vy !== 0) {
    GAME.player.footstepTimer -= delta;
    if (GAME.player.footstepTimer <= 0) {
      SOUNDS.playFootstep();
      GAME.player.footstepTimer = 0.35;
    }
  }

  if (INPUTS.interact) {
    handleInteraction();
  }
  INPUTS.interact = false;

  checkReachObjectives();
}

function moveWithCollision(entity, dx, dy) {
  const map = getCurrentMap();
  const nextX = entity.x + dx;
  const nextY = entity.y + dy;
  const halfW = entity.width / 2;
  const halfH = entity.height / 2;
  const corners = [
    { x: nextX - halfW, y: nextY - halfH },
    { x: nextX + halfW, y: nextY - halfH },
    { x: nextX - halfW, y: nextY + halfH },
    { x: nextX + halfW, y: nextY + halfH }
  ];

  const canMove = corners.every(c => {
    const tx = Math.floor(c.x / GAME.tileSize);
    const ty = Math.floor(c.y / GAME.tileSize);
    return !isCollidable(tx, ty);
  });

  if (canMove) {
    entity.x = nextX;
    entity.y = nextY;
  } else {
    // slide separately
    const canMoveX = corners.every(c => {
      const tx = Math.floor((entity.x + dx) / GAME.tileSize);
      const ty = Math.floor(c.y / GAME.tileSize);
      return !isCollidable(tx, ty);
    });
    if (canMoveX) entity.x += dx;
    const canMoveY = corners.every(c => {
      const tx = Math.floor(c.x / GAME.tileSize);
      const ty = Math.floor((entity.y + dy) / GAME.tileSize);
      return !isCollidable(tx, ty);
    });
    if (canMoveY) entity.y += dy;
  }

  const tileX = Math.floor(entity.x / GAME.tileSize);
  const tileY = Math.floor(entity.y / GAME.tileSize);
  const tile = tileAt(tileX, tileY, map);
  if (tile === DOOR_TILE) {
    tryDoorTransition(tileX, tileY);
  }
}

function tryDoorTransition(tileX, tileY) {
  const map = getCurrentMap();
  const door = (map.doors || []).find(d => d.x === tileX && d.y === tileY);
  if (door) {
    GAME.fadeTarget = 1;
    setTimeout(() => {
      GAME.currentMapName = door.target;
      const targetMap = getCurrentMap();
      const spawnX = (door.targetX || 2) * GAME.tileSize;
      const spawnY = (door.targetY || 2) * GAME.tileSize;
      GAME.player.x = spawnX;
      GAME.player.y = spawnY;
      GAME.camera.x = GAME.player.x - canvas.width / 2;
      GAME.camera.y = GAME.player.y - canvas.height / 2;
      GAME.fadeTarget = 0;
    }, 200);
  }
}

function handleInteraction() {
  if (GAME.activeDialog) {
    advanceDialog();
    return;
  }
  const playerTileX = Math.floor(GAME.player.x / GAME.tileSize);
  const playerTileY = Math.floor(GAME.player.y / GAME.tileSize);
  // NPC interaction
  const npc = GAME.npcs.find(n => n.map === GAME.currentMapName && distance(n.x, n.y, GAME.player.x, GAME.player.y) < GAME.tileSize);
  if (npc) {
    startDialog(npc);
    updateQuestProgress({ type: 'talk', target: npc.id });
    return;
  }
  // Farming interaction
  const farmland = getFarmlandTile(playerTileX, playerTileY);
  if (farmland) {
    const active = getActiveItem();
    if (active && GAME.items[active.id].type === 'seed' && !farmland.planted) {
      farmland.planted = { id: active.id.replace('_seeds', ''), plantedAt: performance.now(), growth: GAME.items[active.id].growthTime || 40000 };
      removeItem(active.id, 1);
      updateQuestProgress({ type: 'plant', item: active.id });
    } else if (farmland.planted) {
      const progress = (performance.now() - farmland.planted.plantedAt) / farmland.planted.growth;
      if (progress >= 1) {
        addItem(farmland.planted.id, 1);
        updateQuestProgress({ type: 'harvest', item: farmland.planted.id });
        farmland.planted = null;
      }
    }
  }

  // pickup items from ground
  const item = GAME.groundItems.find(i => !i.picked && i.map === GAME.currentMapName && Math.abs(i.x - playerTileX) <= 1 && Math.abs(i.y - playerTileY) <= 1);
  if (item) {
    if (addItem(item.id, 1)) {
      item.picked = true;
      SOUNDS.playPickup();
      updateQuestProgress({ type: 'pickup', item: item.id });
    }
  }
}

function getFarmlandTile(x, y, mapName = GAME.currentMapName) {
  const map = GAME.maps[mapName];
  if (!map || !map.farmland) return null;
  const key = `${x},${y}`;
  if (!GAME.farmland[mapName]) GAME.farmland[mapName] = {};
  if (GAME.farmlandLookup[mapName] && GAME.farmlandLookup[mapName].has(key)) {
    if (!GAME.farmland[mapName][key]) {
      GAME.farmland[mapName][key] = { planted: null };
    }
    return GAME.farmland[mapName][key];
  }
  return null;
}

function startDialog(npc) {
  const lines = npc.dialog;
  if (!lines || !lines.length) return;
  GAME.activeDialog = npc;
  GAME.dialogQueue = [...lines];
  dialogName.textContent = npc.name;
  dialogText.textContent = GAME.dialogQueue.shift();
  dialogBox.classList.remove('hidden');
  SOUNDS.playBlip();
  offerQuest(npc.id);
}

function advanceDialog() {
  if (!GAME.activeDialog) return;
  if (GAME.dialogQueue.length > 0) {
    dialogText.textContent = GAME.dialogQueue.shift();
    SOUNDS.playBlip();
  } else {
    dialogBox.classList.add('hidden');
    GAME.activeDialog = null;
    GAME.dialogQueue = [];
  }
}

function offerQuest(npcId) {
  const available = GAME.quests.filter(q => !GAME.questStates[q.id]);
  for (const quest of available) {
    const firstStep = quest.steps[0];
    const giverMatches = quest.giver ? quest.giver === npcId : false;
    const talkMatches = firstStep.type === 'talk' && firstStep.target === npcId;
    if (giverMatches || talkMatches) {
      GAME.questStates[quest.id] = { step: 0, status: 'active' };
      addQuestEntry(quest);
      refreshQuestEntry(quest);
      dialogText.textContent += `\nQuest accepted: ${quest.name}`;
      SOUNDS.playPickup();
    }
  }
}

function addQuestEntry(quest) {
  const entry = document.createElement('div');
  entry.id = `quest-${quest.id}`;
  entry.innerHTML = `<strong>${quest.name}</strong><br>${quest.description}`;
  questEntries.appendChild(entry);
}

function refreshQuestEntry(quest) {
  const state = GAME.questStates[quest.id];
  const entry = document.getElementById(`quest-${quest.id}`);
  if (!entry || !state) return;
  const progress = Math.min(state.step, quest.steps.length);
  entry.innerHTML = `<strong>${quest.name}</strong><br>${quest.description}<br><small>Step ${progress}/${quest.steps.length}</small>`;
  if (state.status === 'completed') {
    entry.innerHTML += '<br><em>Completed!</em>';
  }
}

function updateQuestProgress(event) {
  for (const quest of GAME.quests) {
    const state = GAME.questStates[quest.id];
    if (!state || state.status !== 'active') continue;
    const stepData = quest.steps[state.step];
    if (!stepData) continue;
    let completed = false;
    if (stepData.type === 'talk' && event.type === 'talk' && event.target === stepData.target) {
      completed = true;
    }
    if (stepData.type === 'pickup' && event.type === 'pickup' && event.item === stepData.item) {
      completed = true;
    }
    if (stepData.type === 'plant' && event.type === 'plant' && event.item === stepData.item) {
      completed = true;
    }
    if (stepData.type === 'harvest' && event.type === 'harvest' && event.item === stepData.item) {
      completed = true;
    }
    if (stepData.type === 'reach' && event.type === 'reach' && stepData.location && event.location) {
      if (stepData.location[0] === event.location[0] && stepData.location[1] === event.location[1]) {
        completed = true;
      }
    }
    if (completed) {
      state.step += 1;
      refreshQuestEntry(quest);
      if (state.step >= quest.steps.length) {
        state.status = 'completed';
        completeQuest(quest);
      } else {
        SOUNDS.playPickup();
      }
    }
  }
}

function completeQuest(quest) {
  const entry = document.getElementById(`quest-${quest.id}`);
  if (entry) {
    entry.innerHTML = `<strong>${quest.name}</strong><br>${quest.description}<br><small>Completed!</small>`;
  }
  const reward = quest.reward || {};
  if (reward.coins) {
    GAME.player.coins += reward.coins;
    addItem('coin', reward.coins);
  }
  if (reward.item) {
    addItem(reward.item, reward.quantity || 1);
  }
  SOUNDS.playQuestComplete();
}

function updateNPCs(delta) {
  const period = getDayPeriod();
  for (const npc of GAME.npcs) {
    const schedule = npc.schedule[period];
    if (!schedule) continue;
    if (npc.map !== schedule.map) {
      if (GAME.currentMapName === npc.map && GAME.currentMapName === schedule.map) {
        // nothing
      }
      npc.map = schedule.map;
      npc.x = schedule.route[0][0] * GAME.tileSize;
      npc.y = schedule.route[0][1] * GAME.tileSize;
      npc.targetIndex = 0;
    }
    npc.activeRoute = schedule.route;
    if (!npc.activeRoute || npc.activeRoute.length === 0) continue;
    const target = npc.activeRoute[npc.targetIndex % npc.activeRoute.length];
    const targetX = target[0] * GAME.tileSize;
    const targetY = target[1] * GAME.tileSize;
    const dx = targetX - npc.x;
    const dy = targetY - npc.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      npc.waitTime += delta;
      if (npc.waitTime > 1.5) {
        npc.waitTime = 0;
        npc.targetIndex = (npc.targetIndex + 1) % npc.activeRoute.length;
      }
    } else {
      const speed = 60;
      npc.x += (dx / dist) * speed * delta;
      npc.y += (dy / dist) * speed * delta;
    }
  }
}

function updateCamera(delta) {
  const targetX = GAME.player.x - canvas.width / 2;
  const targetY = GAME.player.y - canvas.height / 2;
  GAME.camera.x += (targetX - GAME.camera.x) * Math.min(1, delta * 5);
  GAME.camera.y += (targetY - GAME.camera.y) * Math.min(1, delta * 5);

  const map = getCurrentMap();
  GAME.camera.x = clamp(GAME.camera.x, 0, map.width * GAME.tileSize - canvas.width);
  GAME.camera.y = clamp(GAME.camera.y, 0, map.height * GAME.tileSize - canvas.height);
}

function updateDayNight(delta) {
  GAME.time += delta * 1000;
  if (GAME.time > GAME.dayLength) {
    GAME.time -= GAME.dayLength;
    GAME.day += 1;
  }
  const progress = GAME.time / GAME.dayLength;
  const hour = (progress * 24 + 6) % 24;
  const minutes = Math.floor((hour % 1) * 60);
  const displayHour = Math.floor(hour);
  hudClock.textContent = `Day ${GAME.day} - ${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const isNight = hour >= 19 || hour < 6;
  GAME.overlayNight += ((isNight ? 0.6 : 0) - GAME.overlayNight) * Math.min(1, delta * 2);
  if (isNight) {
    GAME.nightToneTimer -= delta;
    if (GAME.nightToneTimer <= 0) {
      SOUNDS.playNightTone();
      GAME.nightToneTimer = 6;
    }
  } else {
    GAME.nightToneTimer = 2;
  }
}

function getDayPeriod() {
  const progress = GAME.time / GAME.dayLength;
  const hour = (progress * 24 + 6) % 24;
  if (hour >= CYCLE_SEGMENTS.morning[0] && hour < CYCLE_SEGMENTS.morning[1]) return 'morning';
  if (hour >= CYCLE_SEGMENTS.noon[0] && hour < CYCLE_SEGMENTS.noon[1]) return 'noon';
  return 'evening';
}

function updateGroundItems(delta) {
  for (const item of GAME.groundItems) {
    if (!item.picked) {
      item.timer += delta;
    }
  }
}

function updateFarming(delta) {
  for (const mapName of Object.keys(GAME.maps)) {
    const map = GAME.maps[mapName];
    if (!map || !map.farmland) continue;
    for (const plot of map.farmland) {
      const key = `${plot.x},${plot.y}`;
      const data = GAME.farmland[mapName][key];
      if (data && data.planted) {
        const elapsed = performance.now() - data.planted.plantedAt;
        if (elapsed > data.planted.growth) {
          data.planted.ready = true;
        }
      }
    }
  }
}

function updateFade(delta) {
  GAME.fade += (GAME.fadeTarget - GAME.fade) * Math.min(1, delta * 5);
}

function checkReachObjectives() {
  const tileX = Math.floor(GAME.player.x / GAME.tileSize);
  const tileY = Math.floor(GAME.player.y / GAME.tileSize);
  updateQuestProgress({ type: 'reach', location: [tileX, tileY] });
}

function update(delta) {
  updatePlayer(delta);
  updateNPCs(delta);
  updateCamera(delta);
  updateDayNight(delta);
  updateGroundItems(delta);
  updateFarming(delta);
  updateFade(delta);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const map = getCurrentMap();
  const tileSize = GAME.tileSize;
  const startX = Math.floor(GAME.camera.x / tileSize);
  const startY = Math.floor(GAME.camera.y / tileSize);
  const endX = Math.ceil((GAME.camera.x + canvas.width) / tileSize);
  const endY = Math.ceil((GAME.camera.y + canvas.height) / tileSize);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = tileAt(x, y, map);
      const sprite = SPRITES.tiles[tile];
      if (sprite) {
        ctx.drawImage(sprite, x * tileSize - GAME.camera.x, y * tileSize - GAME.camera.y);
      }
      const farmland = getFarmlandTile(x, y);
      if (farmland && farmland.planted) {
        const elapsed = performance.now() - farmland.planted.plantedAt;
        const ratio = Math.min(1, elapsed / farmland.planted.growth);
        let stage = 0;
        if (ratio > 0.7) stage = 2;
        else if (ratio > 0.35) stage = 1;
        ctx.drawImage(SPRITES.plants[stage], x * tileSize - GAME.camera.x, y * tileSize - GAME.camera.y);
      }
    }
  }

  // Ground items
  for (const item of GAME.groundItems) {
    if (item.picked || item.map !== GAME.currentMapName) continue;
    const sprite = SPRITES.items[item.id];
    if (sprite) {
      const bob = Math.sin(performance.now() / 200) * 4;
      ctx.drawImage(
        sprite,
        item.x * tileSize - GAME.camera.x,
        item.y * tileSize - GAME.camera.y - bob
      );
    }
  }

  // NPCs
  for (const npc of GAME.npcs) {
    if (npc.map !== GAME.currentMapName) continue;
    ctx.drawImage(
      npc.sprite,
      npc.x - GAME.camera.x - tileSize / 2,
      npc.y - GAME.camera.y - tileSize / 2
    );
  }

  // Player
  const frames = SPRITES.player[GAME.player.direction];
  const frame = frames[GAME.player.frameIndex];
  ctx.drawImage(frame, GAME.player.x - GAME.camera.x - tileSize / 2, GAME.player.y - GAME.camera.y - tileSize / 2);

  if (GAME.overlayNight > 0.01) {
    ctx.fillStyle = `rgba(20, 30, 60, ${GAME.overlayNight})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (GAME.fade > 0.01) {
    ctx.fillStyle = `rgba(0,0,0,${GAME.fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function gameLoop(timestamp) {
  if (!GAME.lastFrame) GAME.lastFrame = timestamp;
  const delta = (timestamp - GAME.lastFrame) / 1000;
  GAME.lastFrame = timestamp;
  update(delta);
  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('load', () => {
  loadData();
});
