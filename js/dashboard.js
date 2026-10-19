(() => {
  const properties = window.getRentoraProperties?.() ?? window.RENTORA_PROPERTIES ?? [];
  const roommates = window.RENTORA_ROOMMATES ?? [];
  const propertyById = new Map(properties.map((property) => [property.id, property]));
  const roommateById = new Map(roommates.map((roommate) => [roommate.id, roommate]));
  const keys = {
    favorites: "rentora:favorites",
    requests: "rentora:roommate-requests",
    communications: window.RENTORA_COMMUNICATIONS_KEY
  };

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function dateAfter(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function statusBadge(status) {
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";
    return `<span class="status-badge status-${escape(status || "pending")}">${escape(label)}</span>`;
  }

  function seedFavorites() {
    const stored = readJson(keys.favorites, null);
    if (Array.isArray(stored)) return stored.filter((id) => propertyById.has(id));
    const ids = ["willow-house", "the-goodwin"].filter((id) => propertyById.has(id));
    writeJson(keys.favorites, ids);
    return ids;
  }

  function seedRoommateRequests() {
    const stored = readJson(keys.requests, null);
    if (Array.isArray(stored)) return stored;
    const examples = [
      { id: "demo-request-avery", roommateId: "avery-bennett", direction: "incoming", status: "pending", demo: true },
      { id: "demo-request-jamie", roommateId: "jamie-okafor", direction: "incoming", status: "pending", demo: true }
    ].filter((request) => roommateById.has(request.roommateId));
    writeJson(keys.requests, examples);
    return examples;
  }

  let favorites = seedFavorites();
  let communications = window.getRentoraCommunications();
  let requests = seedRoommateRequests();

  function renderSavedProperties() {
    const list = document.querySelector("#saved-property-list");
    const saved = favorites.map((id) => propertyById.get(id)).filter(Boolean);
    document.querySelector("#saved-count").textContent = String(saved.length);
    document.querySelector("#saved-nav-badge").textContent = String(saved.length);
    list.innerHTML = saved.length ? saved.map((property) => `<article class="saved-home-row"><a class="saved-home-image" href="property.html?id=${encodeURIComponent(property.id)}" aria-label="View ${escape(property.title)}"><img src="${escape(property.image)}" alt="${escape(property.alt)}" loading="lazy"></a><div class="saved-home-copy"><span>${escape(property.type)} · ${escape(property.city)}</span><h3>${escape(property.title)}</h3><p>Available ${escape(property.available || "Ask owner")}</p><strong>$${Number(property.price).toLocaleString()}<small> / month</small></strong></div><div class="dashboard-actions"><a href="property.html?id=${encodeURIComponent(property.id)}">View home</a><button type="button" data-remove-favorite="${escape(property.id)}" aria-label="Remove ${escape(property.title)} from saved properties">Remove</button></div></article>`).join("") : `<p class="dashboard-empty">No saved homes yet. Save a property from Explore to keep it here.</p>`;
  }

  function renderEnquiries() {
    const list = document.querySelector("#enquiry-list");
    const records = communications.filter((record) => propertyById.has(record.propertyId));
    document.querySelector("#enquiry-count").textContent = String(records.length);
    document.querySelector("#enquiry-nav-badge").textContent = String(records.filter((record) => record.status === "pending").length);
    list.innerHTML = records.length ? records.map((record) => {
      const property = propertyById.get(record.propertyId);
      return `<article class="dashboard-activity-row"><div class="activity-copy"><span>${escape(property.title)} · ${escape(record.type || "Enquiry")}</span><h3>${escape(record.name)} <small>· ${escape(record.createdAt || "Demo activity")}</small></h3><p class="activity-message">${escape(record.message)}</p>${record.reply ? `<p><strong>Owner reply:</strong> ${escape(record.reply)}</p>` : ""}</div><div class="dashboard-actions">${statusBadge(record.status)}<a href="contact-owner.html?property=${encodeURIComponent(record.propertyId)}#owner-inbox">Open conversation</a></div></article>`;
    }).join("") : `<p class="dashboard-empty">No enquiries yet. Contact an owner from a property page to get started.</p>`;
  }

  function renderVisits() {
    const list = document.querySelector("#visit-list");
    const visits = communications.filter((record) => record.visit && propertyById.has(record.propertyId));
    document.querySelector("#visit-count").textContent = String(visits.length);
    document.querySelector("#visit-nav-badge").textContent = String(visits.filter((record) => ["pending", "accepted", "rescheduled"].includes(record.visit.status)).length);
    list.innerHTML = visits.length ? visits.map((record) => {
      const property = propertyById.get(record.propertyId);
      const visit = record.visit;
      const nextTime = visit.proposedDate ? `<p>Owner suggested ${escape(visit.proposedDate)} · ${escape(visit.proposedTime || "Time not set")}</p>` : "";
      const completeButton = ["accepted", "rescheduled"].includes(visit.status) ? `<button type="button" data-complete-visit="${escape(record.id)}">Mark completed</button>` : "";
      return `<article class="dashboard-activity-row"><div class="activity-copy"><span>${escape(property.title)}</span><h3>${escape(visit.date || "Date not set")} · ${escape(visit.time || "Time not set")}</h3>${nextTime}<p>Visit request for ${escape(record.name)}.</p></div><div class="dashboard-actions">${statusBadge(visit.status)}${completeButton}</div></article>`;
    }).join("") : `<p class="dashboard-empty">No visits requested yet. Add a visit request to a property enquiry.</p>`;
  }

  function renderRoommateRequests() {
    const list = document.querySelector("#roommate-request-list");
    const visible = requests.filter((request) => roommateById.has(request.roommateId));
    const pending = visible.filter((request) => request.status === "pending").length;
    document.querySelector("#roommate-count").textContent = String(visible.length);
    document.querySelector("#roommate-nav-badge").textContent = String(pending);
    list.innerHTML = visible.length ? visible.map((request) => {
      const roommate = roommateById.get(request.roommateId);
      const actions = request.direction === "incoming" && request.status === "pending"
        ? `<button type="button" data-roommate-action="accepted" data-request-id="${escape(request.id)}">Accept</button><button class="is-danger" type="button" data-roommate-action="declined" data-request-id="${escape(request.id)}">Decline</button>`
        : "";
      const direction = request.direction === "incoming" ? "Incoming connection request" : "Your connection request";
      return `<article class="roommate-request-row"><span class="roommate-avatar">${roommate.image ? `<img src="${escape(roommate.image)}" alt="">` : escape(roommate.name.split(/\s+/).map((part) => part[0]).join(""))}</span><div class="roommate-request-copy"><span>${escape(direction)}${request.demo ? " · demo" : ""}</span><h3>${escape(roommate.name)}</h3><p>${escape(roommate.city)} · ${escape(roommate.occupation)}${request.status === "accepted" ? " · Accepted locally; no contact details shared" : ""}</p></div><div class="dashboard-actions">${statusBadge(request.status)}${actions}</div></article>`;
    }).join("") : `<p class="dashboard-empty">No roommate requests yet. Explore roommate profiles to see local demo requests here.</p>`;
  }

  function notificationItems() {
    const items = [];
    communications.forEach((record) => {
      const property = propertyById.get(record.propertyId);
      if (!property) return;
      items.push({ id: `${record.id}-enquiry`, title: record.lastActivity || `Enquiry ${record.status}`, detail: `${property.title} · ${record.name}`, status: record.status, date: record.updatedAt || record.createdAt || "Demo activity" });
      if (record.visit) items.push({ id: `${record.id}-visit`, title: `Visit ${record.visit.status}`, detail: `${property.title} · ${record.visit.date || "Date not set"}`, status: record.visit.status, date: record.updatedAt || record.createdAt || "Demo activity" });
    });
    requests.forEach((request) => {
      const roommate = roommateById.get(request.roommateId);
      if (roommate) items.push({ id: request.id, title: `Roommate request ${request.status}`, detail: `${roommate.name} · ${request.direction}`, status: request.status === "declined" ? "rejected" : request.status, date: "Demo activity" });
    });
    return items.slice(0, 14);
  }

  function renderNotifications() {
    const list = document.querySelector("#notification-list");
    const notifications = notificationItems();
    document.querySelector("#notification-count").textContent = String(notifications.length);
    document.querySelector("#notification-nav-badge").textContent = String(notifications.length);
    document.querySelector("#nav-notification-badge").textContent = String(notifications.length);
    list.innerHTML = notifications.length ? notifications.map((item) => `<article class="notification-row"><span class="notification-dot" aria-hidden="true"></span><div class="notification-copy"><h3>${escape(item.title)}</h3><p>${escape(item.detail)}</p><time>${escape(item.date)}</time></div>${statusBadge(item.status === "declined" ? "rejected" : item.status)}</article>`).join("") : `<p class="dashboard-empty">Nothing new to review.</p>`;
  }

  function render() {
    renderSavedProperties();
    renderEnquiries();
    renderVisits();
    renderRoommateRequests();
    renderNotifications();
  }

  document.querySelector("#saved-property-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-favorite]");
    if (!button) return;
    favorites = favorites.filter((id) => id !== button.dataset.removeFavorite);
    if (writeJson(keys.favorites, favorites)) render();
  });

  document.querySelector("#visit-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-complete-visit]");
    if (!button) return;
    communications = communications.map((record) => record.id === button.dataset.completeVisit
      ? { ...record, visit: { ...record.visit, status: "completed" }, updatedAt: new Date().toISOString(), lastActivity: "Visit completed" }
      : record);
    if (window.saveRentoraCommunications(communications)) render();
  });

  document.querySelector("#roommate-request-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-roommate-action]");
    if (!button) return;
    requests = requests.map((request) => request.id === button.dataset.requestId
      ? { ...request, status: button.dataset.roommateAction }
      : request);
    if (writeJson(keys.requests, requests)) render();
  });

  document.querySelector(".menu-toggle").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.setAttribute("aria-label", expanded ? "Open navigation menu" : "Close navigation menu");
    document.querySelector("#dashboard-navigation").classList.toggle("is-open", !expanded);
  });
  document.querySelector("#dashboard-navigation").addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    document.querySelector("#dashboard-navigation").classList.remove("is-open");
    const button = document.querySelector(".menu-toggle");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open navigation menu");
  });
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  window.addEventListener("storage", (event) => {
    if (event.key === keys.favorites) favorites = seedFavorites();
    if (event.key === keys.requests) requests = seedRoommateRequests();
    if (event.key === keys.communications) communications = window.getRentoraCommunications();
    if (Object.values(keys).includes(event.key)) render();
  });
  render();
})();