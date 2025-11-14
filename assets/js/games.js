const games = [
  {
    id: "sky-knight",
    title: "Sky Knight Adventures",
    thumbnail: "https://picsum.photos/seed/skynight/400/300",
    category: "action",
    iframe: "https://itch.io/embed-upload/10898750?color=333333",
    description: "Pilot a futuristic jet and outmaneuver enemy squadrons across neon skies in this fast-paced shooter."
  },
  {
    id: "jungle-quest",
    title: "Jungle Quest",
    thumbnail: "https://picsum.photos/seed/junglequest/400/300",
    category: "adventure",
    iframe: "https://itch.io/embed-upload/10944374?color=333333",
    description: "Swing through vines, solve ancient puzzles, and uncover the hidden secrets of a forgotten jungle temple."
  },
  {
    id: "color-mosaic",
    title: "Color Mosaic",
    thumbnail: "https://picsum.photos/seed/colormosaic/400/300",
    category: "puzzle",
    iframe: "https://itch.io/embed-upload/10944446?color=333333",
    description: "Strategically place tiles to complete vibrant mosaics while racing against the clock in this chill puzzler."
  },
  {
    id: "street-kick",
    title: "Street Kick Showdown",
    thumbnail: "https://picsum.photos/seed/streetkick/400/300",
    category: "sports",
    iframe: "https://itch.io/embed-upload/10944474?color=333333",
    description: "Put your freestyle soccer skills to the test with dazzling tricks and timed combo challenges."
  },
  {
    id: "orbital-defense",
    title: "Orbital Defense",
    thumbnail: "https://picsum.photos/seed/orbitaldefense/400/300",
    category: "strategy",
    iframe: "https://itch.io/embed-upload/10944491?color=333333",
    description: "Deploy satellites, manage resources, and defend Earth from relentless waves of asteroids."
  },
  {
    id: "city-rush",
    title: "City Rush Racers",
    thumbnail: "https://picsum.photos/seed/cityrush/400/300",
    category: "sports",
    iframe: "https://itch.io/embed-upload/10944504?color=333333",
    description: "Drift through bustling streets and outrun rivals in an adrenaline-fueled urban racing league."
  },
  {
    id: "mystic-merge",
    title: "Mystic Merge",
    thumbnail: "https://picsum.photos/seed/mysticmerge/400/300",
    category: "puzzle",
    iframe: "https://itch.io/embed-upload/10944533?color=333333",
    description: "Combine enchanted artifacts to unlock new spells and restore harmony to the arcane realm."
  },
  {
    id: "shadow-samurai",
    title: "Shadow Samurai",
    thumbnail: "https://picsum.photos/seed/shadowsamurai/400/300",
    category: "action",
    iframe: "https://itch.io/embed-upload/10944558?color=333333",
    description: "Master stealthy swordplay and precise timing to defeat rival clans under the cover of night."
  },
  {
    id: "crystal-caves",
    title: "Crystal Caves Escape",
    thumbnail: "https://picsum.photos/seed/crystalcaves/400/300",
    category: "adventure",
    iframe: "https://itch.io/embed-upload/10944576?color=333333",
    description: "Descend into shimmering caverns, collect lost relics, and piece together the cave's ancient legend."
  },
  {
    id: "galaxy-tactics",
    title: "Galaxy Tactics",
    thumbnail: "https://picsum.photos/seed/galaxytactics/400/300",
    category: "strategy",
    iframe: "https://itch.io/embed-upload/10944601?color=333333",
    description: "Command fleets, conquer sectors, and outsmart rival commanders in a battle for galactic dominance."
  },
  {
    id: "snowboard-zen",
    title: "Snowboard Zen",
    thumbnail: "https://picsum.photos/seed/snowboardzen/400/300",
    category: "sports",
    iframe: "https://itch.io/embed-upload/10944619?color=333333",
    description: "Glide down serene mountainsides, pull off tricks, and chase the perfect downhill flow."
  },
  {
    id: "stellar-safari",
    title: "Stellar Safari",
    thumbnail: "https://picsum.photos/seed/stellarsafari/400/300",
    category: "adventure",
    iframe: "https://itch.io/embed-upload/10944643?color=333333",
    description: "Chart a course through alien biomes, catalog curious creatures, and become the galaxy's top explorer."
  },
  {
    id: "square-runner",
    title: "Square Runner",
    category: "Action",
    thumbnail: "https://picsum.photos/300?random=999",
    iframe: "/assets/games/square-runner/index.html",
    description: "Dodge falling obstacles and survive as long as possible in this fast-paced action game."
  }
];

if (typeof window !== "undefined") {
  window.games = games;
}
