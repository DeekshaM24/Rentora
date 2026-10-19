(() => {
  const properties = window.getRentoraProperties?.() ?? window.RENTORA_PROPERTIES ?? [];
  const keys = { favorites: "rentora:favorites", compare: "rentora:compare", recent: "rentora:recently-viewed" };
  const byId = new Map(properties.map((property) => [property.id, property]));
  const searchForm = document.querySelector("#discovery-search");
  const listingGrid = document.querySelector("#listing-grid");
  const favoritesGrid = document.querySelector("#favorites-grid");
  const recentGrid = document.querySelector("#recently-viewed-grid");
  const compareSelected = document.querySelector("#compare-selected");
  const filterPanel = document.querySelector("#discovery-filters");
  const filterBackdrop = document.querySelector("#filter-backdrop");
  const filterOpen = document.querySelector("#filter-open");
  const favorites = new Set(readArray(keys.favorites));
  const compared = new Set(readArray(keys.compare).filter((id) => byId.has(id)).slice(0, 3));
  let recentlyViewed = readArray(keys.recent).filter((id) => byId.has(id));
  const search = { location: "", minRent: "", maxRent: "", bedrooms: "", type: "" };

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function save(key, values) {
    try {
      localStorage.setItem(key, JSON.stringify(values));
    } catch {
      document.querySelector("#results-status").textContent = "Changes are saved for this visit only.";
    }
  }

  function currency(value) {
    return `$${Number(value).toLocaleString()}`;
  }

  function bedroomCount(property) {
    return property.bedroomCount ?? property.beds;
  }

  function fillTypeOptions() {
    const types = [...new Set(properties.map((property) => property.type))].sort();
    [document.querySelector("#search-type"), document.querySelector("#filter-type")].forEach((select) => {
      select.insertAdjacentHTML("beforeend", types.map((type) => `<option value="${type}">${type}</option>`).join(""));
    });
    const amenities = [...new Set(properties.flatMap((property) => property.amenities ?? []))].sort();
    document.querySelector("#amenity-options").innerHTML = amenities.map((amenity) => `<label><input type="checkbox" value="${amenity}"> ${amenity}</label>`).join("");
  }

  function currentFilters() {
    const checked = (selector) => [...document.querySelectorAll(`${selector} input:checked`)].map((input) => input.value);
    return {
      location: search.location.trim().toLowerCase(),
      minRent: Number(search.minRent) || 0,
      maxRent: Number(search.maxRent) || Infinity,
      bedrooms: search.bedrooms === "" ? null : Number(search.bedrooms),
      type: search.type,
      filterMin: Number(document.querySelector("#filter-min-rent").value) || 0,
      filterMax: Number(document.querySelector("#filter-max-rent").value) || Infinity,
      filterBedrooms: document.querySelector("#filter-bedrooms").value,
      bathrooms: Number(document.querySelector("#filter-bathrooms").value) || 0,
      furnishing: checked("#furnishing-options"),
      filterType: document.querySelector("#filter-type").value,
      amenities: checked("#amenity-options")
    };
  }

  function matches(property, filters) {
    const location = `${property.city} ${property.neighborhood} ${property.searchCity}`.toLowerCase();
    const minRent = Math.max(filters.minRent, filters.filterMin);
    const maxRent = Math.min(filters.maxRent, filters.filterMax);
    const bedroomThreshold = filters.filterBedrooms === "" ? filters.bedrooms : Number(filters.filterBedrooms);
    const bedroomMatch = bedroomThreshold === null || (bedroomThreshold === 0 ? bedroomCount(property) === 0 : bedroomCount(property) >= bedroomThreshold);
    return (!filters.location || location.includes(filters.location)) && property.price >= minRent && property.price <= maxRent && bedroomMatch && property.baths >= filters.bathrooms && (!filters.type || property.type === filters.type) && (!filters.filterType || property.type === filters.filterType) && (!filters.furnishing.length || filters.furnishing.includes(property.furnishing)) && filters.amenities.every((amenity) => (property.amenities ?? []).includes(amenity));
  }

  function sorted(list) {
    const sort = document.querySelector("#sort-listings").value;
    return [...list].sort((first, second) => {
      if (sort === "price-asc") return first.price - second.price;
      if (sort === "price-desc") return second.price - first.price;
      if (sort === "rating") return (Number(second.rating) || 0) - (Number(first.rating) || 0);
      return new Date(second.postedAt) - new Date(first.postedAt);
    });
  }

  function emptyState(title, message, action = "") {
    return `<div class="empty-state"><h3>${title}</h3><p>${message}</p>${action}</div>`;
  }

  function propertyCard(property) {
    const isFavorite = favorites.has(property.id);
    const isCompared = compared.has(property.id);
    const escape = window.escapeRentoraHtml ?? ((value) => String(value ?? ""));
    const title = escape(property.title);
    return `<article class="property-card listing-card" data-property-id="${property.id}">
      <div class="property-photo"><img src="${escape(property.image)}" alt="${escape(property.alt)}" loading="lazy"><span class="property-badge">${escape(property.label)}</span><button class="favorite-toggle" type="button" data-favorite="${property.id}" aria-label="${isFavorite ? "Remove" : "Save"} ${title} ${isFavorite ? "from" : "to"} favorites" aria-pressed="${isFavorite}"><svg viewBox="0 0 24 24" fill="${isFavorite ? "currentColor" : "none"}" aria-hidden="true"><path d="M20.8 8.9c0 4.1-8.8 10-8.8 10S3.2 13 3.2 8.9A4.2 4.2 0 0 1 7.4 4.7c1.8 0 3.3.9 4.6 2.6 1.3-1.7 2.8-2.6 4.6-2.6a4.2 4.2 0 0 1 4.2 4.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button></div>
      <div class="property-info"><div class="property-topline"><span class="property-type">${escape(property.type)}</span><span class="property-rating">★ <span>${escape(property.rating || "New")}</span></span></div><h3 class="property-title">${title}</h3><p class="property-location">${escape(property.city)}</p>
        <div class="property-amenities"><span><b aria-hidden="true">⌂</b>${bedroomCount(property) === 0 ? "Studio" : `${bedroomCount(property)} ${bedroomCount(property) === 1 ? "bed" : "beds"}`}</span><span><b aria-hidden="true">◒</b>${property.baths} ${property.baths === 1 ? "bath" : "baths"}</span><span><b aria-hidden="true">↗</b>${property.area.toLocaleString()} sq ft</span></div>
        <div class="listing-extra"><span>Deposit <strong>${currency(property.deposit)}</strong></span><span><strong>${escape(property.furnishing)}</strong></span></div><div class="listing-amenities">${(property.amenities ?? []).slice(0, 3).map((amenity) => `<span>${escape(amenity)}</span>`).join("")}</div>
        <div class="property-footer"><span class="property-price">${currency(property.price)}<small> / month</small></span></div><div class="property-actions"><button class="compare-toggle" type="button" data-compare="${property.id}" aria-pressed="${isCompared}" aria-label="${isCompared ? "Remove" : "Add"} ${title} ${isCompared ? "from" : "to"} comparison"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 5v14m0-14L4.5 7.5M7 5l2.5 2.5M17 19V5m0 14 2.5-2.5M17 19l-2.5-2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>${isCompared ? "Added" : "Compare"}</button><a class="details-button" href="property.html?id=${encodeURIComponent(property.id)}">View details</a></div>
      </div></article>`;
  }

  function renderListings() {
    const filters = currentFilters();
    const filtered = sorted(properties.filter((property) => matches(property, filters)));
    const activeCount = Number(Boolean(filters.location)) + Number(Boolean(filters.minRent || filters.filterMin)) + Number(Number.isFinite(filters.maxRent) || Number.isFinite(filters.filterMax)) + Number(filters.bedrooms !== null) + Number(Boolean(filters.filterBedrooms)) + Number(Boolean(filters.bathrooms)) + Number(Boolean(filters.type || filters.filterType)) + filters.furnishing.length + filters.amenities.length;
    document.querySelector("#results-status").textContent = `${filtered.length} ${filtered.length === 1 ? "home" : "homes"} found`;
    document.querySelector("#active-filter-count").textContent = String(activeCount);
    listingGrid.innerHTML = filtered.length ? filtered.map(propertyCard).join("") : emptyState("No homes found just yet.", "Try a different neighborhood or loosen a couple of filters to see more possibilities.", `<button class="empty-state-action" type="button" data-reset-filters>Clear filters</button>`);
  }

  function renderFavorites() {
    const saved = sorted(properties.filter((property) => favorites.has(property.id)));
    document.querySelector("#favorite-count").textContent = String(saved.length);
    document.querySelector("#favorites-section-count").textContent = `${saved.length} saved`;
    favoritesGrid.innerHTML = saved.length ? saved.map(propertyCard).join("") : emptyState("Your shortlist starts here.", "Save a home with the heart button and it will be waiting for you here.", `<a class="empty-state-action" href="#listing-results">Explore homes</a>`);
  }

  function renderRecentlyViewed() {
    recentlyViewed = recentlyViewed.filter((id) => byId.has(id));
    const viewed = recentlyViewed.map((id) => byId.get(id));
    const section = document.querySelector("#recently-viewed-section");
    section.hidden = !viewed.length;
    recentGrid.innerHTML = viewed.map(propertyCard).join("");
  }

  function renderCompare() {
    const chosen = [...compared].map((id) => byId.get(id)).filter(Boolean);
    document.querySelector("#compare-count").textContent = String(chosen.length);
    document.querySelector("#compare-button").disabled = chosen.length < 2;
    compareSelected.innerHTML = chosen.length ? chosen.map((property) => `<div class="compare-chip"><span>${property.title} · ${currency(property.price)}/mo</span><button type="button" data-remove-compare="${property.id}" aria-label="Remove ${property.title} from comparison">×</button></div>`).join("") : `<div class="compare-empty">No homes selected yet. Add up to three listings to compare them here.</div>`;
  }

  function renderAll() {
    renderListings();
    renderFavorites();
    renderRecentlyViewed();
    renderCompare();
  }

  function updateSearchState() {
    const formData = new FormData(searchForm);
    Object.assign(search, Object.fromEntries(["location", "minRent", "maxRent", "bedrooms", "type"].map((key) => [key, String(formData.get(key) ?? "")])));
    document.querySelector("#filter-min-rent").value = search.minRent;
    document.querySelector("#filter-max-rent").value = search.maxRent;
    document.querySelector("#filter-bedrooms").value = search.bedrooms;
    document.querySelector("#filter-type").value = search.type;
    renderAll();
  }

  function resetFilters() {
    searchForm.reset();
    document.querySelector("#filter-min-rent").value = "";
    document.querySelector("#filter-max-rent").value = "";
    document.querySelector("#filter-bedrooms").value = "";
    document.querySelector("#filter-bathrooms").value = "";
    document.querySelector("#filter-type").value = "";
    document.querySelectorAll("#furnishing-options input, #amenity-options input").forEach((input) => { input.checked = false; });
    Object.assign(search, { location: "", minRent: "", maxRent: "", bedrooms: "", type: "" });
    renderAll();
  }

  function setFilterDrawer(open) {
    filterPanel.classList.toggle("is-open", open);
    filterBackdrop.classList.toggle("is-open", open);
    filterOpen.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("filters-open", open);
    (open ? document.querySelector("#filter-close") : filterOpen).focus();
  }

  function showComparison() {
    const chosen = [...compared].map((id) => byId.get(id)).filter(Boolean);
    if (chosen.length < 2) return;
    const fields = [
      ["Monthly rent", (property) => currency(property.price)], ["Security deposit", (property) => currency(property.deposit)],
      ["Location", (property) => property.city], ["Property type", (property) => property.type],
      ["Bedrooms", (property) => bedroomCount(property) === 0 ? "Studio" : bedroomCount(property)], ["Bathrooms", (property) => property.baths],
      ["Property size", (property) => `${property.area.toLocaleString()} sq ft`], ["Furnishing", (property) => property.furnishing],
      ["Amenities", (property) => property.amenities.join(", ")], ["Rating", (property) => `★ ${property.rating}`]
    ];
    document.querySelector("#comparison-table-wrap").innerHTML = `<table class="comparison-table"><thead><tr><th scope="col">Details</th>${chosen.map((property) => `<th scope="col">${property.title}</th>`).join("")}</tr></thead><tbody>${fields.map(([label, value]) => `<tr><th scope="row">${label}</th>${chosen.map((property) => `<td>${value(property)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    document.querySelector("#comparison-dialog").showModal();
  }

  document.addEventListener("click", (event) => {
    const favoriteButton = event.target.closest("[data-favorite]");
    if (favoriteButton) {
      const id = favoriteButton.dataset.favorite;
      favorites.has(id) ? favorites.delete(id) : favorites.add(id);
      save(keys.favorites, [...favorites]);
      renderAll();
      return;
    }
    const compareButton = event.target.closest("[data-compare]");
    if (compareButton) {
      const id = compareButton.dataset.compare;
      if (compared.has(id)) compared.delete(id);
      else if (compared.size < 3) compared.add(id);
      else {
        document.querySelector("#results-status").textContent = "Comparison is limited to three homes.";
        return;
      }
      save(keys.compare, [...compared]);
      renderAll();
      return;
    }
    const removeCompare = event.target.closest("[data-remove-compare]");
    if (removeCompare) {
      compared.delete(removeCompare.dataset.removeCompare);
      save(keys.compare, [...compared]);
      renderAll();
      return;
    }
    if (event.target.closest("[data-reset-filters]")) resetFilters();
  });

  searchForm.addEventListener("submit", (event) => { event.preventDefault(); updateSearchState(); });
  document.querySelector("#sort-listings").addEventListener("change", renderListings);
  document.querySelector("#discovery-filters").addEventListener("change", renderListings);
  document.querySelector("#discovery-filters").addEventListener("input", (event) => { if (event.target.matches('input[type="number"]')) renderListings(); });
  document.querySelector("#filter-reset").addEventListener("click", resetFilters);
  document.querySelector("#filter-open").addEventListener("click", () => setFilterDrawer(true));
  document.querySelector("#filter-close").addEventListener("click", () => setFilterDrawer(false));
  filterBackdrop.addEventListener("click", () => setFilterDrawer(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && filterPanel.classList.contains("is-open")) setFilterDrawer(false);
  });
  document.querySelector("#compare-button").addEventListener("click", showComparison);
  document.querySelector("#clear-recent").addEventListener("click", () => { recentlyViewed = []; save(keys.recent, recentlyViewed); renderRecentlyViewed(); });
  document.querySelector(".menu-toggle").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.setAttribute("aria-label", expanded ? "Open navigation menu" : "Close navigation menu");
    document.querySelector("#primary-navigation").classList.toggle("is-open", !expanded);
  });
  document.querySelector("#primary-navigation").addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    document.querySelector("#primary-navigation").classList.remove("is-open");
    const button = document.querySelector(".menu-toggle");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open navigation menu");
  });
  document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));
  document.querySelector("#current-year").textContent = new Date().getFullYear();

  fillTypeOptions();
  renderAll();
})();