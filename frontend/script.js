// API Base URL 
const API_BASE = '/api';

// Global variables
let map;
let currentRoute = null;
let routeLayer = null;
let currentUser = null;
let selectedSeats = [];
let allRoutes = [];

// ========================
// User Profile Management
// ========================

// Load user from localStorage if exists
function loadUserFromStorage() {
    const userData = localStorage.getItem('busRouterCurrentUser');
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            document.getElementById('userID').value = currentUser.userID || '';
            document.getElementById('userNameProfile').value = currentUser.name || '';
            document.getElementById('userEmail').value = currentUser.email || '';
            displayUserProfile();
            return true;
        } catch (e) {
            console.error('Error loading user from storage:', e);
            localStorage.removeItem('busRouterCurrentUser');
        }
    }
    return false;
}

// Save user to localStorage
function saveUserToStorage(user) {
    if (user) {
        localStorage.setItem('busRouterCurrentUser', JSON.stringify(user));
    }
}

// Clear user from storage and session
function clearUserSession() {
    currentUser = null;
    localStorage.removeItem('busRouterCurrentUser');
    document.getElementById('currentUserInfo').innerHTML = '';
    document.getElementById('logoutBtn').style.display = 'none';
}

// Show notification
function showNotification(message, type = 'info', duration = 4000) {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, duration);
}

// Initialize map
function initMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
}

// Load all available routes
async function loadAllRoutes() {
    try {
        const response = await fetch(`${API_BASE}/listRoutes`);
        allRoutes = await response.json();
        const routesContainer = document.getElementById('allRoutes');

        if (!allRoutes.length) {
            routesContainer.innerHTML = '<p class="text-muted">No routes available</p>';
            return;
        }

        routesContainer.innerHTML = allRoutes.map(route => `
            <div class="route-item">
                <strong>${route.from} → ${route.to}</strong><br>
                <small>Distance: ${route.distance} km</small><br>
                <small class="text-success">Fare: Rs.${(route.ticket_price || (route.distance * 0.5)).toFixed(2)}</small>
                <br><button class="btn btn-sm btn-primary mt-1" onclick="viewRouteDetails(${route.id})">View Details</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading routes:', error);
        document.getElementById('allRoutes').innerHTML = 
            '<p class="text-danger">Error loading routes</p>';
    }
}

// View route details with seat availability
async function viewRouteDetails(routeId) {
    const route = allRoutes.find(r => r.id === routeId);
    if (!route) return;
    
    try {
        // Get seat statistics
        const statsResponse = await fetch(`${API_BASE}/getSeatStats/${routeId}`);
        const stats = await statsResponse.json();
        
        alert(`Route: ${route.from} → ${route.to}\n\n` +
              `Distance: ${route.distance} km\n` +
              `Fare: Rs.${(route.ticket_price || (route.distance * 0.5)).toFixed(2)}\n\n` +
              `Seat Availability:\n` +
              `Total: ${stats.total || 40}\n` +
              `Available: ${stats.available}\n` +
              `Booked: ${stats.booked}\n` +
              `Reserved: ${stats.reserved}`);
    } catch (error) {
        console.error('Error fetching route details:', error);
    }
}

// -------------------------
// User Profile Management
// -------------------------
async function createUser(userID, name, email) {
    try {
        const response = await fetch(`${API_BASE}/createUser`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({userID, name, email})
        });
        const data = await response.json();
        
        if (data.success || !data.error) {
            currentUser = {
                userID,
                name,
                email,
                totalBookings: data.totalBookings || 0,
                totalSpent: data.totalSpent || 0
            };
            saveUserToStorage(currentUser);
            displayUserProfile();
            return true;
        } else {
            alert('Error creating user: ' + (data.error || 'Unknown'));
            return false;
        }
    } catch (err) {
        console.error('Error creating user:', err);
        return false;
    }
}

async function getUser(userID) {
    try {
        const response = await fetch(`${API_BASE}/getUser/${userID}`);
        const data = await response.json();
        
        if (data.error) {
            return null;
        } else {
            currentUser = data;
            saveUserToStorage(currentUser);
            displayUserProfile();
            return data;
        }
    } catch (err) {
        console.error('Error fetching user:', err);
        return null;
    }
}

function displayUserProfile() {
    if (!currentUser) return;
    
    const infoDiv = document.getElementById('currentUserInfo');
    infoDiv.innerHTML = `
        <div class="alert alert-info mb-0">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>✓ Logged in as:</strong> ${currentUser.name}<br>
                    <small class="text-muted">ID: ${currentUser.userID}</small><br>
                    <small class="text-muted">Email: ${currentUser.email}</small><br>
                    <small class="text-success fw-bold">Bookings: ${currentUser.totalBookings || 0} | Spent: $${(currentUser.totalSpent || 0).toFixed(2)}</small>
                </div>
                <div>
                    <button class="btn btn-sm btn-secondary me-2" onclick="viewMyBookings()">📋 My Bookings</button>
                    <button class="btn btn-sm btn-danger" onclick="clearUserSession(); location.reload()">🚪 Logout</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('logoutBtn').style.display = 'inline-block';
}

async function viewMyBookings() {
    if (!currentUser) {
        alert('Please login first');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/getUserBookings/${currentUser.userID}`);
        const bookings = await response.json();
        
        if (!bookings.length) {
            alert('You have no bookings yet');
            return;
        }
        
        let message = 'Your Bookings:\n\n';
        bookings.forEach((booking, index) => {
            message += `${index + 1}. ${booking.routeInfo}\n`;
            message += `   Seats: ${booking.seatIDs.join(', ')}\n`;
            message += `   Price: $${booking.totalPrice.toFixed(2)}\n`;
            message += `   Status: ${booking.status}\n`;
            message += `   Time: ${new Date(booking.timestamp).toLocaleString()}\n\n`;
        });
        
        alert(message);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        alert('Error loading bookings');
    }
}

// User form handler
document.getElementById('userForm').addEventListener('submit', async e => {
    e.preventDefault();
    const userID = document.getElementById('userID').value.trim();
    const name = document.getElementById('userNameProfile').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    
    if (!userID || !name || !email) {
        showNotification('❌ Please fill all user fields', 'warning');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Logging in...';

    try {
        // Try to get existing user
        let user = await getUser(userID);
        
        // If user doesn't exist, create new
        if (!user) {
            const success = await createUser(userID, name, email);
            if (!success) {
                showNotification('❌ Failed to create user', 'danger');
                return;
            }
            showNotification(`✅ Welcome ${name}! Profile created successfully`, 'success');
        } else {
            showNotification(`✅ Welcome back ${name}!`, 'info');
        }

        // Show booking card if route is selected
        if (currentUser && currentRoute) {
            document.getElementById('bookingCard').style.display = 'block';
            await loadSeatsForRoute(currentRoute.id);
        }
    } catch (err) {
        showNotification('❌ Login error: ' + err.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '✅ Login / Register';
    }
});

// -------------------------
// Route Search & Map
// -------------------------
document.getElementById('searchForm').addEventListener('submit', async e => {
    e.preventDefault();
    const from = document.getElementById('fromCity').value.trim();
    const to = document.getElementById('toCity').value.trim();
    const resultsDiv = document.getElementById('results');
    
    resultsDiv.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div> Searching...';

    // Find matching route
    const matchedRoute = allRoutes.find(r => 
        r.from.toLowerCase() === from.toLowerCase() && 
        r.to.toLowerCase() === to.toLowerCase()
    );
    
    if (!matchedRoute) {
        resultsDiv.innerHTML = '<div class="alert alert-warning mb-0">⚠️ No direct route found</div>';
        currentRoute = null;
        document.getElementById('bookingCard').style.display = 'none';
        showNotification('⚠️ No direct route found for ' + from + ' to ' + to, 'warning');
        return;
    }

    currentRoute = {
        ...matchedRoute,
        fare: matchedRoute.ticket_price || (matchedRoute.distance * 0.5)
    };
    
    displayRoute(currentRoute);

    // Show booking form only if user exists
    if (currentUser) {
        document.getElementById('bookingCard').style.display = 'block';
        await loadSeatsForRoute(matchedRoute.id);
        showNotification(`✅ Route found! ${from} → ${to}`, 'success');
    } else {
        showNotification('⚠️ Please login first to book tickets', 'info');
    }
});

function displayRoute(route) {
    const resultsDiv = document.getElementById('results');

    resultsDiv.innerHTML = `
        <div class="route-info fade-in">
            <h6>Route Found!</h6>
            <p><strong>Path:</strong> ${route.from} → ${route.to}</p>
            <div class="mb-2">
                <span class="badge bg-primary">Distance: ${route.distance.toFixed(2)} km</span>
                <span class="badge bg-success">Fare: $${route.fare.toFixed(2)}</span>
            </div>
        </div>
    `;
    
    displayRouteOnMap(route);
}

function displayRouteOnMap(route) {
    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.layerGroup().addTo(map);

    if (route.coords && route.coords.length > 0) {
        L.marker([route.coords[0].lat, route.coords[0].lng])
            .bindPopup('Start: ' + route.from)
            .addTo(routeLayer);
        
        const endIdx = route.coords.length - 1;
        L.marker([route.coords[endIdx].lat, route.coords[endIdx].lng])
            .bindPopup('End: ' + route.to)
            .addTo(routeLayer);

        const polyline = L.polyline(
            route.coords.map(c => [c.lat, c.lng]), 
            {color:'blue', weight:4, opacity:0.7}
        ).addTo(routeLayer);
        
        map.fitBounds(polyline.getBounds());
    }
}

// -------------------------
// Seat Selection & Booking
// -------------------------
async function loadSeatsForRoute(routeID) {
    if (!routeID) return;
    
    try {
        const response = await fetch(`${API_BASE}/getSeats/${routeID}`);
        const seats = await response.json();
        
        renderSeatMap(seats);
    } catch (err) {
        console.error('Error fetching seats:', err);
        renderSeatMap([]);
    }
}

function renderSeatMap(seats) {
    const seatMap = document.getElementById('seatMap');
    seatMap.innerHTML = '';
    selectedSeats = [];
    
    // Create grid layout
    seatMap.style.display = 'grid';
    seatMap.style.gridTemplateColumns = 'repeat(5, 1fr)';
    seatMap.style.gap = '10px';
    seatMap.style.padding = '20px';
    
    // If no seats data, create default 40 seats
    if (!seats || seats.length === 0) {
        for (let i = 1; i <= 40; i++) {
            createSeatElement(`S${i}`, 'Available', seatMap);
        }
    } else {
        seats.forEach(seat => {
            createSeatElement(seat.seatID, seat.status, seatMap);
        });
    }
    
    updateTotalPrice();
}

function createSeatElement(seatID, status, container) {
    const seat = document.createElement('div');
    seat.className = 'seat';
    const seatNumber = seatID.split('S').pop() || seatID;
    seat.textContent = seatNumber;
    seat.dataset.seatId = seatID;
    seat.title = `Seat ${seatNumber}`;
    
    if (status === 'Booked') {
        seat.classList.add('booked');
        seat.title = `Seat ${seatNumber} - Already Booked`;
    } else if (status === 'Reserved') {
        seat.classList.add('reserved');
        seat.title = `Seat ${seatNumber} - Reserved`;
    } else {
        seat.classList.add('available');
    }
    
    seat.addEventListener('click', () => {
        if (seat.classList.contains('booked') || seat.classList.contains('reserved')) {
            return;
        }
        
        seat.classList.toggle('selected');
        
        if (seat.classList.contains('selected')) {
            selectedSeats.push(seatID);
        } else {
            selectedSeats = selectedSeats.filter(s => s !== seatID);
        }
        
        updateTotalPrice();
    });
    
    container.appendChild(seat);
}

function updateTotalPrice() {
    if (!currentRoute) return;
    const totalPrice = (currentRoute.fare || 0) * selectedSeats.length;
    document.getElementById('totalPrice').textContent = `$${totalPrice.toFixed(2)}`;
    
    // Update selected seats display
    if (selectedSeats.length > 0) {
        document.getElementById('selectedSeatsDisplay').textContent = selectedSeats.join(', ');
        document.getElementById('selectedSeatsDisplay').style.color = '#28a745';
    } else {
        document.getElementById('selectedSeatsDisplay').textContent = 'None';
        document.getElementById('selectedSeatsDisplay').style.color = '#6c757d';
    }
}

// Booking submission
document.getElementById('bookingForm').addEventListener('submit', async e => {
    e.preventDefault();
    
    if (!currentRoute || !currentUser) {
        showNotification('❌ Please select a user and route first', 'warning');
        return;
    }
    
    if (!selectedSeats.length) {
        showNotification('❌ Please select at least one seat', 'warning');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Processing...';

    try {
        const response = await fetch(`${API_BASE}/bookSeats`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                routeID: currentRoute.id,
                route_info: `${currentRoute.from} → ${currentRoute.to}`,
                userID: currentUser.userID,
                seatIDs: selectedSeats,
                pricePerSeat: currentRoute.fare
            })
        });
        
        const data = await response.json();

        if (data.success) {
            const totalPrice = currentRoute.fare * selectedSeats.length;
            showNotification(`✅ Booking Confirmed! Booking ID: ${data.bookingID}`, 'success');
            
            // Refresh seat map and user profile
            await loadSeatsForRoute(currentRoute.id);
            await getUser(currentUser.userID);
            selectedSeats = [];
            updateTotalPrice();
        } else {
            showNotification(`❌ Booking failed: ${data.error || 'Unknown error'}`, 'danger');
        }
    } catch (err) {
        console.error('Booking error:', err);
        showNotification('❌ Error processing booking', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '💳 Confirm Booking';
    }
});

// -------------------------
// Initialize Application
// -------------------------
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadAllRoutes();
    
    // Load user from localStorage if available
    if (loadUserFromStorage()) {
        document.getElementById('bookingCard').style.display = currentRoute ? 'block' : 'none';
    }
});