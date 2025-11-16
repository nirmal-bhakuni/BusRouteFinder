// ==========================
// GLOBAL VARIABLES
// ==========================
const API_BASE = "/api";

let map;
let routeLayer = null;
let allRoutes = [];
let currentRoute = null;

// ==========================
// SAFE ELEMENT ACCESSOR
// ==========================
function safeId(id) {
    const el = document.getElementById(id);
    if (!el) console.warn("Missing element:", id);
    return el;
}

// ==========================
// INITIALIZE MAP
// ==========================
function initMap() {
    try {
        map = L.map("map").setView([20.5937, 78.9629], 5);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19,
        }).addTo(map);
    } catch (e) {
        console.error("Map init error:", e);
    }
}

// ==========================
// LOAD ALL ROUTES
// ==========================
async function loadAllRoutes() {
    try {
        const res = await fetch(`${API_BASE}/listRoutes`);
        allRoutes = await res.json();

        renderAllRoutes(allRoutes);
        updateStats();
    } catch (e) {
        const el = safeId("allRoutes");
        if (el) el.innerHTML = "<div class='msg danger'>Unable to load routes</div>";
        console.error(e);
    }
}

// ==========================
// RENDER ROUTE LIST
// ==========================
function renderAllRoutes(routes) {
    const container = safeId("allRoutes");
    if (!container) return;

    if (!routes || routes.length === 0) {
        container.innerHTML = "<div class='muted'>No routes available</div>";
        return;
    }

    container.innerHTML = routes
        .map((r) => {
            const price =
                r.ticket_price != null && r.ticket_price !== ""
                    ? `$${parseFloat(r.ticket_price).toFixed(2)}`
                    : "Auto";

            return `
            <div class="route-item">
                <div>
                    <div style="font-weight:700">${r.from} → ${r.to}</div>
                    <div style="font-size:13px;color:var(--muted);">
                        Distance: ${r.distance} km • Price: ${price}
                    </div>
                </div>
                <button class="btn tiny" data-from="${r.from}" data-to="${r.to}">
                    Show
                </button>
            </div>`;
        })
        .join("");

    // Attach show-route handlers
    container.querySelectorAll("button[data-from]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const from = btn.getAttribute("data-from");
            const to = btn.getAttribute("data-to");

            safeId("fromCity").value = from;
            safeId("toCity").value = to;

            safeId("searchForm").dispatchEvent(new Event("submit"));
        });
    });
}

// ==========================
// SEARCH ROUTE
// ==========================
async function handleSearch(e) {
    e.preventDefault();

    const from = safeId("fromCity").value.trim();
    const to = safeId("toCity").value.trim();
    const results = safeId("results");

    if (!from || !to) {
        results.innerHTML = "<div class='route-info'>Enter both cities.</div>";
        return;
    }

    results.innerHTML = "<div class='route-info'>Searching...</div>";

    try {
        const res = await fetch(`${API_BASE}/findRoute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from, to }),
        });

        const data = await res.json();

        if (data.error) {
            results.innerHTML = `<div class='route-info'>${data.error}</div>`;
            hideBooking();
            return;
        }

        currentRoute = data;
        displayRoute(data);
        showBooking();
    } catch (e) {
        console.error(e);
        results.innerHTML = "<div class='route-info'>Network error</div>";
    }
}

// ==========================
// DISPLAY ROUTE DETAILS
// ==========================
function displayRoute(route) {
    const results = safeId("results");

    const path = route.path ? route.path.join(" → ") : "—";
    const fare =
        route.fare != null ? `$${parseFloat(route.fare).toFixed(2)}` : "Auto";

    results.innerHTML = `
        <div class="route-info">
            <h6>Route Found</h6>
            <div style="margin-bottom:8px;">${path}</div>
            <span class="badge">Distance: ${route.distance.toFixed(2)} km</span>
            <span class="badge">Time: ${
                Math.floor(route.time)
            }h ${Math.round((route.time % 1) * 60)}m</span>
            <span class="badge">Fare: ${fare}</span>
        </div>
    `;

    drawOnMap(route);
    updateTotalPrice();
}

// ==========================
// DRAW ROUTE ON MAP
// ==========================
function drawOnMap(route) {
    try {
        if (routeLayer) map.removeLayer(routeLayer);

        routeLayer = L.layerGroup().addTo(map);

        // If coordinates exist
        if (route.coords && route.coords.length > 0) {
            const latlngs = route.coords.map((c) => [c.lat, c.lng]);
            const poly = L.polyline(latlngs, {
                weight: 5,
                opacity: 0.9,
            }).addTo(routeLayer);

            L.circleMarker(latlngs[0], { radius: 7 })
                .bindPopup("Start")
                .addTo(routeLayer);

            L.circleMarker(latlngs[latlngs.length - 1], { radius: 7 })
                .bindPopup("End")
                .addTo(routeLayer);

            map.fitBounds(poly.getBounds(), { padding: [40, 40] });
        } else {
            // Fallback (no coords)
            map.setView([20.5937, 78.9629], 5);
        }
    } catch (e) {
        console.error("Map draw error:", e);
    }
}

// ==========================
// BOOKING UI
// ==========================
function showBooking() {
    safeId("bookingCard").style.display = "block";
}

function hideBooking() {
    safeId("bookingCard").style.display = "none";
}

function updateTotalPrice() {
    if (!currentRoute) return;

    const seats = parseInt(safeId("seats").value) || 1;
    const total = (currentRoute.fare || 0) * seats;

    safeId("totalPrice").textContent = `$${total.toFixed(2)}`;
}

safeId("seats").addEventListener("input", updateTotalPrice);

// ==========================
// BOOK TICKET
// ==========================
async function handleBooking(e) {
    e.preventDefault();

    if (!currentRoute) {
        alert("Search a route first.");
        return;
    }

    const userName = safeId("userName").value.trim();
    const seats = parseInt(safeId("seats").value);
    const price = (currentRoute.fare || 0) * seats;

    if (!userName) {
        alert("Enter your name.");
        return;
    }

    const routeInfo = currentRoute.path
        ? currentRoute.path.join(" → ")
        : `${safeId("fromCity").value} → ${safeId("toCity").value}`;

    try {
        const res = await fetch(`${API_BASE}/book`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                route_info: routeInfo,
                user_name: userName,
                seats: seats,
                price: price,
                route_id: currentRoute.route_id || 0,
            }),
        });

        const data = await res.json();

        if (data.success) {
            alert(`Booking Confirmed!\n${data.message}`);
            safeId("bookingForm").reset();
            updateTotalPrice();
            loadRecentBookings();
        } else {
            alert("Booking failed: " + (data.error || "Unknown error"));
        }
    } catch (e) {
        console.error(e);
        alert("Network error while booking.");
    }
}

// ==========================
// CLEAR MAP
// ==========================
function handleClear() {
    if (routeLayer) map.removeLayer(routeLayer);
    currentRoute = null;
    safeId("results").innerHTML = "";
    hideBooking();
}

// ==========================
// STATS + RECENT BOOKINGS
// ==========================
async function loadRecentBookings() {
    try {
        const res = await fetch(
            `${API_BASE}/listBookings?password=${encodeURIComponent("admin123")}`
        );

        const data = await res.json();
        const container = safeId("recentBookings");

        if (!Array.isArray(data)) {
            container.innerHTML = "<div class='muted'>No bookings</div>";
            return;
        }

        container.innerHTML = data
            .slice(0, 6)
            .map(
                (b) =>
                    `<div class="booking-row">
                <div style="flex:1">${b.user_name} 
                <br><small style='color:var(--muted)'>${b.route || b.route_info}</small></div>
                <strong>$${(b.total_price || b.price).toFixed(2)}</strong>
            </div>`
            )
            .join("");

        safeId("statBookings").textContent = data.length || 0;
    } catch (e) {
        console.warn("Recent bookings error:", e);
        safeId("recentBookings").innerHTML = "<div class='muted'>N/A</div>";
    }
}

function updateStats() {
    safeId("statRoutes").textContent = allRoutes.length || 0;

    const fares = allRoutes
        .map((r) => r.ticket_price)
        .filter((x) => x != null);

    const avg =
        fares.length > 0
            ? fares.reduce((a, b) => a + Number(b), 0) / fares.length
            : 0;

    safeId("statAvgFare").textContent = avg ? `$${avg.toFixed(2)}` : "—";
}

// ==========================
// EVENT WIRING
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    initMap();
    loadAllRoutes();
    loadRecentBookings();

    safeId("searchForm").addEventListener("submit", handleSearch);
    safeId("bookingForm").addEventListener("submit", handleBooking);
    safeId("clearMap").addEventListener("click", handleClear);

    safeId("zoomToAll").addEventListener("click", () => {
        if (routeLayer) map.fitBounds(routeLayer.getBounds());
    });

    safeId("fitRoute").addEventListener("click", () => {
        if (routeLayer) map.fitBounds(routeLayer.getBounds());
    });
});
