(() => {
  const storageKey = "rentora:communications";

  function dateAfter(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function demoRecords() {
    return [
      { id: "demo-enquiry-willow", propertyId: "willow-house", name: "Maya Chen", email: "maya.demo@example.com", type: "Availability", message: "Is the home available for a November move-in? I would also like to learn about the lease term.", status: "pending", reply: "", createdAt: dateAfter(-1), visit: { status: "pending", date: dateAfter(4), time: "Afternoon, 12–4 pm" } },
      { id: "demo-enquiry-casa", propertyId: "casa-sol", name: "Jordan Lee", email: "jordan.demo@example.com", type: "Property details", message: "Could you share a little more about the garden and parking arrangements?", status: "accepted", reply: "The garden is private, and one off-street space is included.", createdAt: dateAfter(-3), visit: { status: "accepted", date: dateAfter(2), time: "Morning, 9 am–12 pm" } },
      { id: "demo-enquiry-studio", propertyId: "the-goodwin", name: "Riley Morgan", email: "riley.demo@example.com", type: "Move-in timing", message: "I am looking for a place from mid October. Is that timing possible?", status: "rejected", reply: "This home is no longer available for that move-in window.", createdAt: dateAfter(-5), visit: { status: "rejected", date: dateAfter(1), time: "Early evening, 4–7 pm" } },
      { id: "demo-enquiry-lakeview", propertyId: "lakeview-flat", name: "Sam Rivera", email: "sam.demo@example.com", type: "Lease terms", message: "I would like to understand the lease length and what is included in the rent.", status: "completed", reply: "The standard lease is twelve months. Utilities are separate.", createdAt: dateAfter(-8), visit: { status: "completed", date: dateAfter(-2), time: "Afternoon, 12–4 pm" } },
      { id: "demo-enquiry-garden", propertyId: "garden-room", name: "Alex Kim", email: "alex.demo@example.com", type: "Availability", message: "Is the room still available? I can visit next week if so.", status: "accepted", reply: "Yes, it is available. I have suggested another time for the visit.", createdAt: dateAfter(-2), visit: { status: "rescheduled", date: dateAfter(3), time: "Morning, 9 am–12 pm", proposedDate: dateAfter(5), proposedTime: "Afternoon, 12–4 pm" } }
    ];
  }

  window.RENTORA_COMMUNICATIONS_KEY = storageKey;
  window.getRentoraCommunications = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === null) {
        const records = demoRecords();
        localStorage.setItem(storageKey, JSON.stringify(records));
        return records;
      }
      const records = JSON.parse(stored);
      return Array.isArray(records) ? records : [];
    } catch {
      return [];
    }
  };
  window.saveRentoraCommunications = (records) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(records));
      return true;
    } catch {
      return false;
    }
  };
})();