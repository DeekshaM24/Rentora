(() => {
  const properties = window.getRentoraProperties?.() ?? window.RENTORA_PROPERTIES ?? [];
  const favoritesKey = "rentora:favorites";
  const compareKey = "rentora:compare";
  const featuredGrid = document.querySelector("#featured-grid");
  const recentGrid = document.querySelector("#recent-grid");
  const favoritesGrid = document.querySelector("#favorites-grid");
  const searchForm = document.querySelector("#property-search");
  const searchLocation = document.querySelector("#search-location");
  const searchBudget = document.querySelector("#search-budget");
  const resultsStatus = document.querySelector("#results-status");
  const favoritesMessage = document.querySelector("#favorites-message");
  const compareSummary = document.querySelector("#compare-summary");
  const compareButton = document.querySelector("#compare-button");
  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector("#primary-navigation");
  const noticeDialog = document.querySelector("#notice-dialog");
  const selectedForCompare = new Set(readComparison());
  let activeFilter = { location: "", budget: Infinity, category: "all" };
  let favorites = readFavorites();

  function readFavorites() {
    try {
      return new Set(JSON.parse(localStorage.getItem(favoritesKey) || "[]"));
    } catch {
      return new Set();
    }
  }

  function readComparison() {
    try {
      const saved = JSON.parse(localStorage.getItem(compareKey) || "[]");
      return Array.isArray(saved) ? [...new Set(saved)].filter((id) => properties.some((property) => property.id === id)).slice(0, 3) : [];
    } catch {
      return [];
    }
  }

  function saveComparison() {
    try {
      localStorage.setItem(compareKey, JSON.stringify([...selectedForCompare]));
    } catch {
      compareSummary.textContent = "Comparison changes are available for this visit only.";
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(favoritesKey, JSON.stringify([...favorites]));
    } catch {
      favoritesMessage.textContent = "Favorites are available for this visit, but this browser could not save them.";
    }
  }

  function visibleProperties() {
    const query = activeFilter.location.trim().toLowerCase();
    return properties.filter((property) => {
      const matchesLocation = !query || `${property.city} ${property.neighborhood} ${property.searchCity}`.toLowerCase().includes(query);
      const matchesBudget = property.price <= activeFilter.budget;
      const matchesCategory = activeFilter.category === "all" || property.type === activeFilter.category;
      return matchesLocation && matchesBudget && matchesCategory;
    });
  }

  function propertyCard(property) {
    const isFavorite = favorites.has(property.id);
    const isCompared = selectedForCompare.has(property.id);
    const escape = window.escapeRentoraHtml ?? ((value) => String(value ?? ""));
    const title = escape(property.title);
    return `<article class="property-card" data-property-id="${property.id}">
      <div class="property-photo"><img src="${escape(property.image)}" alt="${escape(property.alt)}" loading="lazy"><span class="property-badge">${escape(property.label)}</span>
        <button class="favorite-toggle" type="button" data-favorite="${property.id}" aria-label="${isFavorite ? "Remove" : "Save"} ${title} ${isFavorite ? "from" : "to"} favorites" aria-pressed="${isFavorite}">
          <svg viewBox="0 0 24 24" fill="${isFavorite ? "currentColor" : "none"}" aria-hidden="true"><path d="M20.8 8.9c0 4.1-8.8 10-8.8 10S3.2 13 3.2 8.9A4.2 4.2 0 0 1 7.4 4.7c1.8 0 3.3.9 4.6 2.6 1.3-1.7 2.8-2.6 4.6-2.6a4.2 4.2 0 0 1 4.2 4.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="property-info"><div class="property-topline"><span class="property-type">${escape(property.type)}</span><span class="property-rating">★ <span>${escape(property.rating || "New")}</span></span></div>
        <h3 class="property-title">${title}</h3><p class="property-location">${escape(property.city)}</p>
        <div class="property-amenities"><span><b aria-hidden="true">▢</b>${property.beds} ${property.beds === 1 ? "bed" : "beds"}</span><span><b aria-hidden="true">◒</b>${property.baths} ${property.baths === 1 ? "bath" : "baths"}</span><span><b aria-hidden="true">↗</b>${property.area} sq ft</span></div>
        <div class="property-footer"><span class="property-price">$${property.price.toLocaleString()}<small> / month</small></span><button class="compare-toggle" type="button" data-compare="${property.id}" aria-pressed="${isCompared}" aria-label="${isCompared ? "Remove" : "Add"} ${title} ${isCompared ? "from" : "to"} comparison"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 5v14m0-14L4.5 7.5M7 5l2.5 2.5M17 19V5m0 14 2.5-2.5M17 19l-2.5-2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>${isCompared ? "Added" : "Compare"}</button></div>
      </div>
    </article>`;
  }

  function renderListings() {
    const results = visibleProperties();
    const featured = results.filter((property) => property.featured);
    const recent = results.filter((property) => !property.featured);
    featuredGrid.innerHTML = featured.length ? featured.map(propertyCard).join("") : `<p class="empty-state">No featured homes match just yet. Try widening your search a little.</p>`;
    recentGrid.innerHTML = recent.length ? recent.map(propertyCard).join("") : `<p class="empty-state">No newly added homes match these filters. Try a different city or budget.</p>`;
    resultsStatus.textContent = activeFilter.location || Number.isFinite(activeFilter.budget) || activeFilter.category !== "all"
      ? `${results.length} ${results.length === 1 ? "home" : "homes"} match your search.`
      : "";
  }

  function renderFavorites() {
    const saved = properties.filter((property) => favorites.has(property.id));
    favoritesMessage.textContent = saved.length
      ? `${saved.length} ${saved.length === 1 ? "home" : "homes"} saved for later.`
      : "Save a home with the heart button and it’ll be waiting here.";
    favoritesGrid.innerHTML = saved.length
      ? saved.map(propertyCard).join("")
      : `<p class="empty-state">Your shortlist is ready when you are. Tap the heart on a home you love.</p>`;
  }

  function renderComparison() {
    const chosen = properties.filter((property) => selectedForCompare.has(property.id));
    compareSummary.innerHTML = chosen.length
      ? `${chosen.map((property) => property.title).join(" · ")} <span>${chosen.length}/3</span>`
      : `No homes selected yet <span aria-hidden="true">↗</span>`;
    compareButton.disabled = chosen.length < 2;
  }

  function updateCards() {
    renderListings();
    renderFavorites();
  }

  function openNotice(kind) {
    const notices = {
      account: ["Your Rentora account", "Account access and saved searches are planned for the next development stage. Your favorite homes are saved in this browser for now."],
      owner: ["Welcome, property owners", "Property submissions and owner accounts are planned for the next development stage. No listing or contact details have been submitted."],
      roommates: ["Roommate matching is on its way", "Profiles, compatibility matching, and messaging are planned for the next development stage. No personal information is collected here."]
    };
    const [title, message] = notices[kind] || notices.account;
    noticeDialog.classList.remove("is-comparison");
    document.querySelector("#dialog-comparison").hidden = true;
    document.querySelector("#dialog-title").textContent = title;
    document.querySelector("#dialog-message").textContent = message;
    noticeDialog.showModal();
  }

  document.addEventListener("click", (event) => {
    const favoriteButton = event.target.closest("[data-favorite]");
    if (favoriteButton) {
      const id = favoriteButton.dataset.favorite;
      favorites.has(id) ? favorites.delete(id) : favorites.add(id);
      saveFavorites();
      updateCards();
      return;
    }

    const compareControl = event.target.closest("[data-compare]");
    if (compareControl) {
      const id = compareControl.dataset.compare;
      if (selectedForCompare.has(id)) {
        selectedForCompare.delete(id);
      } else if (selectedForCompare.size < 3) {
        selectedForCompare.add(id);
      } else {
        compareSummary.textContent = "Choose up to three homes. Remove one before adding another.";
        return;
      }
      saveComparison();
      updateCards();
      renderComparison();
      return;
    }

    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) {
      activeFilter.category = categoryButton.dataset.category;
      document.querySelectorAll("[data-category]").forEach((button) => {
        const active = button === categoryButton;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      updateCards();
      document.querySelector("#featured").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const locationButton = event.target.closest("[data-location]");
    if (locationButton) {
      searchLocation.value = locationButton.dataset.location;
      searchBudget.value = "";
      activeFilter = { location: locationButton.dataset.location, budget: Infinity, category: "all" };
      document.querySelectorAll("[data-category]").forEach((button) => {
        const active = button.dataset.category === "all";
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      updateCards();
      document.querySelector("#featured").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const noticeButton = event.target.closest("[data-notice]");
    if (noticeButton) openNotice(noticeButton.dataset.notice);
  });

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    activeFilter.location = searchLocation.value;
    activeFilter.budget = searchBudget.value ? Number(searchBudget.value) : Infinity;
    activeFilter.category = "all";
    document.querySelectorAll("[data-category]").forEach((button) => {
      const active = button.dataset.category === "all";
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    updateCards();
    document.querySelector("#featured").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  compareButton.addEventListener("click", () => {
    const chosen = properties.filter((property) => selectedForCompare.has(property.id));
    const comparisonDetails = [
      ["Monthly rent", ...chosen.map((property) => `$${property.price.toLocaleString()}`)],
      ["Location", ...chosen.map((property) => property.city)],
      ["Home type", ...chosen.map((property) => property.type)],
      ["Bedrooms", ...chosen.map((property) => String(property.beds))],
      ["Bathrooms", ...chosen.map((property) => String(property.baths))],
      ["Interior", ...chosen.map((property) => `${property.area.toLocaleString()} sq ft`)],
      ["Resident rating", ...chosen.map((property) => `★ ${property.rating}`)]
    ];
    const table = document.querySelector("#dialog-comparison");
    table.innerHTML = `<table class="comparison-table"><thead><tr><th scope="col">Details</th>${chosen.map((property) => `<th scope="col">${property.title}</th>`).join("")}</tr></thead><tbody>${comparisonDetails.map(([label, ...values]) => `<tr><th scope="row">${label}</th>${values.map((value) => `<td>${value}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    table.hidden = false;
    noticeDialog.classList.add("is-comparison");
    document.querySelector("#dialog-title").textContent = "Your homes, side by side.";
    document.querySelector("#dialog-message").textContent = "Compare the details that matter before deciding what feels right.";
    noticeDialog.showModal();
  });

  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    menuToggle.setAttribute("aria-label", expanded ? "Open navigation menu" : "Close navigation menu");
    primaryNav.classList.toggle("is-open", !expanded);
  });

  primaryNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      primaryNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
    }
  });

  noticeDialog.querySelector(".dialog-dismiss").addEventListener("click", () => noticeDialog.close());
  noticeDialog.addEventListener("click", (event) => {
    if (event.target === noticeDialog) noticeDialog.close();
  });
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  updateCards();
  renderComparison();
})();