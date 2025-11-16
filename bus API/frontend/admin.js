// ===============================
// ADMIN PANEL LOGIC
// ===============================

const API_BASE = "/api";
let adminPassword = "";

// Safe element fetcher
function safeId(id) {
    const el = document.getElementById(id);
    if (!el) console.warn("Missing element:", id);
    return el;
}

// Show temporary message
function showAddRouteMsg(msg, type) {
    const el = safeId("addRouteMessage");
    if (!el) return;

    el.textContent = msg;
    el.className = "msg " + (type === "danger" ? "danger" : "");
    el.style.display = "block";

    setTimeout(() => (el.style.display = "none"), 3000);
}

// Login error
function showLoginError(msg) {
    const el = safeId("loginError");
    if (!el) return;

    el.textContent = msg;
    el.style.display = "block";

    setTimeout(() => (el.style.display = "none"), 3500);
}

// Escape HTML to prevent broken UI
function escapeHtml(s) {
    if (s == null) return "";
    return String(s).replace(/[&<>\"']/g, (c) => {
        return (
            {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            }[c] || c
        );
    });
}

// ===============================
// LOGIN HANDLER
// ===============================
async function handleLogin(e) {
    if (e) e.preventDefault();

    const pass = safeId("adminPassword").value.trim();

    if (!pass) {
        showLoginError("Enter password");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/adminLogin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: pass }),
        });

        const data = await res.json();

        if (data.success) {
            adminPassword = pass;
            sessionStorage.setItem("adminPassword", pass);

            safeId("loginSection").style.display = "none";
            safeId("dashboardSection").style.display = "block";

            loadRoutes();
            loadBookings();
        } else {
            showLoginError("Invalid password");
        }
    } catch (e) {
        showLoginError("Login failed");
    }
}

// ===============================
// ADD ROUTE
// ===============================
async function handleAddRoute(e) {
    if (e) e.preventDefault();

    const from = safeId("routeFrom").value.trim();
    const to = safeId("routeTo").value.trim();
    const distance = parseFloat(safeId("routeDistance").value) || 0;
    const ticket_price = safeId("ticketPrice").value
        ? parseFloat(safeId("ticketPrice").value)
        : null;

    let coords = [];
    const rawCoords = safeId("routeCoords").value.trim();

    if (rawCoords) {
        try {
            coords = JSON.parse(rawCoords);
        } catch (e) {
            showAddRouteMsg("Invalid coordinates JSON", "danger");
            return;
        }
    }

    if (!from || !to || distance <= 0) {
        showAddRouteMsg("Enter all route details", "danger");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/addRoute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                from,
                to,
                distance,
                ticket_price,
                coords,
                password: adminPassword,
            }),
        });

        const data = await res.json();

        if (data.success) {
            showAddRouteMsg("Route added!", "success");
            safeId("addRouteForm").reset();
            loadRoutes();
        } else {
            showAddRouteMsg(data.error || "Failed", "danger");
        }
    } catch (e) {
        showAddRouteMsg("Network error", "danger");
    }
}

// ===============================
// LOAD ROUTES
// ===============================
async function loadRoutes() {
    try {
        const res = await fetch(`${API_BASE}/listRoutes`);
        const routes = await res.json();

        const container = safeId("routesList");
        if (!container) return;

        if (!routes || routes.length === 0) {
            container.innerHTML = "<div class='muted'>No routes</div>";
            return;
        }

        container.innerHTML = routes
            .map(
                (r) => `
            <div class="route-item" style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <strong>${escapeHtml(r.from)} → ${escapeHtml(r.to)}</strong>
                    <br>
                    <small style="color:var(--muted);">
                        ${escapeHtml(String(r.distance))} km
                        ${
                            r.ticket_price
                                ? " • $" +
                                  parseFloat(r.ticket_price).toFixed(2)
                                : ""
                        }
                    </small>
                </div>
                ${
                    r.id
                        ? `<button class="btn tiny" data-id="${r.id}">Remove</button>`
                        : ""
                }
            </div>`
            )
            .join("");

        // Attach remove handlers
        container.querySelectorAll("button[data-id]").forEach((btn) => {
            btn.addEventListener("click", () => {
                removeRoute(btn.getAttribute("data-id"));
            });
        });
    } catch (e) {
        safeId("routesList").innerHTML =
            "<div class='msg danger'>Error loading routes</div>";
        console.error(e);
    }
}

// ===============================
// REMOVE ROUTE
// ===============================
async function removeRoute(id) {
    if (!confirm("Remove this route?")) return;

    try {
        const res = await fetch(`${API_BASE}/removeRoute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                route_id: Number(id),
                password: adminPassword,
            }),
        });

        const data = await res.json();

        if (data.success) {
            loadRoutes();
        } else {
            alert("Remove failed: " + (data.error || "Unknown"));
        }
    } catch (e) {
        alert("Network error");
    }
}

// ===============================
// LOAD BOOKINGS
// ===============================
async function loadBookings() {
    try {
        const res = await fetch(
            `${API_BASE}/listBookings?password=${encodeURIComponent(
                adminPassword
            )}`
        );

        const data = await res.json();
        const container = safeId("bookingsList");

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = "<div class='muted'>No bookings</div>";
            return;
        }

        container.innerHTML = `
            <table style="width:100%;font-size:13px;">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Route</th>
                        <th>Name</th>
                        <th>Seats</th>
                        <th>Price</th>
                        <th>When</th>
                    </tr>
                </thead>
                <tbody>
                    ${data
                        .map(
                            (b) => `
                        <tr>
                            <td>${b.id}</td>
                            <td>${escapeHtml(b.route || b.route_info)}</td>
                            <td>${escapeHtml(b.user_name)}</td>
                            <td>${escapeHtml(b.seats_booked || b.seats)}</td>
                            <td>$${parseFloat(
                                b.total_price || b.price
                            ).toFixed(2)}</td>
                            <td>${new Date(
                                b.booked_at || b.timestamp
                            ).toLocaleString()}</td>
                        </tr>`
                        )
                        .join("")}
                </tbody>
            </table>
        `;
    } catch (e) {
        safeId(
            "bookingsList"
        ).innerHTML = "<div class='msg danger'>Error loading bookings</div>";
        console.error(e);
    }
}

// ===============================
// AUTO-LOGIN SUPPORT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    const saved = sessionStorage.getItem("adminPassword");

    safeId("loginForm").addEventListener("submit", handleLogin);
    safeId("addRouteForm").addEventListener("submit", handleAddRoute);

    if (saved) {
        safeId("adminPassword").value = saved;
        handleLogin(); // auto login
    }
});
