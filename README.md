# Bus Route Finder & Booking System

A comprehensive bus route finding and booking system built with C++ computational backend, Flask API, and interactive Leaflet.js map visualization.

## Architecture

* **C++ Backend Logic**: Fast route finding using Dijkstra's algorithm, fare calculation
* **Flask API Bridge**: RESTful API endpoints and database management
* **MySQL/SQLite Database**: Persistent storage for routes, buses, and bookings
* **Frontend**: Responsive HTML/CSS/JavaScript with Leaflet.js map visualization
* **Admin Panel**: Secure admin interface for route and booking management

## Features

### User Features

* 🔍 Search routes between cities
* 🗺️ Interactive map visualization with Leaflet.js
* 💰 Automatic fare calculation
* 🎫 Simple booking system
* 📊 View all available routes

### Admin Features

* 🔐 Password-protected admin panel
* ➕ Add new routes with coordinates
* 🗑️ Remove existing routes
* 📋 View all bookings
* 🔄 Real-time updates

## Project Structure

```
project/
├── frontend/
│   ├── index.html          # User interface
│   ├── admin.html          # Admin panel
│   ├── style.css           # Styles
│   ├── script.js           # User interface logic
│   └── admin.js            # Admin panel logic
├── backend/
│   ├── logic.cpp           # C++ route finding algorithm
│   ├── logic.exe           # Compiled binary (Windows)
│   ├── routes.txt          # Sample routes (demo mode)
│   └── bookings.txt        # Sample bookings (demo mode)
├── migrations/
│   ├── db_schema.sql       # MySQL schema
│   └── init_db.py          # Database initialization script
├── app.py                  # Flask application
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

## Installation & Setup (Windows)

### Prerequisites

* Python 3.11+
* g++ compiler (C++17 support, e.g., MinGW or Visual Studio)
* MySQL (optional, SQLite used by default)
* PowerShell for setting environment variables

---

### Quick Start (Demo Mode – File-Based)

1. **Install Python dependencies:**

```powershell
pip install -r requirements.txt
```

2. **Compile C++ backend (Windows):**

```powershell
g++ backend/logic.cpp -O2 -std=c++17 -o backend/logic.exe
```

3. **Set environment variables in PowerShell:**

```powershell
$env:USE_DB = "false"
$env:ADMIN_PASSWORD = "admin123"
```

4. **Run the application:**

```powershell
python app.py
```

5. **Access the app:**

* User Interface: [http://localhost:5000](http://localhost:5000)
* Admin Panel: [http://localhost:5000/admin.html](http://localhost:5000/admin.html)
* Default admin password: `admin123`

---

### Production Mode (Database)

1. **Set up MySQL database (optional):**

```sql
CREATE DATABASE bus_routes;
CREATE USER 'bususer'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON bus_routes.* TO 'bususer'@'localhost';
FLUSH PRIVILEGES;
```

2. **Run database migrations:**

```powershell
python migrations/init_db.py
# Or manually:
mysql -u bususer -p bus_routes < migrations/db_schema.sql
```

3. **Set environment variables in PowerShell:**

```powershell
$env:DATABASE_URL = "mysql+pymysql://bususer:password@localhost/bus_routes"
$env:USE_DB = "true"
$env:ADMIN_PASSWORD = "admin123"
```

4. **Run the application:**

```powershell
python app.py
```

---

### Notes for Windows Users

* Use `.exe` for compiled C++ binary (`backend/logic.exe`) in `app.py` if running on Windows.
* For SQLite demo mode, no MySQL installation is required.
* PowerShell syntax for environment variables uses `$env:VARIABLE_NAME = "value"` instead of `export`.

---

### API Endpoints

**Public:**

* `POST /api/findRoute` – Find optimal route
* `GET /api/listRoutes` – List all routes
* `POST /api/book` – Book tickets

**Admin:**

* `POST /api/adminLogin` – Admin login
* `POST /api/addRoute` – Add route
* `POST /api/removeRoute` – Remove route
* `GET /api/listBookings?password=ADMIN_PASSWORD` – View bookings

---

### Troubleshooting (Windows)

* **C++ binary not found:**

```powershell
g++ backend/logic.cpp -O2 -std=c++17 -o backend/logic.exe
```

* **Database connection errors:**

  * Check `$env:DATABASE_URL`
  * Test MySQL connection using:

```powershell
mysql -h localhost -u bususer -p bus_routes
```

* **Port 5000 in use:**

  * Edit `app.py` and change `app.run(port=5000)` to another port, e.g., 8000

---

### Future Enhancements

* Multi-criteria route optimization (time, cost, comfort)
* Real-time bus tracking
* Payment gateway integration
* Email/SMS notifications
* User accounts and booking history
* Bus seat selection
* Reviews and ratings
* Mobile app (React Native)
* Advanced route algorithms (A*, genetic algorithms)
   