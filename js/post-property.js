(() => {
  const listingsKey = window.RENTORA_OWNER_LISTINGS_KEY;
  const params = new URLSearchParams(window.location.search);
  const editingId = params.get("id");
  let listingId = editingId;
  const form = document.querySelector("#property-form");
  const currentListings = window.readRentoraOwnerListings();
  const existing = currentListings.find((listing) => listing.id === editingId);
  let selectedImages = existing?.gallery?.length ? [...existing.gallery] : existing?.image ? [existing.image] : [];
  let imageError = "";

  function setMessage(selector, message, visible = true) {
    const element = document.querySelector(selector);
    element.textContent = message;
    element.hidden = !visible;
  }

  function money(value) {
    return `$${Number(value || 0).toLocaleString()}`;
  }

  function readListings() {
    return window.readRentoraOwnerListings();
  }

  function saveListings(listings) {
    return window.writeRentoraOwnerListings(listings);
  }

  function data() {
    const formData = new FormData(form);
    const type = String(formData.get("type") || "");
    const city = String(formData.get("city") || "").trim();
    const locationParts = city.split(",").map((part) => part.trim()).filter(Boolean);
    const date = String(formData.get("available") || "");
    return {
      id: existing?.id || listingId || `owner-${crypto.randomUUID?.() || Date.now().toString(36)}`,
      title: String(formData.get("title") || "").trim(),
      type,
      city,
      neighborhood: locationParts.length > 1 ? locationParts[0] : city,
      searchCity: locationParts.length > 1 ? locationParts[locationParts.length - 1] : city,
      price: Number(formData.get("price")) || 0,
      deposit: Number(formData.get("deposit")) || 0,
      beds: type === "Studio" ? 1 : Number(formData.get("beds")) || 0,
      bedroomCount: type === "Studio" ? 0 : Number(formData.get("beds")) || 0,
      baths: Number(formData.get("baths")) || 0,
      area: Number(formData.get("area")) || 0,
      furnishing: String(formData.get("furnishing") || ""),
      amenities: formData.getAll("amenities").map(String),
      description: String(formData.get("description") || "").trim(),
      rules: String(formData.get("rules") || "").split(/\n+/).map((rule) => rule.trim()).filter(Boolean),
      available: date,
      postedAt: existing?.postedAt || new Date().toISOString().slice(0, 10),
      label: "Owner listed",
      featured: false,
      rating: existing?.rating || "New",
      gallery: selectedImages,
      image: selectedImages[0] || "",
      alt: `${String(formData.get("title") || "Property").trim() || "Property"} property listing image`,
      ownerListing: true,
      owner: existing?.owner || { name: "Property owner", role: "Owner listed", since: "Rentora prototype", verified: false },
      status: "draft",
      views: existing?.views || 0,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1
    };
  }

  function fillForm(listing) {
    for (const field of ["title", "type", "city", "price", "deposit", "beds", "baths", "area", "furnishing", "description", "available"]) {
      if (listing[field] !== undefined && form.elements[field]) {
        const value = field === "beds" && listing.bedroomCount === 0 ? 0 : listing[field];
        form.elements[field].value = String(value);
      }
    }
    form.elements.rules.value = Array.isArray(listing.rules) ? listing.rules.join("\n") : "";
    form.querySelectorAll('input[name="amenities"]').forEach((input) => { input.checked = (listing.amenities ?? []).includes(input.value); });
    updatePreview();
  }

  function updatePreview() {
    const formData = new FormData(form);
    const title = String(formData.get("title") || "").trim();
    const type = String(formData.get("type") || "");
    const city = String(formData.get("city") || "").trim();
    const beds = String(formData.get("beds") || "");
    const baths = String(formData.get("baths") || "");
    const area = Number(formData.get("area")) || 0;
    const rent = Number(formData.get("price")) || 0;
    const amenities = formData.getAll("amenities").map(String);
    document.querySelector("#preview-property-title").textContent = title || "Your property title";
    document.querySelector("#preview-type").textContent = type || "Property type";
    document.querySelector("#preview-location").textContent = city || "Your location";
    document.querySelector("#preview-beds").textContent = type === "Studio" || beds === "0" ? "Studio" : `${beds || "–"} ${beds === "1" ? "bed" : "beds"}`;
    document.querySelector("#preview-baths").textContent = `${baths || "–"} ${baths === "0.5" || baths === "1" ? "bath" : "baths"}`;
    document.querySelector("#preview-area").textContent = `${area ? area.toLocaleString() : "–"} sq ft`;
    document.querySelector("#preview-rent").innerHTML = `${money(rent)}<small> / month</small>`;
    document.querySelector("#preview-amenities").innerHTML = amenities.length ? amenities.slice(0, 4).map((amenity) => `<span>${amenity}</span>`).join("") : `<span>Choose amenities</span>`;
    if (selectedImages.length) document.querySelector("#preview-image").src = selectedImages[0];
  }

  function renderSelectedImages() {
    const container = document.querySelector("#selected-images");
    container.innerHTML = selectedImages.map((image, index) => `<div class="selected-image"><img src="${image}" alt="Selected property photo ${index + 1}"><button type="button" data-remove-image="${index}" aria-label="Remove image ${index + 1}">×</button></div>`).join("");
    updatePreview();
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const source = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(source);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Image compression failed."));
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Image could not be read."));
          reader.readAsDataURL(blob);
        }, "image/jpeg", 0.76);
      };
      image.onerror = () => { URL.revokeObjectURL(source); reject(new Error("Choose a valid image file.")); };
      image.src = source;
    });
  }

  async function selectImages() {
    imageError = "";
    const files = [...document.querySelector("#property-images").files];
    if (files.length > 3) {
      imageError = "Choose no more than three property images.";
      setMessage("#property-form-error", imageError);
      return;
    }
    if (files.some((file) => !file.type.startsWith("image/") || file.size > 12 * 1024 * 1024)) {
      imageError = "Choose image files smaller than 12 MB each.";
      setMessage("#property-form-error", imageError);
      return;
    }
    try {
      selectedImages = await Promise.all(files.map(compressImage));
      renderSelectedImages();
      setMessage("#property-form-error", "", false);
    } catch (error) {
      imageError = error.message;
      setMessage("#property-form-error", imageError);
    }
  }

  function validateForPublish() {
    const invalid = form.querySelector(":invalid");
    if (invalid) {
      setMessage("#property-form-error", invalid.validationMessage || "Complete the required fields to publish.");
      invalid.focus();
      return false;
    }
    if (imageError) {
      setMessage("#property-form-error", imageError);
      return false;
    }
    if (!String(form.elements.title.value).trim() || !String(form.elements.city.value).trim()) {
      setMessage("#property-form-error", "Add a property title and location.");
      return false;
    }
    if (Number(form.elements.price.value) <= 0) {
      setMessage("#property-form-error", "Monthly rent must be greater than zero.");
      form.elements.price.focus();
      return false;
    }
    if (!form.querySelector('input[name="amenities"]:checked')) {
      setMessage("#property-form-error", "Select at least one amenity.");
      document.querySelector(".amenity-fieldset").scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    if (!selectedImages.length) {
      setMessage("#property-form-error", "Add at least one property image before publishing.");
      document.querySelector("#property-images").focus();
      return false;
    }
    return true;
  }

  function persistListing(status) {
    const payload = { ...data(), status, updatedAt: new Date().toISOString() };
    if (status === "active" && !validateForPublish()) return;
    const next = readListings();
    const index = next.findIndex((listing) => listing.id === payload.id);
    if (index >= 0) {
      payload.createdAt = next[index].createdAt || payload.createdAt;
      payload.views = next[index].views || 0;
      next[index] = payload;
    } else next.push(payload);
    if (!saveListings(next)) {
      setMessage("#property-form-error", "Browser storage is full. Try fewer or smaller images and save again.");
      return;
    }
    setMessage("#property-form-error", "", false);
    setMessage("#property-form-success", status === "active" ? "Listing published to this browser's Rentora discovery pages." : "Draft saved in this browser.");
    document.querySelector("#preview-status").textContent = status === "active" ? "Published preview" : "Draft preview";
    document.querySelector("#local-draft-state").textContent = status === "active" ? "Published locally" : "Draft saved locally";
    document.querySelector("#local-draft-state").classList.add("is-saved");
    if (!existing && !listingId) {
      listingId = payload.id;
      const button = document.querySelector("#publish-property");
      button.dataset.savedId = payload.id;
      history.replaceState(null, "", `post-property.html?id=${encodeURIComponent(payload.id)}`);
      document.querySelector("#post-title").innerHTML = `Refine your <em>property listing.</em>`;
      document.querySelector("#form-breadcrumb").textContent = "Edit property";
    }
  }

  function clearFeedback() {
    setMessage("#property-form-error", "", false);
    setMessage("#property-form-success", "", false);
    document.querySelector("#preview-status").textContent = "Preview";
  }

  form.addEventListener("input", () => { clearFeedback(); updatePreview(); });
  form.addEventListener("change", (event) => { clearFeedback(); if (event.target.id !== "property-images") updatePreview(); });
  document.querySelector("#property-images").addEventListener("change", selectImages);
  document.querySelector("#selected-images").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-image]");
    if (!button) return;
    selectedImages.splice(Number(button.dataset.removeImage), 1);
    renderSelectedImages();
  });
  document.querySelector("#save-draft").addEventListener("click", () => persistListing("draft"));
  document.querySelector("#publish-property").addEventListener("click", () => persistListing("active"));
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

  if (existing) {
    document.title = `Edit ${existing.title || "Property"} | Rentora`;
    document.querySelector("#post-title").innerHTML = `Refine your <em>property listing.</em>`;
    document.querySelector("#form-breadcrumb").textContent = "Edit property";
    document.querySelector("#local-draft-state").textContent = `${existing.status === "active" ? "Published" : existing.status === "paused" ? "Paused" : "Draft"} · saved locally`;
    document.querySelector("#preview-status").textContent = existing.status === "active" ? "Published preview" : "Draft preview";
    document.querySelector("#local-draft-state").classList.add("is-saved");
    fillForm(existing);
    renderSelectedImages();
  } else {
    const date = document.querySelector("#property-available");
    date.min = new Date().toISOString().slice(0, 10);
    updatePreview();
  }
})();