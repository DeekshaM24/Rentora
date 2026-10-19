(() => {
  const properties = window.getRentoraProperties?.() ?? window.RENTORA_PROPERTIES ?? [];
  const propertyDetails = window.RENTORA_PROPERTY_DETAILS ?? {};
  const compareKey = "rentora:compare";
  const table = document.querySelector("#comparison-table");
  const results = document.querySelector("#comparison-results");
  const emptyState = document.querySelector("#comparison-empty");
  const clearButton = document.querySelector("#clear-comparison");
  const propertyById = new Map(properties.map((property) => [property.id, property]));

  function readSelection() {
    try {
      const stored = JSON.parse(localStorage.getItem(compareKey) || "[]");
      return Array.isArray(stored) ? [...new Set(stored)].filter((id) => propertyById.has(id)).slice(0, 3) : [];
    } catch {
      return [];
    }
  }

  let selectedIds = readSelection();

  function writeSelection() {
    try {
      localStorage.setItem(compareKey, JSON.stringify(selectedIds));
    } catch {
      document.querySelector("#compare-count").textContent = `${selectedIds.length} of 3 selected · changes are for this visit only`;
    }
  }

  function currency(amount) {
    return `$${Number(amount || 0).toLocaleString()}`;
  }

  function bedroomCount(property) {
    return property.bedroomCount ?? property.beds;
  }

  function moveInCost(property) {
    const fees = propertyDetails[property.id]?.fees ?? [];
    return Number(property.price || 0) + Number(property.deposit || 0) + fees.reduce((total, fee) => total + Number(fee.amount || 0), 0);
  }

  function rowsFor(propertiesToCompare) {
    return [
      ["Location", (property) => property.city],
      ["Monthly rent", (property) => `${currency(property.price)} / month`],
      ["Security deposit", (property) => currency(property.deposit)],
      ["Estimated move-in cost", (property) => currency(moveInCost(property))],
      ["Bedrooms", (property) => bedroomCount(property) === 0 ? "Studio" : `${bedroomCount(property)} ${bedroomCount(property) === 1 ? "bedroom" : "bedrooms"}`],
      ["Bathrooms", (property) => `${property.baths} ${property.baths === 1 ? "bathroom" : "bathrooms"}`],
      ["Area", (property) => `${Number(property.area).toLocaleString()} sq ft`],
      ["Furnishing", (property) => property.furnishing],
      ["Property type", (property) => property.type],
      ["Amenities", (property) => (property.amenities ?? []).join(", ") || "Not listed"],
      ["Rating", (property) => `★ ${property.rating}`],
      ["Available from", (property) => property.available || "Ask owner"]
    ].map(([label, value]) => ({ label, values: propertiesToCompare.map(value) }));
  }

  function render() {
    const selected = selectedIds.map((id) => propertyById.get(id)).filter(Boolean);
    const escape = window.escapeRentoraHtml ?? ((value) => String(value ?? ""));
    selectedIds = selected.map((property) => property.id);
    table.dataset.columns = String(selected.length);
    document.querySelector("#compare-count").textContent = `${selected.length} of 3 selected`;
    clearButton.disabled = selected.length === 0;
    emptyState.hidden = selected.length > 0;
    results.hidden = selected.length === 0;

    if (!selected.length) {
      table.tHead.innerHTML = "";
      table.tBodies[0].innerHTML = "";
      return;
    }

    table.tHead.innerHTML = `<tr><th class="comparison-label-heading" scope="col">Property details</th>${selected.map((property) => `<th class="comparison-property-heading" scope="col"><article class="compare-property"><a class="compare-property-image" href="property.html?id=${encodeURIComponent(property.id)}" aria-label="View ${escape(property.title)}"><img src="${escape(property.image)}" alt="${escape(property.alt)}" loading="lazy"></a><div class="compare-property-copy"><span class="property-type">${escape(property.type)}</span><h2>${escape(property.title)}</h2><p>${escape(property.city)}</p><a class="button button-small button-outline view-property" href="property.html?id=${encodeURIComponent(property.id)}">View property <span aria-hidden="true">↗</span></a><button class="remove-property" type="button" data-remove-property="${property.id}" aria-label="Remove ${escape(property.title)} from comparison">Remove</button></div></article></th>`).join("")}</tr>`;

    table.tBodies[0].innerHTML = rowsFor(selected).map((row) => {
      const differs = new Set(row.values.map((value) => String(value).trim().toLowerCase())).size > 1;
      return `<tr><th scope="row">${row.label}</th>${row.values.map((value) => `<td class="${differs ? "is-different" : ""}">${escape(value)}${differs ? `<span class="difference-label">Different</span>` : ""}</td>`).join("")}</tr>`;
    }).join("");
  }

  table.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-property]");
    if (!removeButton) return;
    selectedIds = selectedIds.filter((id) => id !== removeButton.dataset.removeProperty);
    writeSelection();
    render();
  });

  clearButton.addEventListener("click", () => {
    selectedIds = [];
    writeSelection();
    render();
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== compareKey) return;
    selectedIds = readSelection();
    render();
  });

  document.querySelector(".menu-toggle").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.setAttribute("aria-label", expanded ? "Open navigation menu" : "Close navigation menu");
    document.querySelector("#compare-navigation").classList.toggle("is-open", !expanded);
  });
  document.querySelector("#compare-navigation").addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    document.querySelector("#compare-navigation").classList.remove("is-open");
    const button = document.querySelector(".menu-toggle");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open navigation menu");
  });
  document.querySelector("#current-year").textContent = new Date().getFullYear();

  writeSelection();
  render();
})();