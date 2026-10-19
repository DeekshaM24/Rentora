(() => {
  const roommates = window.RENTORA_ROOMMATES ?? [];
  const keys = { profile: "rentora:roommate-profile", saved: "rentora:roommate-favorites", requests: "rentora:roommate-requests" };
  const form = document.querySelector("#roommate-profile-form");
  const weights = [
    ["location", 20], ["budget", 20], ["moveInDate", 10], ["sleep", 8], ["cleanliness", 8],
    ["smoking", 8], ["pets", 8], ["food", 5], ["workSchedule", 5], ["social", 4], ["noise", 4]
  ];
  const flexibleValues = new Set(["Flexible", "No preference"]);
  const incomingExamples = [
    { id: "demo-request-avery", roommateId: "avery-bennett", direction: "incoming", status: "pending", demo: true },
    { id: "demo-request-jamie", roommateId: "jamie-okafor", direction: "incoming", status: "pending", demo: true }
  ];
  let profile = readJson(keys.profile, null);
  const storedSavedProfiles = readJson(keys.saved, []);
  let savedProfiles = new Set(Array.isArray(storedSavedProfiles) ? storedSavedProfiles.filter((id) => roommates.some((roommate) => roommate.id === id)) : []);
  let requests = readJson(keys.requests, null);
  let scores = new Map();

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function setMessage(selector, message, visible = true) {
    const element = document.querySelector(selector);
    element.textContent = message;
    element.hidden = !visible;
  }

  function normalizeLocation(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  }

  function locationScore(first, second) {
    const left = normalizeLocation(first.location);
    const right = normalizeLocation(second.location);
    return left && right && (left.includes(right) || right.includes(left)) ? 1 : 0;
  }

  function budgetScore(first, second) {
    const left = Number(first.budget);
    const right = Number(second.budget);
    if (!left || !right) return 0;
    return Math.min(left, right) / Math.max(left, right);
  }

  function moveDateScore(first, second) {
    const left = new Date(`${first.moveInDate}T12:00:00`).getTime();
    const right = new Date(`${second.moveInDate}T12:00:00`).getTime();
    if (!Number.isFinite(left) || !Number.isFinite(right)) return 0;
    const daysApart = Math.abs(left - right) / 86400000;
    if (daysApart <= 7) return 1;
    if (daysApart <= 30) return 0.75;
    if (daysApart <= 60) return 0.5;
    return 0;
  }

  function lifestyleScore(first, second, key) {
    const left = String(first[key] || "");
    const right = String(second[key] || "");
    if (!left || !right) return 0;
    if (left === right || flexibleValues.has(left) || flexibleValues.has(right)) return 1;
    if (key === "sleep") return 0.35;
    if (key === "cleanliness") return 0.5;
    return 0;
  }

  function preferenceMatch(first, second) {
    const weighted = weights.reduce((total, [key, weight]) => {
      let compatibility = 0;
      if (key === "location") compatibility = locationScore(first, second);
      else if (key === "budget") compatibility = budgetScore(first, second);
      else if (key === "moveInDate") compatibility = moveDateScore(first, second);
      else compatibility = lifestyleScore(first, second, key);
      return total + compatibility * weight;
    }, 0);
    return Math.round(weighted);
  }

  function readFormProfile() {
    const data = new FormData(form);
    return {
      name: String(data.get("name") || "").trim(),
      age: Number(data.get("age")),
      occupation: String(data.get("occupation") || "").trim(),
      location: String(data.get("location") || "").trim(),
      budget: Number(data.get("budget")),
      moveInDate: String(data.get("moveInDate") || ""),
      genderPreference: String(data.get("genderPreference") || "No preference"),
      sleep: String(data.get("sleep") || ""),
      cleanliness: String(data.get("cleanliness") || ""),
      smoking: String(data.get("smoking") || ""),
      pets: String(data.get("pets") || ""),
      food: String(data.get("food") || ""),
      workSchedule: String(data.get("workSchedule") || ""),
      social: String(data.get("social") || ""),
      noise: String(data.get("noise") || ""),
      discoverable: form.elements.discoverable.checked
    };
  }

  function populateForm() {
    if (!profile || typeof profile !== "object") return;
    for (const [key, value] of Object.entries(profile)) {
      if (key === "discoverable") form.elements.discoverable.checked = Boolean(value);
      else if (form.elements[key] && value !== undefined && value !== null) form.elements[key].value = String(value);
    }
  }

  function getScores() {
    scores = new Map(roommates.map((roommate) => [roommate.id, profile ? preferenceMatch(profile, roommate) : null]));
  }

  function money(value) {
    return `$${Number(value).toLocaleString()}`;
  }

  function formatDate(value) {
    if (!value) return "Not set";
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
  }

  function lifestyleSummary(roommate) {
    return `${roommate.sleep}; ${roommate.cleanliness.toLowerCase()}; ${roommate.smoking.toLowerCase()}; ${roommate.pets.toLowerCase()}; ${roommate.social.toLowerCase()} social pace.`;
  }

  function sortedRoommates() {
    const sort = document.querySelector("#match-sort").value;
    return [...roommates].sort((first, second) => {
      if (sort === "location") return first.location.localeCompare(second.location);
      if (sort === "budget") return first.budget - second.budget;
      return (scores.get(second.id) ?? -1) - (scores.get(first.id) ?? -1);
    });
  }

  function requestFor(roommateId) {
    return requests.find((request) => request.direction === "outgoing" && request.roommateId === roommateId && request.status === "pending");
  }

  function renderMatches() {
    const list = sortedRoommates();
    const grid = document.querySelector("#roommate-match-grid");
    document.querySelector("#profile-required-callout").hidden = Boolean(profile);
    document.querySelector("#match-summary").textContent = profile
      ? `Preference scores for ${profile.name}. Review the details and decide for yourself.`
      : "Save your profile to see personalized Preference Match percentages.";
    document.querySelector("#no-roommates-empty").hidden = list.length > 0;
    grid.innerHTML = list.map((roommate) => {
      const score = scores.get(roommate.id);
      const pendingRequest = requestFor(roommate.id);
      const isSaved = savedProfiles.has(roommate.id);
      return `<article class="match-card" data-roommate-id="${roommate.id}"><div class="match-card-photo"><img src="${roommate.image}" alt="${roommate.alt}" loading="lazy"><span class="demo-tag">Demo profile</span></div><div class="match-card-body"><div class="match-card-heading"><h3>${roommate.name}</h3><div class="preference-score ${score === null ? "score-needed" : ""}">${score === null ? "Profile needed" : `${score}% Match`}<span>Preference Match</span></div></div><p class="match-card-location">${roommate.city}</p><div class="match-card-facts"><span><b>Budget</b> ${money(roommate.budget)} / mo</span><span><b>Move-in</b> ${formatDate(roommate.moveInDate)}</span></div><p class="match-lifestyle">${lifestyleSummary(roommate)}</p><div class="match-card-actions"><button class="view-profile" type="button" data-view-profile="${roommate.id}">View Profile</button><button class="save-profile" type="button" data-save-profile="${roommate.id}" aria-pressed="${isSaved}">${isSaved ? "Profile saved" : "Save Profile"}</button><button class="send-request" type="button" data-send-request="${roommate.id}" ${pendingRequest ? "disabled" : ""}>${pendingRequest ? "Request sent" : "Send Connection Request"}</button></div></div></article>`;
    }).join("");
  }

  function renderPreview() {
    const preview = document.querySelector("#local-profile-preview");
    const visible = Boolean(profile?.discoverable);
    preview.hidden = !visible;
    document.querySelector("#preview-summary").textContent = visible
      ? `${profile.name} · ${profile.location} · ${money(profile.budget)} monthly budget · ${profile.occupation}. Your age and gender preference remain private.`
      : "Your profile is private. Turn on the local preview option in Privacy controls to see how your summary appears on this device.";
  }

  function renderRequests() {
    const incoming = requests.filter((request) => request.direction === "incoming");
    const outgoing = requests.filter((request) => request.direction === "outgoing");
    document.querySelector("#incoming-requests").innerHTML = incoming.length ? incoming.map((request) => {
      const roommate = roommates.find((item) => item.id === request.roommateId);
      if (!roommate) return "";
      const pending = request.status === "pending";
      return `<article class="request-card"><img src="${roommate.image}" alt=""><div class="request-copy"><h3>${roommate.name}</h3><p>${roommate.city} · ${roommate.occupation}</p>${request.demo ? `<span class="demo-tag-inline">Sample request</span>` : ""}</div>${pending ? `<div class="request-actions"><button class="accept-request" type="button" data-request-action="accept" data-request-id="${request.id}">Accept</button><button class="decline-request" type="button" data-request-action="decline" data-request-id="${request.id}">Decline</button></div>` : `<span class="request-state">${request.status === "accepted" ? "Accepted locally" : "Declined"}</span>`}</article>`;
    }).join("") : `<div class="request-empty">No incoming connection requests.</div>`;
    document.querySelector("#outgoing-requests").innerHTML = outgoing.length ? outgoing.map((request) => {
      const roommate = roommates.find((item) => item.id === request.roommateId);
      if (!roommate) return "";
      return `<article class="request-card"><img src="${roommate.image}" alt=""><div class="request-copy"><h3>${roommate.name}</h3><p>${roommate.city}</p></div><span class="request-state">${request.status === "pending" ? "Sent locally" : request.status}</span></article>`;
    }).join("") : `<div class="request-empty">You have not sent any requests.</div>`;
  }

  function render() {
    getScores();
    renderMatches();
    renderPreview();
    renderRequests();
    const savedStatus = document.querySelector("#saved-profile-status");
    savedStatus.textContent = profile ? "Profile saved on this device" : "No profile saved";
    savedStatus.classList.toggle("is-saved", Boolean(profile));
  }

  function showProfile(roommateId) {
    const roommate = roommates.find((item) => item.id === roommateId);
    if (!roommate) return;
    const details = [
      ["Occupation / student status", roommate.occupation], ["Age", `${roommate.age}`],
      ["Monthly budget", `${money(roommate.budget)} / month`], ["Move-in date", formatDate(roommate.moveInDate)],
      ["Sleep schedule", roommate.sleep], ["Cleanliness", roommate.cleanliness],
      ["Smoking", roommate.smoking], ["Pet preference", roommate.pets],
      ["Food preference", roommate.food], ["Work / study schedule", roommate.workSchedule],
      ["Social preference", roommate.social], ["Noise tolerance", roommate.noise]
    ];
    document.querySelector("#roommate-dialog-content").innerHTML = `<div class="roommate-dialog-content"><img src="${roommate.image}" alt="${roommate.alt}"><p class="eyebrow"><span class="eyebrow-line"></span> Demo roommate profile</p><h2 id="roommate-dialog-title">${roommate.name}</h2><p class="dialog-location">${roommate.city}</p><p>${roommate.about}</p><dl>${details.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl><p class="private-detail">No private contact details are included. Profile and match information is illustrative and does not guarantee compatibility.</p></div>`;
    document.querySelector("#roommate-dialog").showModal();
  }

  function saveProfile(event) {
    event.preventDefault();
    setMessage("#roommate-profile-error", "", false);
    setMessage("#roommate-profile-success", "", false);
    const invalid = form.querySelector(":invalid");
    if (invalid) {
      const message = invalid.validity.rangeUnderflow ? "Age must be at least 18." : invalid.validationMessage || "Complete this field to continue.";
      setMessage("#roommate-profile-error", message);
      invalid.focus();
      return;
    }
    const values = readFormProfile();
    if (!values.name || !values.occupation || !values.location) {
      setMessage("#roommate-profile-error", "Name, occupation, and preferred location cannot be blank.");
      return;
    }
    if (values.budget <= 0) {
      setMessage("#roommate-profile-error", "Enter a monthly budget greater than zero.");
      form.elements.budget.focus();
      return;
    }
    profile = values;
    if (!saveJson(keys.profile, profile)) {
      profile = null;
      setMessage("#roommate-profile-error", "This browser could not save the profile. Try again after freeing local storage.");
      return;
    }
    setMessage("#roommate-profile-success", "Your roommate profile is saved in this browser. It has not been published or sent.");
    render();
  }

  function sendRequest(roommateId) {
    if (!profile) {
      setMessage("#roommate-profile-error", "Save your roommate profile before sending a connection request.");
      document.querySelector("#lifestyle-profile").scrollIntoView({ behavior: "smooth", block: "start" });
      form.elements.name.focus({ preventScroll: true });
      return;
    }
    if (requests.some((request) => request.direction === "outgoing" && request.roommateId === roommateId && request.status === "pending")) return;
    const nextRequests = [...requests, { id: `request-${roommateId}-${Date.now()}`, roommateId, direction: "outgoing", status: "pending", demo: true }];
    if (!saveJson(keys.requests, nextRequests)) {
      document.querySelector("#request-feedback").textContent = "This browser could not save the request. No message was sent.";
      return;
    }
    requests = nextRequests;
    document.querySelector("#request-feedback").textContent = "Request saved locally. No message was sent and no contact details were shared.";
    renderRequests();
    renderMatches();
  }

  function handleRequest(event) {
    const button = event.target.closest("[data-request-action]");
    if (!button) return;
    const nextRequests = requests.map((request) => request.id === button.dataset.requestId
      ? { ...request, status: button.dataset.requestAction === "accept" ? "accepted" : "declined" }
      : request);
    if (!saveJson(keys.requests, nextRequests)) {
      document.querySelector("#request-feedback").textContent = "This browser could not save that request update.";
      return;
    }
    requests = nextRequests;
    document.querySelector("#request-feedback").textContent = button.dataset.requestAction === "accept"
      ? "Accepted locally. No contact details were revealed and no message was sent."
      : "Declined locally. No message was sent.";
    renderRequests();
  }

  if (!Array.isArray(requests)) {
    requests = incomingExamples;
    saveJson(keys.requests, requests);
  } else {
    requests = requests.filter((request) => request && roommates.some((roommate) => roommate.id === request.roommateId) && ["incoming", "outgoing"].includes(request.direction) && ["pending", "accepted", "declined"].includes(request.status));
  }

  populateForm();
  if (!profile) {
    const moveDate = form.elements.moveInDate;
    moveDate.min = new Date().toISOString().slice(0, 10);
  }
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  form.addEventListener("submit", saveProfile);
  form.addEventListener("input", () => {
    setMessage("#roommate-profile-error", "", false);
    setMessage("#roommate-profile-success", "", false);
  });
  document.querySelector("#clear-roommate-profile").addEventListener("click", () => {
    profile = null;
    form.reset();
    form.elements.genderPreference.value = "No preference";
    form.elements.moveInDate.min = new Date().toISOString().slice(0, 10);
    saveJson(keys.profile, null);
    setMessage("#roommate-profile-success", "Your profile was removed from this browser.");
    render();
  });
  form.elements.discoverable.addEventListener("change", () => {
    if (!profile) return;
    profile = { ...profile, discoverable: form.elements.discoverable.checked };
    if (saveJson(keys.profile, profile)) renderPreview();
    else setMessage("#roommate-profile-error", "This browser could not save the privacy setting.");
  });
  document.querySelector("#match-sort").addEventListener("change", renderMatches);
  document.querySelector("#roommate-match-grid").addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view-profile]");
    if (viewButton) {
      showProfile(viewButton.dataset.viewProfile);
      return;
    }
    const saveButton = event.target.closest("[data-save-profile]");
    if (saveButton) {
      const id = saveButton.dataset.saveProfile;
      savedProfiles.has(id) ? savedProfiles.delete(id) : savedProfiles.add(id);
      const nextSavedProfiles = new Set(savedProfiles);
      nextSavedProfiles.has(id) ? nextSavedProfiles.delete(id) : nextSavedProfiles.add(id);
      if (!saveJson(keys.saved, [...nextSavedProfiles])) {
        setMessage("#roommate-profile-error", "This browser could not save the profile. Try again after freeing local storage.");
        return;
      }
      const isSaved = nextSavedProfiles.has(id);
      savedProfiles = nextSavedProfiles;
      document.querySelector("#request-feedback").textContent = isSaved ? "Roommate profile saved to Favorites on this device." : "Roommate profile removed from Favorites.";
      renderMatches();
      return;
    }
    const sendButton = event.target.closest("[data-send-request]");
    if (sendButton) sendRequest(sendButton.dataset.sendRequest);
  });
  document.querySelector("#incoming-requests").addEventListener("click", handleRequest);
  document.querySelector("#roommate-dialog").addEventListener("click", (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  document.querySelector(".menu-toggle").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.setAttribute("aria-label", expanded ? "Open navigation menu" : "Close navigation menu");
    document.querySelector("#roommate-navigation").classList.toggle("is-open", !expanded);
  });
  document.querySelector("#roommate-navigation").addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    document.querySelector("#roommate-navigation").classList.remove("is-open");
    const button = document.querySelector(".menu-toggle");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open navigation menu");
  });
  render();
})();