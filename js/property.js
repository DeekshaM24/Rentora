(() => {
  const properties = window.getRentoraProperties?.() ?? window.RENTORA_PROPERTIES ?? [];
  const propertyId = new URLSearchParams(window.location.search).get("id");
  const property = properties.find((item) => item.id === propertyId);
  const details = window.RENTORA_PROPERTY_DETAILS?.[propertyId] ?? { fees: property?.fees ?? [], rules: property?.rules ?? [], owner: property?.owner };
  const galleryImages = property ? (property.gallery?.length ? property.gallery : [...new Set([property.image, ...properties.map((item) => item.image).filter(Boolean)])]).slice(0, 5) : [];
  const favoritesKey = "rentora:favorites";
  const compareKey = "rentora:compare";
  const recentKey = "rentora:recently-viewed";
  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector("#property-navigation");
  let activeImage = 0;
  let favorites = readIds(favoritesKey);
  let compared = readIds(compareKey).filter((id) => properties.some((item) => item.id === id)).slice(0, 3);

  function readIds(key) {
    try {
      const ids = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  }

  function saveIds(key, ids) {
    try {
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      announce("Your browser could not save this change. It will be available for this visit only.");
    }
  }

  function money(amount) {
    return `$${Number(amount || 0).toLocaleString()}`;
  }

  function bedroomCount(item) {
    return item.bedroomCount ?? item.beds;
  }

  function announce(message) {
    const status = document.querySelector("#property-action-status");
    if (status) status.textContent = message;
  }

  function setGallery(index) {
    activeImage = (index + galleryImages.length) % galleryImages.length;
    const image = galleryImages[activeImage];
    const alt = activeImage === 0 ? property.alt : `Representative Rentora demo property image ${activeImage + 1}`;
    document.querySelector("#gallery-main-image").src = image;
    document.querySelector("#gallery-main-image").alt = alt;
    document.querySelector("#gallery-count").textContent = `${activeImage + 1} / ${galleryImages.length}`;
    document.querySelector("#lightbox-image").src = image;
    document.querySelector("#lightbox-image").alt = alt;
    document.querySelector("#lightbox-caption").textContent = `${property.title} · ${activeImage + 1} of ${galleryImages.length}`;
    document.querySelectorAll("[data-gallery-index]").forEach((button) => {
      const selected = Number(button.dataset.galleryIndex) === activeImage;
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function renderGallery() {
    document.querySelector("#gallery-thumbnails").innerHTML = galleryImages.map((image, index) => `<button type="button" class="gallery-thumb" data-gallery-index="${index}" aria-label="Show photo ${index + 1}" aria-pressed="${index === 0}"><img src="${image}" alt="" loading="lazy"></button>`).join("");
    setGallery(0);
  }

  function renderOwner() {
    const owner = details.owner ?? { name: "Rentora host", initials: "RH", role: "Property contact", since: "Member profile", verified: false };
    document.querySelector("#owner-avatar").textContent = owner.initials ?? owner.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2);
    document.querySelector("#owner-name").textContent = owner.name;
    document.querySelector("#owner-role").textContent = owner.role;
    document.querySelector("#owner-since").textContent = owner.since;
    const badge = document.querySelector("#verification-badge");
    badge.textContent = owner.verified ? "Identity verified · demo" : "Not verified";
    badge.classList.toggle("is-verified", Boolean(owner.verified));
  }

  function renderCosts() {
    const fees = Array.isArray(details.fees) ? details.fees : [];
    const disclosedFees = fees.reduce((total, fee) => total + Number(fee.amount || 0), 0);
    const total = Number(property.price || 0) + Number(property.deposit || 0) + disclosedFees;
    const rows = [
      ["First month's rent", property.price],
      ["Security deposit", property.deposit],
      ...fees.map((fee) => [fee.label, fee.amount])
    ];
    if (!fees.length) rows.push(["Disclosed fees", 0]);
    document.querySelector("#cost-lines").innerHTML = rows.map(([label, amount], index) => `<div class="cost-line"><span><b class="cost-operator">${index ? "+" : ""}</b>${label}</span><strong>${money(amount)}</strong></div>`).join("");
    document.querySelector("#cost-total").textContent = money(total);
    document.querySelector("#cost-caveat").textContent = fees.length ? "Estimate includes the fees disclosed here; other move-in charges may apply." : "No additional fees are disclosed in this demo listing. Other charges may apply; confirm with the owner.";
  }

  function renderSimilar() {
    const alternatives = properties.filter((item) => item.id !== property.id && (item.searchCity === property.searchCity || item.type === property.type)).slice(0, 3);
    const escape = window.escapeRentoraHtml ?? ((value) => String(value ?? ""));
    document.querySelector("#similar-properties").innerHTML = alternatives.map((item) => `<article class="similar-card"><a class="similar-image" href="property.html?id=${encodeURIComponent(item.id)}"><img src="${escape(item.image)}" alt="${escape(item.alt)}" loading="lazy"></a><div class="similar-card-copy"><div class="similar-card-topline"><span>${escape(item.type)}</span><span>★ ${escape(item.rating || "New")}</span></div><h3><a href="property.html?id=${encodeURIComponent(item.id)}">${escape(item.title)}</a></h3><p>${escape(item.city)}</p><strong>${money(item.price)}<small> / month</small></strong></div></article>`).join("");
  }

  function updateFavorite() {
    const selected = favorites.includes(property.id);
    const button = document.querySelector("#favorite-button");
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute("aria-label", selected ? "Remove this property from favorites" : "Save this property to favorites");
    button.querySelector("span").textContent = selected ? "Saved" : "Save";
    button.querySelector("svg").setAttribute("fill", selected ? "currentColor" : "none");
  }

  function updateCompare() {
    const selected = compared.includes(property.id);
    const button = document.querySelector("#compare-button");
    button.setAttribute("aria-pressed", String(selected));
    button.querySelector("span").textContent = selected ? "Added to compare" : "Add to compare";
  }

  function renderProperty() {
    document.title = `${property.title} | Rentora`;
    document.querySelector("#breadcrumb-property").textContent = property.title;
    document.querySelector("#property-type").textContent = property.type;
    document.querySelector("#property-rating").textContent = property.rating;
    document.querySelector("#property-title").textContent = property.title;
    document.querySelector("#property-location").textContent = property.city;
    document.querySelector("#monthly-rent").textContent = money(property.price);
    document.querySelector("#overview-address").textContent = property.city;
    document.querySelector("#overview-facts").innerHTML = [
      [bedroomCount(property) === 0 ? "Studio" : `${bedroomCount(property)} ${bedroomCount(property) === 1 ? "bedroom" : "bedrooms"}`, "⌂"],
      [`${property.baths} ${property.baths === 1 ? "bathroom" : "bathrooms"}`, "◒"],
      [`${Number(property.area).toLocaleString()} sq ft`, "↗"],
      [property.furnishing, "◇"]
    ].map(([value, symbol]) => `<div><span aria-hidden="true">${symbol}</span>${value}</div>`).join("");
    document.querySelector("#property-description").textContent = property.description;
    document.querySelector("#property-amenities").innerHTML = property.amenities.map((amenity) => `<span class="amenity-item"><span aria-hidden="true">✓</span>${amenity}</span>`).join("");
    const rules = Array.isArray(details.rules) ? details.rules : ["Confirm property rules with the owner before applying."];
    const escape = window.escapeRentoraHtml ?? ((value) => String(value ?? ""));
    document.querySelector("#property-rules").innerHTML = rules.map((rule) => `<li>${escape(rule)}</li>`).join("");
    document.querySelector("#available-date").textContent = property.available || "Ask owner";
    document.querySelector("#contact-owner").href = `contact-owner.html?property=${encodeURIComponent(property.id)}`;
    document.querySelector("#schedule-visit").href = `contact-owner.html?property=${encodeURIComponent(property.id)}&visit=1`;
    document.querySelector("#current-year").textContent = new Date().getFullYear();
    renderGallery();
    renderOwner();
    renderCosts();
    renderSimilar();
    updateFavorite();
    updateCompare();
    const recent = readIds(recentKey).filter((id) => id !== property.id);
    saveIds(recentKey, [property.id, ...recent].slice(0, 6));
    if (property.ownerListing) {
      try {
        const viewCounts = JSON.parse(localStorage.getItem("rentora:owner-listing-views") || "{}");
        viewCounts[property.id] = Number(viewCounts[property.id] || 0) + 1;
        localStorage.setItem("rentora:owner-listing-views", JSON.stringify(viewCounts));
      } catch {
      }
    }
  }

  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    menuToggle.setAttribute("aria-label", expanded ? "Open navigation menu" : "Close navigation menu");
    primaryNav.classList.toggle("is-open", !expanded);
  });
  primaryNav.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    primaryNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  });

  if (!property) {
    document.title = "Property not found | Rentora";
    document.querySelector(".property-container").innerHTML = `<section class="property-missing"><p class="eyebrow"><span class="eyebrow-line"></span> Rentora homes</p><h1>This home could not be found.</h1><p>It may have been removed or the link may be incomplete.</p><a class="button button-primary" href="listings.html">Explore available homes</a></section>`;
    return;
  }

  document.querySelector("#gallery-thumbnails").addEventListener("click", (event) => {
    const button = event.target.closest("[data-gallery-index]");
    if (button) setGallery(Number(button.dataset.galleryIndex));
  });
  document.querySelector("#gallery-previous").addEventListener("click", () => setGallery(activeImage - 1));
  document.querySelector("#gallery-next").addEventListener("click", () => setGallery(activeImage + 1));
  document.querySelector("#gallery-open").addEventListener("click", () => document.querySelector("#gallery-lightbox").showModal());
  document.querySelector("#lightbox-close").addEventListener("click", () => document.querySelector("#gallery-lightbox").close());
  document.querySelector("#lightbox-previous").addEventListener("click", () => setGallery(activeImage - 1));
  document.querySelector("#lightbox-next").addEventListener("click", () => setGallery(activeImage + 1));
  document.querySelector("#gallery-lightbox").addEventListener("click", (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  document.addEventListener("keydown", (event) => {
    if (!document.querySelector("#gallery-lightbox").open) return;
    if (event.key === "ArrowLeft") setGallery(activeImage - 1);
    if (event.key === "ArrowRight") setGallery(activeImage + 1);
  });
  document.querySelector("#favorite-button").addEventListener("click", () => {
    favorites = favorites.includes(property.id) ? favorites.filter((id) => id !== property.id) : [...favorites, property.id];
    saveIds(favoritesKey, favorites);
    updateFavorite();
    announce(favorites.includes(property.id) ? "Saved to your favorites." : "Removed from your favorites.");
  });
  document.querySelector("#compare-button").addEventListener("click", () => {
    if (compared.includes(property.id)) compared = compared.filter((id) => id !== property.id);
    else if (compared.length < 3) compared = [...compared, property.id];
    else {
      announce("Compare is limited to three homes. Remove one from your comparison first.");
      return;
    }
    saveIds(compareKey, compared);
    updateCompare();
    announce(compared.includes(property.id) ? "Added to your comparison." : "Removed from your comparison.");
  });
  document.querySelector("#report-listing").addEventListener("click", () => document.querySelector("#report-dialog").showModal());
  document.querySelector("#report-form").addEventListener("submit", (event) => {
    event.preventDefault();
    document.querySelector("#report-status").textContent = "No report has been submitted. This prototype does not send reports.";
  });
  document.querySelectorAll(".report-dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));

  renderProperty();
})();