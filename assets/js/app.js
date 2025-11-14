(function () {
  const gameData = Array.isArray(window.games) ? window.games : [];
  const page = document.body ? document.body.dataset.page : "";

  const currentYearEl = document.getElementById("current-year");
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }

  const createGameCard = (game) => {
    const card = document.createElement("article");
    card.className = "game-card";
    card.setAttribute("role", "listitem");
    card.innerHTML = `
      <a class="game-card__link" href="game.html?id=${encodeURIComponent(game.id)}" aria-label="Play ${game.title}">
        <div class="game-card__thumb">
          <img src="${game.thumbnail}" alt="${game.title} thumbnail" loading="lazy" />
        </div>
        <div class="game-card__body">
          <h3 class="game-card__title">${game.title}</h3>
          <p class="game-card__category">${formatCategory(game.category)}</p>
        </div>
      </a>
    `;
    return card;
  };

  const formatCategory = (category) => {
    if (!category) return "";
    return category
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const renderGameGrid = (gamesToRender, container) => {
    if (!container) return;
    container.innerHTML = "";

    if (!gamesToRender.length) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.innerHTML = `
        <h3>No games found</h3>
        <p>Try adjusting your filters or searching for a different title.</p>
      `;
      container.appendChild(emptyState);
      return;
    }

    const fragment = document.createDocumentFragment();
    gamesToRender.forEach((game) => {
      fragment.appendChild(createGameCard(game));
    });
    container.appendChild(fragment);
  };

  if (page === "home") {
    initHomePage();
  }

  if (page === "game") {
    initGamePage();
  }

  function initHomePage() {
    const grid = document.getElementById("game-grid");
    const searchInput = document.getElementById("search-input");
    const categoryButtons = Array.from(document.querySelectorAll(".category-btn"));
    const resultsCount = document.getElementById("results-count");

    let activeCategory = "all";
    let searchTerm = "";

    const applyFilters = () => {
      const filtered = gameData.filter((game) => {
        const matchesCategory =
          activeCategory === "all" || game.category === activeCategory;
        const matchesSearch = game.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      });

      renderGameGrid(filtered, grid);
      if (resultsCount) {
        resultsCount.textContent = `${filtered.length} game${
          filtered.length === 1 ? "" : "s"
        } available`;
      }
    };

    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        searchTerm = event.target.value.trim();
        applyFilters();
      });
    }

    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category || "all";
        categoryButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        applyFilters();
      });
    });

    renderGameGrid(gameData, grid);
    if (resultsCount) {
      resultsCount.textContent = `${gameData.length} games available`;
    }
  }

  function initGamePage() {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("id");
    const titleEl = document.getElementById("game-title");
    const descriptionEl = document.getElementById("game-description");
    const categoryEl = document.getElementById("game-category");
    const iframeEl = document.getElementById("game-iframe");
    const breadcrumbGame = document.getElementById("breadcrumb-game");
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    const relatedGrid = document.getElementById("related-grid");

    if (!gameId) {
      showMissingGameState();
      return;
    }

    const game = gameData.find((item) => item.id === gameId);
    if (!game) {
      showMissingGameState();
      return;
    }

    if (titleEl) titleEl.textContent = game.title;
    if (descriptionEl) descriptionEl.textContent = game.description;
    if (categoryEl)
      categoryEl.textContent = `${formatCategory(game.category)} Game`;
    if (breadcrumbGame) breadcrumbGame.textContent = game.title;
    if (iframeEl) {
      iframeEl.src = game.iframe;
    }

    if (fullscreenBtn && iframeEl) {
      fullscreenBtn.addEventListener("click", () => {
        const player = iframeEl.parentElement;
        if (!player) return;

        if (!document.fullscreenElement) {
          player.requestFullscreen?.().then(() => {
            fullscreenBtn.textContent = "Exit Fullscreen";
          }).catch(() => {});
        } else {
          document.exitFullscreen?.();
        }
      });

      document.addEventListener("fullscreenchange", () => {
        if (fullscreenBtn) {
          const isFullscreen = Boolean(document.fullscreenElement);
          fullscreenBtn.textContent = isFullscreen
            ? "Exit Fullscreen"
            : "Enter Fullscreen";
        }
      });
    }

    const relatedGames = gameData.filter(
      (item) => item.category === game.category && item.id !== game.id
    );

    renderGameGrid(relatedGames.slice(0, 6), relatedGrid);
  }

  function showMissingGameState() {
    const main = document.querySelector(".site-main");
    if (!main) return;
    main.innerHTML = `
      <section class="missing-game">
        <h1>Game not found</h1>
        <p>We couldn't locate the game you're looking for. Try exploring other titles on the <a href="index.html">homepage</a>.</p>
      </section>
    `;
  }
})();
