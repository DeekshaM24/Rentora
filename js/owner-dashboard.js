(() => {
  const listingsKey = window.RENTORA_OWNER_LISTINGS_KEY;
  const viewsKey = "rentora:owner-listing-views";
  const favoritesKey = "rentora:favorites";
  const enquiriesKey = "rentora:owner-enquiries";
  const visitsKey = "rentora:owner-visits";
  let listings = window.readRentoraOwnerListings();
  let deleteId = null;

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function readObject(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function money(value) {
    return `$${Number(value || 0).toLocaleString()}`;
  }

  function save(nextListings) {
    if (!window.writeRentoraOwnerListings(nextListings)) {
      document.querySelector("#owner-listings-empty").innerHTML = `<h3>Browser storage is full.</h3><p>Remove a listing or reduce stored property images, then try again.</p>`;
      return false;
    }
    listings = nextListings;
    return true;
  }

  function statusLabel(status) {
    return status === "active" ? "Published" : status === "paused" ? "Paused" : "Draft";
  }

  function renderMetrics() {
    const ids = new Set(listings.map((listing) => listing.id));
    const views = readObject(viewsKey);
    const favorites = readArray(favoritesKey);
    const enquiries = readArray(enquiriesKey).filter((item) => ids.has(item.propertyId) && item.status === "pending");
    const visits = readArray(visitsKey).filter((item) => ids.has(item.propertyId) && item.status === "scheduled");
    document.querySelector("#metric-total").textContent = String(listings.length);
    document.querySelector("#metric-active").textContent = String(listings.filter((listing) => listing.status === "active").length);
    document.querySelector("#metric-enquiries").textContent = String(enquiries.length);
    document.querySelector("#metric-visits").textContent = String(visits.length);
    document.querySelector("#metric-views").textContent = String([...ids].reduce((total, id) => total + Number(views[id] || 0), 0));
    document.querySelector("#metric-favorites").textContent = String(favorites.filter((id) => ids.has(id)).length);
    document.querySelector("#enquiry-count").textContent = String(enquiries.length);
    document.querySelector("#visit-count").textContent = String(visits.length);
  }

  function listingCard(listing) {
    const escape = window.escapeRentoraHtml ?? ((value) => String(value ?? ""));
    const image = listing.image || listing.gallery?.[0] || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80";
    const title = escape(listing.title || "Untitled property");
    const city = escape(listing.city || "Location not set");
    const canView = listing.status === "active";
    return `<article class="owner-listing-card" data-listing-id="${listing.id}"><a class="owner-listing-photo" href="${canView ? `property.html?id=${encodeURIComponent(listing.id)}` : `post-property.html?id=${encodeURIComponent(listing.id)}`}" aria-label="${canView ? "View" : "Edit draft"} ${title}"><img src="${escape(image)}" alt="${escape(listing.alt || listing.title || "Property image")}" loading="lazy"><span class="status-pill status-${listing.status}">${statusLabel(listing.status)}</span></a><div class="owner-listing-body"><div class="owner-listing-main"><span class="owner-listing-type">${escape(listing.type || "Property type not set")}</span><h3>${title}</h3><p>${city}</p></div><div class="owner-listing-price">${money(listing.price)} <span>/ month</span></div><div class="owner-listing-meta"><span>${listing.bedroomCount === 0 ? "Studio" : `${listing.beds || 0} bd`} · ${listing.baths || 0} ba</span><span>${Number(listing.area || 0).toLocaleString()} sq ft</span><span>${Number(readObject(viewsKey)[listing.id] || 0)} views</span></div><div class="owner-listing-actions"><a class="owner-action-link" href="post-property.html?id=${encodeURIComponent(listing.id)}">Edit</a>${listing.status === "active" ? `<button type="button" data-listing-action="pause" data-listing-id="${listing.id}">Pause</button>` : `<button type="button" class="publish-action" data-listing-action="publish" data-listing-id="${listing.id}">Publish</button>`}<button type="button" class="delete-action" data-listing-action="delete" data-listing-id="${listing.id}">Delete</button>${canView ? `<a class="owner-action-link" href="property.html?id=${encodeURIComponent(listing.id)}">View</a>` : ""}</div></div></article>`;
  }

  function renderListings() {
    const empty = document.querySelector("#owner-listings-empty");
    const list = document.querySelector("#owner-listing-list");
    empty.hidden = listings.length > 0;
    list.innerHTML = [...listings].sort((first, second) => new Date(second.updatedAt || second.postedAt || 0) - new Date(first.updatedAt || first.postedAt || 0)).map(listingCard).join("");
  }

  function renderActivity(target, entries, emptyMessage, kind) {
    const list = document.querySelector(target);
    list.innerHTML = entries.length ? entries.map((item) => {
      const listing = listings.find((property) => property.id === item.propertyId);
      return `<article class="activity-item"><div><strong>${listing?.title || "Property"}</strong><p>${item.name || (kind === "visit" ? "Visit request" : "Enquiry")}${item.date ? ` · ${item.date}` : ""}</p></div><span>${item.status}</span></article>`;
    }).join("") : `<p class="activity-empty">${emptyMessage}</p>`;
  }

  function render() {
    renderListings();
    renderMetrics();
    const ownedIds = new Set(listings.map((listing) => listing.id));
    renderActivity("#enquiry-list", readArray(enquiriesKey).filter((item) => ownedIds.has(item.propertyId) && item.status === "pending"), "No enquiries are connected yet.", "enquiry");
    renderActivity("#visit-list", readArray(visitsKey).filter((item) => ownedIds.has(item.propertyId) && item.status === "scheduled"), "No visit bookings are connected yet.", "visit");
  }

  document.querySelector("#owner-listing-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-listing-action]");
    if (!button) return;
    const { listingId, listingAction } = button.dataset;
    if (listingAction === "delete") {
      deleteId = listingId;
      const property = listings.find((listing) => listing.id === deleteId);
      document.querySelector("#delete-listing-copy").textContent = `“${property?.title || "Untitled property"}” will be removed from this browser's prototype listings.`;
      document.querySelector("#delete-listing-dialog").showModal();
      return;
    }
    const nextListings = listings.map((listing) => listing.id === listingId ? { ...listing, status: listingAction === "pause" ? "paused" : "active", updatedAt: new Date().toISOString() } : listing);
    if (save(nextListings)) render();
  });

  document.querySelector("#confirm-delete").addEventListener("click", () => {
    if (deleteId && save(listings.filter((listing) => listing.id !== deleteId))) render();
    deleteId = null;
    document.querySelector("#delete-listing-dialog").close();
  });
  document.querySelector("#cancel-delete").addEventListener("click", () => {
    deleteId = null;
    document.querySelector("#delete-listing-dialog").close();
  });
  document.querySelector("#delete-listing-dialog").addEventListener("click", (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  document.querySelector(".menu-toggle").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.setAttribute("aria-label", expanded ? "Open navigation menu" : "Close navigation menu");
    document.querySelector("#owner-navigation").classList.toggle("is-open", !expanded);
  });
  document.querySelector("#owner-navigation").addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    document.querySelector("#owner-navigation").classList.remove("is-open");
    const button = document.querySelector(".menu-toggle");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open navigation menu");
  });
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  window.addEventListener("storage", (event) => { if ([listingsKey, favoritesKey, viewsKey, enquiriesKey, visitsKey].includes(event.key)) { listings = window.readRentoraOwnerListings(); render(); } });
  render();
})();