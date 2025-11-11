# Bus Route Finder & Booking System

## Project Overview
A full-stack bus route finding and booking system with C++ computational backend, Flask API, MySQL/SQLite database, and interactive Leaflet.js map visualization.

## Recent Changes
- **2025-11-10**: Initial project setup
  - Created C++ backend logic for route finding (Dijkstra's algorithm)
  - Implemented Flask API with SQLAlchemy models
  - Built responsive frontend with Leaflet.js map
  - Created admin panel for route management
  - Added support for both file-based demo mode and database mode
  - Sample data for 8 major Indian city routes

## Project Architecture

### Backend Components
1. **C++ Logic** (`backend/logic.cpp`):
   - Route finding using Dijkstra's algorithm
   - Fare calculation
   - Accepts JSON input via stdin, outputs JSON
   - Compiled to `backend/logic` binary

2. **Flask API** (`app.py`):
   - RESTful API endpoints
   - SQLAlchemy ORM for database
   - Calls C++ binary via subprocess
   - Supports MySQL and SQLite
   - File-based fallback mode

3. **Database**:
   - Routes: from_city, to_city, distance, coords
   - Buses: route_id, operator, seats, fare_modifier
   - Bookings: route_id, user_name, seats_booked, total_price

### Frontend Components
1. **User Interface** (`frontend/index.html`):
   - Route search form
   - Leaflet.js interactive map
   - Booking form
   - Available routes list

2. **Admin Panel** (`frontend/admin.html`):
   - Password-protected access
   - Add/remove routes
   - View all bookings
   - Real-time updates

## Environment Configuration

### Current Setup
- **USE_DB**: `false` (using file-based demo mode)
- **DATABASE_URL**: `sqlite:///data.db`
- **ADMIN_PASSWORD**: `admin123`

### Running Modes
- **Demo Mode** (`USE_DB=false`): Uses `backend/routes.txt` and `backend/bookings.txt`
- **Production Mode** (`USE_DB=true`): Uses MySQL/SQLite database

## Key Features
- Real-time route finding with C++ optimization
- Interactive map visualization
- Simple booking system
- Admin route management
- Supports both file and database modes

## API Endpoints
- `POST /api/findRoute` - Find optimal route
- `GET /api/listRoutes` - List all routes
- `POST /api/addRoute` - Add route (admin)
- `POST /api/removeRoute` - Remove route (admin)
- `POST /api/book` - Book tickets
- `GET /api/listBookings` - View bookings (admin)
- `POST /api/adminLogin` - Admin authentication

## User Preferences
None specified yet.

## Next Steps
- Consider adding user authentication
- Implement payment gateway integration
- Add email/SMS notifications for bookings
- Enhance route optimization algorithms
