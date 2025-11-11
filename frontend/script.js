// API Base URL
const API_BASE = '/api';

// Global variables
let map;
let currentRoute = null;
let routeLayer = null;

// Initialize map
function initMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5); // Center of India
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
}

// Load all available routes
async function loadAllRoutes() {
    try {
        const response = await fetch(`${API_BASE}/listRoutes`);
        const routes = await response.json();
        
        const routesContainer = document.getElementById('allRoutes');
        
        if (routes.length === 0) {
            routesContainer.innerHTML = '<p class="text-muted">No routes available</p>';
            return;
        }
        
        routesContainer.innerHTML = routes.map(route => `
            <div class="route-item">
                <strong>${route.from} → ${route.to}</strong>
                <br>
                <small>Distance: ${route.distance} km</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading routes:', error);
        document.getElementById('allRoutes').innerHTML = 
            '<p class="text-danger">Error loading routes</p>';
    }
}

// Search for route
document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const from = document.getElementById('fromCity').value.trim();
    const to = document.getElementById('toCity').value.trim();
    const resultsDiv = document.getElementById('results');
    
    resultsDiv.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Searching...';
    
    try {
        const response = await fetch(`${API_BASE}/findRoute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to })
        });
        
        const data = await response.json();
        
        if (data.error) {
            resultsDiv.innerHTML = `
                <div class="alert alert-warning">
                    ${data.error}
                </div>
            `;
            currentRoute = null;
            document.getElementById('bookingCard').style.display = 'none';
            return;
        }
        
        // Display results
        currentRoute = data;
        displayRoute(data);
        
        // Show booking form
        document.getElementById('bookingCard').style.display = 'block';
        updateTotalPrice();
        
    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = `
            <div class="alert alert-danger">
                Error searching for route. Please try again.
            </div>
        `;
    }
});

// Display route information
function displayRoute(route) {
    const resultsDiv = document.getElementById('results');
    
    const pathStr = route.path.join(' → ');
    const timeHours = Math.floor(route.time);
    const timeMinutes = Math.round((route.time - timeHours) * 60);
    
    resultsDiv.innerHTML = `
        <div class="route-info fade-in">
            <h6>Route Found!</h6>
            <p><strong>Path:</strong> ${pathStr}</p>
            <div class="mb-2">
                <span class="badge bg-primary">Distance: ${route.distance.toFixed(2)} km</span>
                <span class="badge bg-info text-dark">Time: ${timeHours}h ${timeMinutes}m</span>
                <span class="badge bg-success">Fare: $${route.fare.toFixed(2)}</span>
            </div>
        </div>
    `;
    
    // Display on map
    displayRouteOnMap(route);
}

// Display route on map
function displayRouteOnMap(route) {
    // Clear existing route
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }
    
    routeLayer = L.layerGroup().addTo(map);
    
    // Add markers for start and end
    if (route.path.length > 0) {
        const startMarker = L.marker([route.coords[0]?.lat || 28.6139, route.coords[0]?.lng || 77.2090])
            .bindPopup(`<b>Start:</b> ${route.path[0]}`)
            .addTo(routeLayer);
        
        const endIdx = route.coords.length - 1;
        if (endIdx > 0) {
            const endMarker = L.marker([route.coords[endIdx]?.lat || 19.0760, route.coords[endIdx]?.lng || 72.8777])
                .bindPopup(`<b>End:</b> ${route.path[route.path.length - 1]}`)
                .addTo(routeLayer);
        }
    }
    
    // Draw route line
    if (route.coords && route.coords.length > 0) {
        const latLngs = route.coords.map(c => [c.lat, c.lng]);
        const polyline = L.polyline(latLngs, {
            color: 'blue',
            weight: 4,
            opacity: 0.7
        }).addTo(routeLayer);
        
        // Fit map to route bounds
        map.fitBounds(polyline.getBounds());
    }
}

// Update total price based on seats
function updateTotalPrice() {
    if (!currentRoute) return;
    
    const seats = parseInt(document.getElementById('seats').value) || 1;
    const totalPrice = currentRoute.fare * seats;
    
    document.getElementById('totalPrice').textContent = `$${totalPrice.toFixed(2)}`;
}

document.getElementById('seats').addEventListener('input', updateTotalPrice);

// Book ticket
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentRoute) {
        alert('Please search for a route first');
        return;
    }
    
    const userName = document.getElementById('userName').value.trim();
    const seats = parseInt(document.getElementById('seats').value);
    const price = currentRoute.fare * seats;
    const routeInfo = currentRoute.path.join(' → ');
    
    try {
        const response = await fetch(`${API_BASE}/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                route_info: routeInfo,
                user_name: userName,
                seats: seats,
                price: price,
                route_id: 0
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✓ ${data.message}\n\nRoute: ${routeInfo}\nSeats: ${seats}\nTotal: $${price.toFixed(2)}`);
            
            // Reset form
            document.getElementById('bookingForm').reset();
            updateTotalPrice();
        } else {
            alert('Booking failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error booking ticket. Please try again.');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadAllRoutes();
});
