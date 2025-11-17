// API Base URL
const API_BASE = '/api';

// Session storage for admin token
let adminPassword = null;
let isAdminLoggedIn = false;

// Check login status on page load
function checkAdminSession() {
    const savedPassword = sessionStorage.getItem('adminPassword');
    if (savedPassword) {
        adminPassword = savedPassword;
        isAdminLoggedIn = true;
        showDashboard();
        return true;
    }
    return false;
}

// Login form handler - IMPROVED
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    errorDiv.style.display = 'none';
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Verifying...';
    
    try {
        console.log('Attempting login with password...');
        const response = await fetch(`${API_BASE}/adminLogin`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: password })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            adminPassword = password;
            isAdminLoggedIn = true;
            sessionStorage.setItem('adminPassword', password);
            sessionStorage.setItem('adminLoggedIn', 'true');
            
            console.log('Login successful!');
            showDashboard();
            
            // Load all data
            loadRoutes();
            loadBookings();
            loadUsers();
        } else {
            errorDiv.textContent = '❌ ' + (data.error || 'Login failed. Default password: admin123');
            errorDiv.style.display = 'block';
            console.log('Login failed:', data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = '❌ Connection error. Make sure backend is running!';
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Show dashboard and hide login
function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
}

// Show login and hide dashboard
function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    sessionStorage.removeItem('adminPassword');
    sessionStorage.removeItem('adminLoggedIn');
    isAdminLoggedIn = false;
}

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
            showMessage('addRouteMessage', 'Route added successfully! Seats initialized.', 'success');
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

// Load routes with seat statistics
async function loadRoutes() {
    try {
        const response = await fetch(`${API_BASE}/listRoutes`);
        const routes = await response.json();
        
        const routesList = document.getElementById('routesList');
        
        if (routes.length === 0) {
            routesList.innerHTML = '<p class="text-muted">No routes available</p>';
            return;
        }
        
        // Fetch seat stats for each route
        const routesWithStats = await Promise.all(routes.map(async route => {
            try {
                const statsResponse = await fetch(`${API_BASE}/getSeatStats/${route.id}`);
                const stats = await statsResponse.json();
                return { ...route, stats };
            } catch {
                return { ...route, stats: null };
            }
        }));
        
        routesList.innerHTML = routesWithStats.map(route => {
            const fare = route.ticket_price || (route.distance * 0.5);
            const stats = route.stats;
            
            return `
                <div class="admin-route-item mb-3 p-3 border rounded">
                    <div class="route-details">
                        <strong>${route.from} → ${route.to}</strong><br>
                        <small>Distance: ${route.distance} km</small><br>
                        <small class="text-success">Fare: $${fare.toFixed(2)}</small><br>
                        ${route.id ? `<small class="text-muted">Route ID: ${route.id}</small>` : ''}
                        
                        ${stats ? `
                            <div class="mt-2">
                                <span class="badge bg-success">Available: ${stats.available}</span>
                                <span class="badge bg-danger">Booked: ${stats.booked}</span>
                                <span class="badge bg-warning text-dark">Reserved: ${stats.reserved}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${route.id ? `
                        <button class="btn btn-sm btn-info mt-2" onclick="viewRouteSeats(${route.id})">
                            View Seats
                        </button>
                        <button class="btn btn-danger btn-sm mt-2" onclick="removeRoute(${route.id})">
                            Remove
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading routes:', error);
        document.getElementById('routesList').innerHTML = 
            '<p class="text-danger">Error loading routes</p>';
    }
}

// View detailed seat allocation for a route
async function viewRouteSeats(routeId) {
    try {
        const response = await fetch(`${API_BASE}/getSeats/${routeId}`);
        const seats = await response.json();
        
        if (!seats || seats.length === 0) {
            alert('No seat data available for this route');
            return;
        }
        
        // Group seats by status
        const available = seats.filter(s => s.status === 'Available').length;
        const booked = seats.filter(s => s.status === 'Booked');
        const reserved = seats.filter(s => s.status === 'Reserved').length;
        
        let message = `Seat Details for Route ${routeId}\n\n`;
        message += `Total Seats: ${seats.length}\n`;
        message += `Available: ${available}\n`;
        message += `Booked: ${booked.length}\n`;
        message += `Reserved: ${reserved}\n\n`;
        
        if (booked.length > 0) {
            message += 'Booked Seats:\n';
            booked.forEach(seat => {
                message += `  ${seat.seatID} - User: ${seat.userID} - Booking: ${seat.bookingID}\n`;
            });
        }
        
        alert(message);
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading seat details');
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

// Load bookings with enhanced details
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
        
        bookingsList.innerHTML = bookings.map(booking => {
            const bookingID = booking.bookingID || 'N/A';
            const route = booking.routeInfo || 'N/A';
            const userID = booking.userID || 'N/A';
            const seats = booking.seatIDs ? booking.seatIDs.join(', ') : '0';
            const price = booking.totalPrice || 0;
            const timestamp = booking.timestamp || new Date().toISOString();
            const status = booking.status || 'Active';
            
            const statusBadge = status === 'Active' 
                ? '<span class="badge bg-success">Active</span>'
                : '<span class="badge bg-secondary">Cancelled</span>';
            
            return `
                <tr class="${status === 'Cancelled' ? 'table-secondary' : ''}">
                    <td>${bookingID}</td>
                    <td>${route}</td>
                    <td>${userID}</td>
                    <td><small>${seats}</small></td>
                    <td>$${parseFloat(price).toFixed(2)}</td>
                    <td>
                        ${new Date(timestamp).toLocaleString()}<br>
                        ${statusBadge}
                    </td>
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

// Load users with enhanced statistics
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/listUsers?password=${encodeURIComponent(adminPassword)}`);
        const users = await response.json();
        
        const usersList = document.getElementById('usersList');
        
        if (users.length === 0) {
            usersList.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">No users registered</td>
                </tr>
            `;
            return;
        }
        
        usersList.innerHTML = users.map(user => {
            const bookingsCount = user.totalBookings || 0;
            const totalSpent = user.totalSpent || 0;
            
            return `
                <tr>
                    <td>${user.userID}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>
                        ${bookingsCount} booking(s)<br>
                        <small class="text-success">Total: $${totalSpent.toFixed(2)}</small>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersList').innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">Error loading users</td>
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
    if (!checkAdminSession()) {
        // Not logged in, stay on login page
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('dashboardSection').style.display = 'none';
    }
});