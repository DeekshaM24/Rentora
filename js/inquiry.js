(() => {
  const propertyId = new URLSearchParams(window.location.search).get("property");
  const property = (window.getRentoraProperties?.() ?? window.RENTORA_PROPERTIES ?? []).find((item) => item.id === propertyId);
  const kind = document.body.dataset.inquiryKind;
  const heading = kind === "visit" ? "Plan a time to <em>visit.</em>" : "Start a <em>conversation.</em>";
  document.querySelector("#inquiry-title").innerHTML = heading;
  document.querySelector("#current-year").textContent = new Date().getFullYear();

  if (!property) {
    document.querySelector("#inquiry-property").innerHTML = `<div class="inquiry-property-missing">Property details are unavailable. <a href="listings.html">Return to home search.</a></div>`;
    document.querySelector("#inquiry-submit").disabled = true;
    document.querySelector("#inquiry-status").textContent = "Return to a property listing to start a request.";
    return;
  }

  document.title = `${kind === "visit" ? "Schedule a Visit" : "Contact Owner"} · ${property.title} | Rentora`;
  document.querySelector("#property-back").href = `property.html?id=${encodeURIComponent(property.id)}`;
  const escape = window.escapeRentoraHtml ?? ((value) => String(value ?? ""));
  document.querySelector("#inquiry-property").innerHTML = `<img class="inquiry-property-image" src="${escape(property.image)}" alt="${escape(property.alt)}"><div class="inquiry-property-copy"><span class="property-type">${escape(property.type)}</span><h2>${escape(property.title)}</h2><p>${escape(property.city)}</p><strong>$${property.price.toLocaleString()}<small> / month</small></strong></div>`;

  if (kind === "visit") {
    const date = document.querySelector("#visit-date");
    date.min = new Date().toISOString().slice(0, 10);
  }

  document.querySelector("#inquiry-form").addEventListener("submit", (event) => {
    event.preventDefault();
    document.querySelector("#inquiry-status").textContent = kind === "visit"
      ? "Your visit request has not been sent or booked. This prototype does not contact the owner."
      : "Your message has not been sent. This prototype does not contact the owner.";
  });
})();