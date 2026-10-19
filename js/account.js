(() => {
  const page = document.body.dataset.accountPage;
  const properties = window.getRentoraProperties?.() ?? window.RENTORA_PROPERTIES ?? [];
  const roommates = window.RENTORA_ROOMMATES ?? [];
  const keys = { favorites: "rentora:favorites", roommateFavorites: "rentora:roommate-favorites", compare: "rentora:compare", profile: "rentora:profile", preferences: "rentora:preferences" };

  function readJson(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
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

  function money(value) {
    return `$${Number(value || 0).toLocaleString()}`;
  }

  if (page === "favorites") initFavorites();
  if (page === "profile") initProfile();

  function initFavorites() {
    const propertyById = new Map(properties.map((property) => [property.id, property]));
    const roommateById = new Map(roommates.map((roommate) => [roommate.id, roommate]));
    let favoriteIds = new Set(readJson(keys.favorites, []).filter((id) => propertyById.has(id)));
    let roommateFavoriteIds = new Set(readJson(keys.roommateFavorites, []).filter((id) => roommateById.has(id)));
    let compareIds = new Set(readJson(keys.compare, []).filter((id) => propertyById.has(id)).slice(0, 3));

    function propertyCard(property) {
      const isCompared = compareIds.has(property.id);
      const escape = window.escapeRentoraHtml ?? ((value) => String(value ?? ""));
      const title = escape(property.title);
      return `<article class="property-card account-property-card" data-property-id="${property.id}"><div class="property-photo"><a href="property.html?id=${encodeURIComponent(property.id)}" aria-label="View ${title}"><img src="${escape(property.image)}" alt="${escape(property.alt)}" loading="lazy"></a><span class="property-badge">${escape(property.label)}</span><button class="favorite-toggle" type="button" data-remove-property="${property.id}" aria-label="Remove ${title} from favorites"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.8 8.9c0 4.1-8.8 10-8.8 10S3.2 13 3.2 8.9A4.2 4.2 0 0 1 7.4 4.7c1.8 0 3.3.9 4.6 2.6 1.3-1.7 2.8-2.6 4.6-2.6a4.2 4.2 0 0 1 4.2 4.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button></div><div class="property-info"><div class="property-topline"><span class="property-type">${escape(property.type)}</span><span class="property-rating">★ <span>${escape(property.rating || "New")}</span></span></div><h3 class="property-title">${title}</h3><p class="property-location">${escape(property.city)}</p><div class="property-amenities"><span><b aria-hidden="true">⌂</b>${property.bedroomCount === 0 ? "Studio" : `${property.beds} ${property.beds === 1 ? "bed" : "beds"}`}</span><span><b aria-hidden="true">◒</b>${property.baths} ${property.baths === 1 ? "bath" : "baths"}</span><span><b aria-hidden="true">↗</b>${Number(property.area).toLocaleString()} sq ft</span></div><div class="account-card-footer"><span class="property-price">${money(property.price)}<small> / month</small></span><span class="property-deposit">Deposit ${money(property.deposit)}</span></div><div class="account-card-actions"><button class="compare-toggle" type="button" data-compare-property="${property.id}" aria-pressed="${isCompared}">${isCompared ? "Added to compare" : "Compare"}</button><a class="details-button" href="property.html?id=${encodeURIComponent(property.id)}">View property</a></div></div></article>`;
    }

    function roommateCard(roommate, saved) {
      return `<article class="roommate-card ${saved ? "is-saved" : ""}" data-roommate-id="${roommate.id}"><div class="roommate-photo"><img src="${roommate.image}" alt="${roommate.alt}" loading="lazy"><span class="demo-tag">Demo profile</span></div><div class="roommate-card-copy"><span class="roommate-occupation">${roommate.occupation}</span><h3>${roommate.name}</h3><p class="roommate-location">${roommate.city}</p><p class="roommate-about">${roommate.about}</p><div class="roommate-tags">${roommate.preferences.map((preference) => `<span>${preference}</span>`).join("")}</div><button class="roommate-save" type="button" data-roommate-favorite="${roommate.id}" aria-pressed="${saved}">${saved ? "Remove favorite" : "Save roommate"}</button></div></article>`;
    }

    function render() {
      const savedProperties = properties.filter((property) => favoriteIds.has(property.id));
      const savedRoommates = roommates.filter((roommate) => roommateFavoriteIds.has(roommate.id));
      document.querySelector("#favorite-property-count").textContent = `${savedProperties.length} ${savedProperties.length === 1 ? "home" : "homes"}`;
      document.querySelector("#favorite-roommate-count").textContent = `${savedRoommates.length} ${savedRoommates.length === 1 ? "profile" : "profiles"}`;
      document.querySelector("#favorite-properties-empty").hidden = savedProperties.length > 0;
      document.querySelector("#favorite-roommates-empty").hidden = savedRoommates.length > 0;
      document.querySelector("#favorite-properties-grid").innerHTML = savedProperties.map(propertyCard).join("");
      document.querySelector("#favorite-roommates-grid").innerHTML = savedRoommates.map((roommate) => roommateCard(roommate, true)).join("");
      document.querySelector("#roommate-discovery-grid").innerHTML = roommates.map((roommate) => roommateCard(roommate, roommateFavoriteIds.has(roommate.id))).join("");
    }

    document.addEventListener("click", (event) => {
      const removeProperty = event.target.closest("[data-remove-property]");
      if (removeProperty) {
        favoriteIds.delete(removeProperty.dataset.removeProperty);
        writeJson(keys.favorites, [...favoriteIds]);
        render();
        return;
      }

      const compareProperty = event.target.closest("[data-compare-property]");
      if (compareProperty) {
        const id = compareProperty.dataset.compareProperty;
        if (compareIds.has(id)) compareIds.delete(id);
        else if (compareIds.size < 3) compareIds.add(id);
        else {
          document.querySelector("#account-notice").textContent = "Comparison is limited to three homes. Remove one before adding another.";
          return;
        }
        writeJson(keys.compare, [...compareIds]);
        document.querySelector("#account-notice").textContent = compareIds.has(id) ? "Home added to comparison." : "Home removed from comparison.";
        render();
        return;
      }

      const roommateButton = event.target.closest("[data-roommate-favorite]");
      if (roommateButton) {
        const id = roommateButton.dataset.roommateFavorite;
        roommateFavoriteIds.has(id) ? roommateFavoriteIds.delete(id) : roommateFavoriteIds.add(id);
        writeJson(keys.roommateFavorites, [...roommateFavoriteIds]);
        render();
      }
    });

    document.querySelector("#current-year").textContent = new Date().getFullYear();
    document.querySelector(".menu-toggle").addEventListener("click", (event) => {
      const button = event.currentTarget;
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      button.setAttribute("aria-label", expanded ? "Open navigation menu" : "Close navigation menu");
      document.querySelector("#account-navigation").classList.toggle("is-open", !expanded);
    });
    document.querySelector("#account-navigation").addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      document.querySelector("#account-navigation").classList.remove("is-open");
      const button = document.querySelector(".menu-toggle");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation menu");
    });
    render();
  }

  function initProfile() {
    const profile = readJson(keys.profile, {});
    const preferences = readJson(keys.preferences, {});
    const profileForm = document.querySelector("#profile-form");
    const preferenceForm = document.querySelector("#preferences-form");
    const profilePhotoInput = document.querySelector("#profile-photo");
    let profilePhoto = typeof profile.photo === "string" ? profile.photo : "";

    function setMessage(id, text, visible = true) {
      const element = document.querySelector(id);
      element.textContent = text;
      element.hidden = !visible;
    }

    function initials(name) {
      return name.trim().split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "R";
    }

    function updateProfilePreview() {
      const name = profileForm.elements.name.value.trim();
      const location = profileForm.elements.location.value.trim();
      document.querySelector("#profile-preview-name").textContent = name || "Your profile";
      document.querySelector("#profile-preview-location").textContent = location || "Your preferred location";
      document.querySelector("#profile-avatar-initials").textContent = initials(name);
      const image = document.querySelector("#profile-photo-preview");
      image.hidden = !profilePhoto;
      image.src = profilePhoto;
      document.querySelector("#profile-avatar-initials").hidden = Boolean(profilePhoto);
    }

    function formDataToProfile() {
      return {
        name: profileForm.elements.name.value.trim(),
        email: profileForm.elements.email.value.trim(),
        phone: profileForm.elements.phone.value.trim(),
        location: profileForm.elements.location.value.trim(),
        budget: Number(profileForm.elements.budget.value),
        propertyType: profileForm.elements.propertyType.value,
        bedrooms: profileForm.elements.bedrooms.value,
        moveInDate: profileForm.elements.moveInDate.value,
        photo: profilePhoto
      };
    }

    function showInvalid(form, errorId) {
      const invalid = form.querySelector(":invalid");
      if (invalid) {
        const message = invalid.validity.typeMismatch ? "Enter a valid email address." : invalid.validationMessage || "Complete this field to continue.";
        setMessage(errorId, message);
        invalid.focus();
        return true;
      }
      return false;
    }

    for (const field of ["name", "email", "phone", "location", "budget", "propertyType", "bedrooms", "moveInDate"]) {
      if (profile[field] !== undefined && profileForm.elements[field]) profileForm.elements[field].value = profile[field];
    }
    for (const field of ["locations", "minBudget", "maxBudget", "furnishing", "pets"]) {
      if (preferences[field] !== undefined && preferenceForm.elements[field]) preferenceForm.elements[field].value = field === "locations" && Array.isArray(preferences[field]) ? preferences[field].join(", ") : preferences[field];
    }
    if (Array.isArray(preferences.lifestyle)) {
      preferenceForm.querySelectorAll('input[name="lifestyle"]').forEach((input) => { input.checked = preferences.lifestyle.includes(input.value); });
    }
    updateProfilePreview();
    profileForm.addEventListener("input", () => {
      updateProfilePreview();
      setMessage("#profile-error", "", false);
      setMessage("#profile-success", "", false);
    });
    const clearPreferenceFeedback = () => {
      setMessage("#preferences-error", "", false);
      setMessage("#preferences-success", "", false);
    };
    preferenceForm.addEventListener("input", clearPreferenceFeedback);
    preferenceForm.addEventListener("change", clearPreferenceFeedback);

    profilePhotoInput.addEventListener("change", () => {
      const file = profilePhotoInput.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        profilePhotoInput.value = "";
        setMessage("#profile-error", "Choose an image file for your profile photo.");
        return;
      }
      if (file.size > 700 * 1024) {
        profilePhotoInput.value = "";
        setMessage("#profile-error", "Choose an image smaller than 700 KB for browser storage.");
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const previous = profilePhoto;
        profilePhoto = String(reader.result);
        const saved = writeJson(keys.profile, formDataToProfile());
        if (!saved) {
          profilePhoto = previous;
          setMessage("#profile-error", "This browser could not store the photo. Try a smaller image.");
          return;
        }
        setMessage("#profile-error", "", false);
        setMessage("#profile-success", "Profile photo saved in this browser.");
        updateProfilePreview();
      });
      reader.addEventListener("error", () => setMessage("#profile-error", "That photo could not be read. Try another image."));
      reader.readAsDataURL(file);
    });

    profileForm.addEventListener("submit", (event) => {
      event.preventDefault();
      setMessage("#profile-success", "", false);
      if (showInvalid(profileForm, "#profile-error")) return;
      if (!profileForm.elements.name.value.trim()) {
        setMessage("#profile-error", "Enter your name.");
        profileForm.elements.name.focus();
        return;
      }
      if (!profileForm.elements.location.value.trim()) {
        setMessage("#profile-error", "Add a preferred location.");
        profileForm.elements.location.focus();
        return;
      }
      const saved = writeJson(keys.profile, formDataToProfile());
      if (!saved) {
        setMessage("#profile-error", "Your browser could not save this profile. Remove the photo or use a smaller one and try again.");
        return;
      }
      setMessage("#profile-error", "", false);
      setMessage("#profile-success", "Profile saved on this device.");
      updateProfilePreview();
    });

    preferenceForm.addEventListener("submit", (event) => {
      event.preventDefault();
      setMessage("#preferences-success", "", false);
      if (showInvalid(preferenceForm, "#preferences-error")) return;
      const locations = preferenceForm.elements.locations.value.split(",").map((location) => location.trim()).filter(Boolean);
      const minBudget = Number(preferenceForm.elements.minBudget.value);
      const maxBudget = Number(preferenceForm.elements.maxBudget.value);
      if (!locations.length) {
        setMessage("#preferences-error", "Add at least one preferred location.");
        preferenceForm.elements.locations.focus();
        return;
      }
      if (minBudget > maxBudget) {
        setMessage("#preferences-error", "Minimum budget must be less than or equal to maximum budget.");
        preferenceForm.elements.minBudget.focus();
        return;
      }
      const preferenceData = {
        locations,
        minBudget,
        maxBudget,
        furnishing: preferenceForm.elements.furnishing.value,
        pets: preferenceForm.elements.pets.value,
        lifestyle: [...preferenceForm.querySelectorAll('input[name="lifestyle"]:checked')].map((input) => input.value)
      };
      if (!writeJson(keys.preferences, preferenceData)) {
        setMessage("#preferences-error", "Your browser could not save these preferences. Try removing some selections and save again.");
        return;
      }
      setMessage("#preferences-error", "", false);
      setMessage("#preferences-success", "Preferences saved on this device.");
    });

    document.querySelector("#current-year").textContent = new Date().getFullYear();
    document.querySelector(".menu-toggle").addEventListener("click", (event) => {
      const button = event.currentTarget;
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      button.setAttribute("aria-label", expanded ? "Open navigation menu" : "Close navigation menu");
      document.querySelector("#account-navigation").classList.toggle("is-open", !expanded);
    });
    document.querySelector("#account-navigation").addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      document.querySelector("#account-navigation").classList.remove("is-open");
      const button = document.querySelector(".menu-toggle");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation menu");
    });
  }
})();