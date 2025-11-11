// API Base URL
const API_BASE = '/api';

// Session storage for admin token
let adminPassword = '';

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const response = await fetch(`${API_BASE}/adminLogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            adminPassword = password;
            sessionStorage.setItem('adminPassword', password);
            
            // Show dashboard, hide login
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('dashboardSection').style.display = 'block';
            
            // Load data
            loadRoutes();
            loadBookings();
        } else {
            errorDiv.textContent = 'Invalid password';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        errorDiv.textContent = 'Login failed. Please try again.';
        errorDiv.style.display = 'block';
    }
});

// Add route form handler
document.getElementById('addRouteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const from = document.getElementById('routeFrom').value.trim();
    const to = document.getElementById('routeTo').value.trim();
    const distance = parseFloat(document.getElementById('routeDistance').value);
    const ticketPriceStr = document.getElementById('ticketPrice').value.trim();
    const ticketPrice = ticketPriceStr ? parseFloat(ticketPriceStr) : null;
    const coordsStr = document.getElementById('routeCoords').value.trim();
    
    let coords = [];
    if (coordsStr) {
        try {
            coords = JSON.parse(coordsStr);
        } catch (error) {
            showMessage('addRouteMessage', 'Invalid coordinates JSON', 'danger');
            return;
        }
    }
    
    try {
        const response = await fetch(`${API_BASE}/addRoute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from,
                to,
                distance,
                ticket_price: ticketPrice,
                coords,
                password: adminPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('addRouteMessage', 'Route added successfully!', 'success');
            document.getElementById('addRouteForm').reset();
            loadRoutes();
        } else {
            showMessage('addRouteMessage', data.error || 'Failed to add route', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('addRouteMessage', 'Error adding route', 'danger');
    }
});

// Load routes
async function loadRoutes() {
    try {
        const response = await fetch(`${API_BASE}/listRoutes`);
        const routes = await response.json();
        
        const routesList = document.getElementById('routesList');
        
        if (routes.length === 0) {
            routesList.innerHTML = '<p class="text-muted">No routes available</p>';
            return;
        }
        
        routesList.innerHTML = routes.map(route => `
            <div class="admin-route-item">
                <div class="route-details">
                    <strong>${route.from} → ${route.to}</strong><br>
                    <small>Distance: ${route.distance} km</small>
                    ${route.ticket_price ? `<br><small class="text-success">Price: $${parseFloat(route.ticket_price).toFixed(2)}</small>` : `<br><small class="text-muted">Price: Auto-calculated</small>`}
                    ${route.id ? `<br><small class="text-muted">ID: ${route.id}</small>` : ''}
                </div>
                ${route.id ? `
                    <button class="btn btn-danger btn-sm" onclick="removeRoute(${route.id})">
                        Remove
                    </button>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading routes:', error);
        document.getElementById('routesList').innerHTML = 
            '<p class="text-danger">Error loading routes</p>';
    }
}

// Remove route
async function removeRoute(routeId) {
    if (!confirm('Are you sure you want to remove this route?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/removeRoute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                route_id: routeId,
                password: adminPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadRoutes();
        } else {
            alert('Failed to remove route: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error removing route');
    }
}

// Load bookings
async function loadBookings() {
    try {
        const response = await fetch(`${API_BASE}/listBookings?password=${encodeURIComponent(adminPassword)}`);
        const bookings = await response.json();
        
        const bookingsList = document.getElementById('bookingsList');
        
        if (bookings.length === 0) {
            bookingsList.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">No bookings yet</td>
                </tr>
            `;
            return;
        }
        
        bookingsList.innerHTML = bookings.map((booking, index) => {
            const id = booking.id || index + 1;
            const route = booking.route || booking.route_info || 'N/A';
            const userName = booking.user_name || 'N/A';
            const seats = booking.seats_booked || booking.seats || 0;
            const price = booking.total_price || booking.price || 0;
            const bookedAt = booking.booked_at || booking.timestamp || new Date().toISOString();
            
            return `
                <tr>
                    <td>${id}</td>
                    <td>${route}</td>
                    <td>${userName}</td>
                    <td>${seats}</td>
                    <td>$${parseFloat(price).toFixed(2)}</td>
                    <td>${new Date(bookedAt).toLocaleString()}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookingsList').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">Error loading bookings</td>
            </tr>
        `;
    }
}

// Show message
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.className = `alert alert-${type}`;
    element.textContent = message;
    element.style.display = 'block';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
    const savedPassword = sessionStorage.getItem('adminPassword');
    if (savedPassword) {
        document.getElementById('adminPassword').value = savedPassword;
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});
