const TILE_SIZE = 32;

function createSprite(width, height, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawFn(ctx);
  return canvas;
}

function drawTile(ctx, baseColor, accentColor, pattern = false) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  if (pattern) {
    ctx.fillStyle = accentColor;
    for (let y = 0; y < TILE_SIZE; y += 4) {
      for (let x = (y / 4) % 2 === 0 ? 0 : 2; x < TILE_SIZE; x += 4) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
}

function makePlayerSprite(color, accent) {
  const frames = { down: [], up: [], left: [], right: [] };
  const base = (direction, step) => createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = color;
    ctx.fillRect(10, 6, 12, 12);
    ctx.fillStyle = accent;
    ctx.fillRect(11, 9, 4, 4);
    ctx.fillRect(17, 9, 4, 4);
    ctx.fillStyle = '#fff';
    if (direction === 'down') {
      ctx.fillRect(12, 10, 3, 3);
      ctx.fillRect(17, 10, 3, 3);
    } else if (direction === 'up') {
      ctx.fillRect(13, 8, 3, 3);
      ctx.fillRect(16, 8, 3, 3);
    } else if (direction === 'left') {
      ctx.fillRect(11, 9, 3, 3);
    } else {
      ctx.fillRect(18, 9, 3, 3);
    }
    ctx.fillStyle = '#2e1f18';
    ctx.fillRect(11, 4, 10, 4);
    const offset = step === 1 ? 0 : step === 2 ? -2 : 2;
    ctx.fillStyle = '#4f3b2f';
    ctx.fillRect(12 + offset, 18, 4, 8);
    ctx.fillRect(16 - offset, 18, 4, 8);
    ctx.fillStyle = '#2f6e4f';
    ctx.fillRect(9, 14, 14, 6);
    ctx.fillRect(9, 19, 14, 4);
  });
  ['down','up','left','right'].forEach(dir => {
    for (let i = 0; i < 3; i++) {
      frames[dir].push(base(dir, i));
    }
  });
  return frames;
}

function makeNpcSprite(baseHue) {
  return createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    ctx.fillStyle = `hsl(${baseHue},55%,55%)`;
    ctx.fillRect(8, 6, 16, 16);
    ctx.fillStyle = '#fff6cc';
    ctx.fillRect(11, 10, 4, 4);
    ctx.fillRect(17, 10, 4, 4);
    ctx.fillStyle = '#2c1f15';
    ctx.fillRect(10, 4, 12, 4);
    ctx.fillStyle = `hsl(${baseHue+20},60%,40%)`;
    ctx.fillRect(10, 18, 12, 10);
  });
}

const TILE_SPRITES = {
  0: createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    drawTile(ctx, '#3a9d5d', '#51c075', true);
  }),
  1: createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    drawTile(ctx, '#c28b52', '#d4a46e', true);
  }),
  2: createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    drawTile(ctx, '#4a7fd1', '#82b3ff', true);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(0, 0, TILE_SIZE, 4);
  }),
  3: createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    drawTile(ctx, '#6c5a4a', '#8b7760', true);
    ctx.fillStyle = '#2d241c';
    ctx.fillRect(0, 0, TILE_SIZE, 6);
  }),
  4: createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    drawTile(ctx, '#b4743c', '#d69154', true);
    ctx.fillStyle = '#f1e3a2';
    ctx.fillRect(10, 6, 12, 20);
  }),
  5: createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    drawTile(ctx, '#377d4b', '#4f9a63', true);
    ctx.fillStyle = '#2b5a36';
    ctx.beginPath();
    ctx.arc(16, 14, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5b3a1f';
    ctx.fillRect(14, 18, 4, 12);
  })
};

const TREE_TOP = createSprite(TILE_SIZE, TILE_SIZE, ctx => {
  ctx.fillStyle = '#2b5a36';
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(8, 6, 10, 6);
});

const PLAYER_SPRITES = makePlayerSprite('#f4c95d', '#fcefc7');

const NPC_SPRITES = [0,90,180,240].map(h => makeNpcSprite(h));

const PLANT_SPRITES = [
  createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    ctx.fillStyle = '#4a7237';
    ctx.fillRect(14, 18, 4, 8);
  }),
  createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    ctx.fillStyle = '#4f8d3f';
    ctx.fillRect(12, 16, 8, 12);
    ctx.fillStyle = '#73b95d';
    ctx.fillRect(10, 14, 4, 4);
    ctx.fillRect(18, 14, 4, 4);
  }),
  createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    ctx.fillStyle = '#71b350';
    ctx.fillRect(8, 14, 16, 14);
    ctx.fillStyle = '#d9e774';
    ctx.fillRect(12, 8, 8, 8);
  })
];

const ITEM_SPRITES = {
  coin: createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    ctx.fillStyle = '#c79b2b';
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f4d35e';
    ctx.lineWidth = 4;
    ctx.stroke();
  }),
  coin_pouch: createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    ctx.fillStyle = '#b2712e';
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78481f';
    ctx.fillRect(12, 6, 8, 6);
  }),
  hoe: createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    ctx.fillStyle = '#c8a36d';
    ctx.fillRect(15, 6, 2, 20);
    ctx.fillStyle = '#607b94';
    ctx.fillRect(12, 6, 8, 6);
  }),
  watering_can: createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    ctx.fillStyle = '#5d88c5';
    ctx.fillRect(12, 8, 12, 12);
    ctx.fillRect(20, 10, 8, 6);
    ctx.fillStyle = '#8cb4e6';
    ctx.fillRect(10, 12, 4, 6);
  }),
  wheat_seeds: createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    ctx.fillStyle = '#d6b36b';
    ctx.fillRect(12, 14, 8, 6);
    ctx.fillStyle = '#f4d794';
    ctx.fillRect(10, 12, 12, 4);
  }),
  wheat: createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    ctx.fillStyle = '#f5e17f';
    ctx.fillRect(12, 8, 8, 16);
    ctx.fillStyle = '#d2b95c';
    ctx.fillRect(10, 20, 12, 8);
  }),
  bread: createSprite(TILE_SIZE, TILE_SIZE, ctx => {
    ctx.fillStyle = '#d1a05d';
    ctx.fillRect(10, 12, 12, 12);
    ctx.fillStyle = '#f5cf87';
    ctx.fillRect(12, 10, 8, 4);
  })
};

const SPRITES = {
  tileSize: TILE_SIZE,
  tiles: TILE_SPRITES,
  player: PLAYER_SPRITES,
  npc: NPC_SPRITES,
  plants: PLANT_SPRITES,
  items: ITEM_SPRITES,
  treeTop: TREE_TOP
};

window.SPRITES = SPRITES;
