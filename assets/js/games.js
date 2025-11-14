const games = [
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
