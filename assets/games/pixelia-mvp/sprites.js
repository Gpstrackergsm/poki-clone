(function () {
  const size = 24;

  function createFrame(draw) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    draw(ctx);
    return canvas;
  }

  const playerPalette = {
    skin: "#f7d7b5",
    hair: "#4b2e83",
    outfit: "#4ce0b3",
    outfitShade: "#37b08a",
    outline: "#1a2733",
    accent: "#fefefe",
    boots: "#2b4c6f"
  };

  const npcPalette = {
    skin: "#f1c27d",
    hair: "#1f1b2c",
    outfit: "#f27059",
    outfitShade: "#bf4d3a",
    outline: "#1c1515",
    accent: "#f9f7f3",
    boots: "#47393f"
  };

  function drawShadow(ctx) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(6, size - 5, 12, 3);
  }

  function drawPlayer(ctx, direction, step) {
    ctx.clearRect(0, 0, size, size);
    drawShadow(ctx);

    const legOffset = step === 0 ? -1 : 1;
    const altOffset = -legOffset;

    // Legs
    ctx.fillStyle = playerPalette.boots;
    if (direction === "left" || direction === "right") {
      ctx.fillRect(9 + legOffset, 16, 4, 6);
      ctx.fillRect(11 + altOffset, 16, 4, 6);
    } else {
      ctx.fillRect(8 + legOffset, 16, 4, 6);
      ctx.fillRect(12 + altOffset, 16, 4, 6);
    }

    // Tunic
    ctx.fillStyle = playerPalette.outfit;
    ctx.fillRect(8, 9, 8, 8);
    ctx.fillStyle = playerPalette.outfitShade;
    if (direction === "left") {
      ctx.fillRect(8, 9, 3, 8);
    } else if (direction === "right") {
      ctx.fillRect(13, 9, 3, 8);
    } else {
      ctx.fillRect(8, 13, 8, 4);
    }

    // Arms
    ctx.fillStyle = playerPalette.outfit;
    if (direction === "up") {
      ctx.fillRect(6, 10, 4, 4);
      ctx.fillRect(14, 10, 4, 4);
    } else if (direction === "down") {
      ctx.fillRect(6, 11, 4, 4);
      ctx.fillRect(14, 11, 4, 4);
    } else if (direction === "left") {
      ctx.fillRect(5, 11, 4, 4);
      ctx.fillRect(14, 11, 4, 4);
    } else if (direction === "right") {
      ctx.fillRect(6, 11, 4, 4);
      ctx.fillRect(15, 11, 4, 4);
    }

    // Head & hair
    ctx.fillStyle = playerPalette.hair;
    ctx.fillRect(7, 3, 10, 6);
    if (direction === "up") {
      ctx.fillRect(7, 5, 10, 6);
    }

    ctx.fillStyle = playerPalette.skin;
    if (direction === "up") {
      ctx.fillRect(8, 5, 8, 6);
    } else {
      ctx.fillRect(8, 6, 8, 7);
    }

    // Face details
    if (direction === "down") {
      ctx.fillStyle = playerPalette.outline;
      ctx.fillRect(10, 8, 2, 2);
      ctx.fillRect(14, 8, 2, 2);
      ctx.fillRect(11, 11, 4, 1);
    } else if (direction === "left") {
      ctx.fillStyle = playerPalette.outline;
      ctx.fillRect(9, 8, 2, 2);
      ctx.fillRect(8, 11, 4, 1);
    } else if (direction === "right") {
      ctx.fillStyle = playerPalette.outline;
      ctx.fillRect(13, 8, 2, 2);
      ctx.fillRect(12, 11, 4, 1);
    }

    // Belt highlight
    ctx.fillStyle = playerPalette.accent;
    ctx.fillRect(8, 13, 8, 1);

    // Outline
    ctx.strokeStyle = playerPalette.outline;
    ctx.lineWidth = 1;
    ctx.strokeRect(7.5, 2.5, 9, 11);
  }

  function drawNpc(ctx) {
    ctx.clearRect(0, 0, size, size);
    drawShadow(ctx);

    ctx.fillStyle = npcPalette.boots;
    ctx.fillRect(10, 17, 4, 5);
    ctx.fillRect(12, 17, 4, 5);

    ctx.fillStyle = npcPalette.outfit;
    ctx.fillRect(8, 9, 8, 9);
    ctx.fillStyle = npcPalette.outfitShade;
    ctx.fillRect(8, 13, 8, 4);

    ctx.fillStyle = npcPalette.outfit;
    ctx.fillRect(6, 11, 4, 4);
    ctx.fillRect(14, 11, 4, 4);

    ctx.fillStyle = npcPalette.hair;
    ctx.fillRect(7, 3, 10, 5);

    ctx.fillStyle = npcPalette.skin;
    ctx.fillRect(8, 6, 8, 6);

    ctx.fillStyle = npcPalette.outline;
    ctx.fillRect(10, 8, 2, 2);
    ctx.fillRect(14, 8, 2, 2);
    ctx.fillRect(11, 12, 4, 1);

    ctx.strokeStyle = npcPalette.outline;
    ctx.lineWidth = 1;
    ctx.strokeRect(7.5, 2.5, 9, 12);
  }

  const playerIdle = {
    up: createFrame((ctx) => drawPlayer(ctx, "up", 0)),
    down: createFrame((ctx) => drawPlayer(ctx, "down", 0)),
    left: createFrame((ctx) => drawPlayer(ctx, "left", 0)),
    right: createFrame((ctx) => drawPlayer(ctx, "right", 0))
  };

  const playerWalk = {
    up: [
      createFrame((ctx) => drawPlayer(ctx, "up", 0)),
      createFrame((ctx) => drawPlayer(ctx, "up", 1))
    ],
    down: [
      createFrame((ctx) => drawPlayer(ctx, "down", 0)),
      createFrame((ctx) => drawPlayer(ctx, "down", 1))
    ],
    left: [
      createFrame((ctx) => drawPlayer(ctx, "left", 0)),
      createFrame((ctx) => drawPlayer(ctx, "left", 1))
    ],
    right: [
      createFrame((ctx) => drawPlayer(ctx, "right", 0)),
      createFrame((ctx) => drawPlayer(ctx, "right", 1))
    ]
  };

  const npcIdle = createFrame((ctx) => drawNpc(ctx));

  window.SPRITES = {
    player: {
      idle: playerIdle,
      walk: playerWalk
    },
    npc: {
      idle: npcIdle
    },
    size
  };
})();
