(() => {
  const storageKey = window.RENTORA_COMMUNICATIONS_KEY;
  const properties = window.getRentoraProperties?.() ?? window.RENTORA_PROPERTIES ?? [];
  const propertyById = new Map(properties.map((property) => [property.id, property]));
  const dateAfter = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };
  let records = window.getRentoraCommunications();

  function saveRecords(nextRecords) {
    try {
      if (!window.saveRentoraCommunications(nextRecords)) throw new Error("Storage unavailable");
      records = nextRecords;
      render();
      return true;
    } catch {
      setStatus("This browser could not save the update. No message or visit request was sent.");
      return false;
    }
  }

  function escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function setStatus(message) {
    const status = document.querySelector("#communication-status");
    if (status) status.textContent = message;
  }

  function propertyCard(property) {
    if (!property) return `<div class="inquiry-property-missing">Choose a property to see its details.</div>`;
    return `<img class="inquiry-property-image" src="${escape(property.image)}" alt="${escape(property.alt)}"><div class="inquiry-property-copy"><span class="property-type">${escape(property.type)}</span><h2>${escape(property.title)}</h2><p>${escape(property.city)}</p><strong>$${Number(property.price).toLocaleString()}<small> / month</small></strong></div>`;
  }

  function setVisitStatus(recordId, status, values = {}) {
    saveRecords(records.map((record) => record.id === recordId
      ? { ...record, visit: { ...record.visit, ...values, status }, updatedAt: new Date().toISOString(), lastActivity: `Visit ${status}` }
      : record));
  }

  function statusPill(status) {
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "None";
    return `<span class="workflow-status status-${escape(status || "none")}">${escape(label)}</span>`;
  }

  function inboxCard(record) {
    const property = propertyById.get(record.propertyId);
    const visit = record.visit;
    const visitActions = visit ? `<div class="visit-action-row">${visit.date ? `<span class="visit-date">${escape(visit.date)} · ${escape(visit.time || "Time not set")}</span>` : ""}${visit.status === "rescheduled" && visit.proposedDate ? `<span class="reschedule-note">Suggested: ${escape(visit.proposedDate)} · ${escape(visit.proposedTime || "Time not set")}</span>` : ""}<div class="action-row">${["pending", "accepted", "rescheduled"].includes(visit.status) ? `<button class="action-button" type="button" data-action="accept-visit" data-record-id="${escape(record.id)}">Accept visit</button><button class="action-button" type="button" data-action="show-reschedule" data-record-id="${escape(record.id)}">Reschedule</button><button class="action-button is-danger" type="button" data-action="reject-visit" data-record-id="${escape(record.id)}">Reject visit</button>` : ""}${visit.status === "accepted" || visit.status === "rescheduled" ? `<button class="action-button" type="button" data-action="complete-visit" data-record-id="${escape(record.id)}">Mark completed</button>` : ""}</div><form class="reschedule-form" data-reschedule-form="${escape(record.id)}" hidden><label>New preferred date<input name="date" type="date" min="${dateAfter(0)}" required></label><label>New preferred time<select name="time" required><option value="">Choose a time</option><option>Morning, 9 am–12 pm</option><option>Afternoon, 12–4 pm</option><option>Early evening, 4–7 pm</option></select></label><button class="action-button" type="submit">Save new time</button></form></div>` : `<p class="visit-date">No visit requested</p>`;
    return `<article class="inbox-card"><div class="inbox-card-heading"><div><span class="inbox-property-name">${escape(property?.title || "Property")}</span><h3>${escape(record.name)} <span>· ${escape(record.type || "Enquiry")}</span></h3></div>${statusPill(record.status)}</div><p class="inbox-message">${escape(record.message)}</p><div class="inbox-meta"><span>${escape(record.email)}</span><time>${escape(record.createdAt || "Demo request")}</time></div><div class="inbox-response">${record.reply ? `<p><strong>Owner reply</strong>${escape(record.reply)}</p>` : ""}<form class="reply-form" data-reply-form="${escape(record.id)}"><label for="reply-${escape(record.id)}">Reply in demo</label><textarea id="reply-${escape(record.id)}" name="reply" rows="2" maxlength="600" placeholder="Write a local demo reply">${escape(record.reply || "")}</textarea><button class="action-button" type="submit">Save reply</button></form></div><div class="inbox-actions">${record.status === "pending" ? `<button class="action-button" type="button" data-action="accept-enquiry" data-record-id="${escape(record.id)}">Accept enquiry</button><button class="action-button is-danger" type="button" data-action="reject-enquiry" data-record-id="${escape(record.id)}">Reject enquiry</button>` : `<span class="inbox-action-label">Enquiry ${statusPill(record.status)}</span>`}</div><div class="inbox-visit"><div class="visit-heading"><strong>Property visit</strong>${statusPill(visit?.status)}</div>${visitActions}</div></article>`;
  }

  function renderInbox() {
    const list = document.querySelector("#owner-inbox-list");
    const pendingEnquiries = records.filter((record) => record.status === "pending").length;
    const pendingVisits = records.filter((record) => record.visit?.status === "pending").length;
    document.querySelector("#pending-enquiry-count").textContent = String(pendingEnquiries);
    document.querySelector("#pending-visit-count").textContent = String(pendingVisits);
    document.querySelector("#owner-nav-badge").textContent = String(pendingEnquiries + pendingVisits);
    document.querySelector("#dashboard-nav-badge").textContent = String(pendingEnquiries + pendingVisits);
    list.innerHTML = records.length ? records.map(inboxCard).join("") : `<p class="inbox-empty">No demo enquiries yet. Submit a renter enquiry to add one.</p>`;
  }

  function render() {
    renderInbox();
    const property = propertyById.get(document.querySelector("#property-select").value);
    document.querySelector("#inquiry-property").innerHTML = propertyCard(property);
  }

  const propertySelect = document.querySelector("#property-select");
  const query = new URLSearchParams(window.location.search);
  const requestedPropertyId = query.get("property");
  propertySelect.innerHTML = properties.map((property) => `<option value="${escape(property.id)}">${escape(property.title)} · ${escape(property.city)}</option>`).join("");
  if (propertyById.has(requestedPropertyId)) propertySelect.value = requestedPropertyId;
  document.querySelector("#property-back").href = requestedPropertyId && propertyById.has(requestedPropertyId)
    ? `property.html?id=${encodeURIComponent(requestedPropertyId)}`
    : "listings.html";
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  document.querySelector("#visit-date").min = dateAfter(0);
  document.querySelector("#visit-fields").hidden = true;
  document.querySelector("#request-visit").addEventListener("change", (event) => {
    const visible = event.currentTarget.checked;
    document.querySelector("#visit-fields").hidden = !visible;
    document.querySelector("#visit-date").required = visible;
    document.querySelector("#visit-time").required = visible;
  });
  if (query.get("visit") === "1") {
    const visitToggle = document.querySelector("#request-visit");
    visitToggle.checked = true;
    visitToggle.dispatchEvent(new Event("change"));
  }
  propertySelect.addEventListener("change", render);

  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
    const view = button.dataset.view;
    document.querySelectorAll("[data-view]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    document.querySelectorAll("[data-role-panel]").forEach((panel) => { panel.hidden = panel.dataset.rolePanel !== view; });
    document.querySelector("#communication-title").innerHTML = view === "owner" ? "A considered way to <em>respond.</em>" : "A clearer way to <em>connect.</em>";
    if (view === "owner") window.location.hash = "owner-inbox";
    else history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }));

  document.querySelector("#communication-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const visitRequested = form.elements.requestVisit.checked;
    const record = {
      id: `enquiry-${Date.now()}`,
      propertyId: String(data.get("propertyId")),
      name: String(data.get("name")).trim(),
      email: String(data.get("email")).trim(),
      type: String(data.get("type")),
      message: String(data.get("message")).trim(),
      status: "pending",
      reply: "",
      createdAt: dateAfter(0),
      visit: visitRequested ? { status: "pending", date: String(data.get("date")), time: String(data.get("time")) } : null
    };
    if (saveRecords([record, ...records])) {
      form.reset();
      document.querySelector("#visit-fields").hidden = true;
      document.querySelector("#visit-date").required = false;
      document.querySelector("#visit-time").required = false;
      setStatus("Enquiry saved in this browser as Pending. No message was sent or visit booked.");
    }
  });

  document.querySelector("#owner-inbox-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const record = records.find((item) => item.id === button.dataset.recordId);
    if (!record) return;
    const { action } = button.dataset;
    if (action === "show-reschedule") {
      const form = document.querySelector(`[data-reschedule-form="${CSS.escape(record.id)}"]`);
      form.hidden = !form.hidden;
      return;
    }
    if (action === "accept-enquiry" || action === "reject-enquiry") {
      const status = action === "accept-enquiry" ? "accepted" : "rejected";
      saveRecords(records.map((item) => item.id === record.id ? { ...item, status, updatedAt: new Date().toISOString(), lastActivity: `Enquiry ${status}` } : item));
      return;
    }
    if (action === "accept-visit") setVisitStatus(record.id, "accepted");
    if (action === "reject-visit") setVisitStatus(record.id, "rejected");
    if (action === "complete-visit") setVisitStatus(record.id, "completed");
  });

  document.querySelector("#owner-inbox-list").addEventListener("submit", (event) => {
    const replyForm = event.target.closest("[data-reply-form]");
    const rescheduleForm = event.target.closest("[data-reschedule-form]");
    if (!replyForm && !rescheduleForm) return;
    event.preventDefault();
    const recordId = (replyForm || rescheduleForm).dataset[replyForm ? "replyForm" : "rescheduleForm"];
    const record = records.find((item) => item.id === recordId);
    if (!record) return;
    const data = new FormData(event.target);
    if (replyForm) {
      const reply = String(data.get("reply") || "").trim();
      if (!reply) return;
      saveRecords(records.map((item) => item.id === recordId ? { ...item, reply, updatedAt: new Date().toISOString(), lastActivity: "Owner replied" } : item));
    } else {
      setVisitStatus(recordId, "rescheduled", { proposedDate: String(data.get("date")), proposedTime: String(data.get("time")) });
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey) return;
    records = window.getRentoraCommunications();
    render();
  });
  if (window.location.hash === "#owner-inbox") document.querySelector('[data-view="owner"]').click();
  render();
})();