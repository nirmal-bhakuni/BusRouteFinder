# 🚌 Bus Route Finder - Complete Setup & Usage Guide

## 📋 What's Working Now

✅ **Optimized Backend** - Much shorter, cleaner code (~350 lines)
✅ **User Profiles** - Stored and persist across restarts
✅ **Seat Allocation** - Track available, booked, reserved seats
✅ **Bookings** - Create, cancel, view bookings
✅ **Admin Panel** - Full control with password protection
✅ **Data Persistence** - All data saved to files

---

## 🚀 Quick Start

### Step 1: Start the Flask Server

```bash
cd D:\BusRouteFinder
python app.py
```

You should see:
```
Running in FILE mode with C++ backend
Admin password: admin123
Initialized seats for X routes
Running on http://0.0.0.0:5000
```

### Step 2: Open the Application

**User Interface:** `http://localhost:5000`
**Admin Panel:** `http://localhost:5000/admin.html`

---

## 👥 User Features

### 1. Create Account
1. Enter User ID: `john123`
2. Enter Name: `John Doe`
3. Enter Email: `john@example.com`
4. Click "✅ Login / Register"

**What happens:**
- User profile is created
- Stored in: `backend/users.txt`
- Data persists on refresh and server restart

### 2. Search Routes
1. Enter "From" city: `Delhi`
2. Enter "To" city: `Agra`
3. Click "🔎 Search Routes"

**What happens:**
- Route is displayed
- Map shows the route
- Seat availability shown

### 3. Book Seats
1. Click on available seats (gray)
2. Selected seats turn green
3. See total price
4. Click "💳 Confirm Booking"

**What happens:**
- Booking created with ID (e.g., BK1000)
- Seats marked as "Booked"
- User stats updated (total bookings, total spent)
- Data stored in: `backend/bookings.txt` and `backend/seats.txt`

### 4. View Bookings
- Click "📋 My Bookings"
- See all your bookings

### 5. Cancel Booking
- Click booking details
- Cancel if needed
- Seats become available again

---

## 🔐 Admin Panel

### Login

1. Open: `http://localhost:5000/admin.html`
2. Enter password: **`admin123`**
3. Click "✓ Login as Admin"

### Admin Features

#### 1. **Add New Routes** ➕
```
From City: Mumbai
To City: Pune
Distance: 148 km
Ticket Price: $85
Coordinates: [{"lat":19.0760,"lng":72.8777},{"lat":18.5204,"lng":73.8567}]
```
- Click "Add Route & Initialize Seats"
- 40 seats automatically created per route

#### 2. **View All Routes** 🚍
- See all routes with seat stats:
  - Total seats: 40
  - Available: X
  - Booked: X
  - Reserved: X

#### 3. **Manage Users** 👥
- View all registered users
- See user info:
  - User ID
  - Name
  - Email
  - Total bookings
  - Total amount spent

#### 4. **View All Bookings** 📋
- See every booking:
  - Booking ID
  - User who booked
  - Route taken
  - Seats booked
  - Total price
  - Date/Time
  - Status (Active/Cancelled)

#### 5. **System Statistics** 📊
- Total routes
- Total bookings
- Registered users
- Total revenue

---

## 💾 Data Storage

All data is stored in human-readable text files:

### User Data: `backend/users.txt`
```
john123|John Doe|john@example.com|2|250.00
alice456|Alice Smith|alice@example.com|1|85.00
```

### Booking Data: `backend/bookings.txt`
```
BK1000|john123|Delhi to Agra|S1,S2,S3|200.00|2025-11-16 10:30:45|Active
BK1001|alice456|Mumbai to Pune|S5,S10|170.00|2025-11-16 11:15:30|Active
```

### Seat Data: `backend/seats.txt`
```
R1S1|Booked|john123|BK1000
R1S2|Booked|john123|BK1000
R1S3|Available|||
R1S4|Reserved|bob789|
```

---

## ⚙️ Seat Status Tracking

### Status Types:
- **Available** - Empty, ready to book
- **Booked** - Taken by user
- **Reserved** - On hold

### Seat ID Format:
`R{routeID}S{seatNumber}`

Example: `R1S5` means Route 1, Seat 5

### Example Flow:
```
Initial: R1S1 = Available|||
After booking by john123: R1S1 = Booked|john123|BK1000
After cancellation: R1S1 = Available|||
```

---

## 🔄 Booking Flow

### Create Booking
```
User clicks "Confirm Booking"
    ↓
Backend checks seat status
    ↓
All seats "Available"? → Yes → Create booking
    ↓
Update seat status to "Booked"
    ↓
Link seats to booking ID
    ↓
Update user stats (totalBookings++, totalSpent+=price)
    ↓
Save to: bookings.txt, seats.txt, users.txt
    ↓
Return booking ID to user
```

### Cancel Booking
```
User clicks "Cancel"
    ↓
Backend finds booking by ID
    ↓
Check if user owns booking
    ↓
Change status to "Cancelled"
    ↓
Mark seats as "Available"
    ↓
Update user stats (totalSpent-=price)
    ↓
Save to: bookings.txt, seats.txt, users.txt
    ↓
Return success message
```

---

## 🛠️ Backend Architecture (C++ - logic.cpp)

### Key Functions:

**User Management:**
- `createUser(userID, name, email)` - Create new user
- `getUserJSON(userID)` - Get user details as JSON
- `getAllUsersJSON()` - Get all users

**Seat Management:**
- `initializeSeats(routeID, total)` - Create seats (40 per route)
- `getSeatsJSON(routeID)` - Get all seats for route
- `getSeatStatsJSON(routeID)` - Get seat statistics

**Booking Management:**
- `bookSeats(routeID, routeInfo, userID, seatIDs, price)` - Create booking
- `cancelBooking(bookingID, userID)` - Cancel booking
- `getUserBookingsJSON(userID)` - Get user's bookings
- `getAllBookingsJSON()` - Get all bookings

**Persistence:**
- `saveUsers()` / `loadUsers()`
- `saveBookings()` / `loadBookings()`
- `saveSeats()` / `loadSeats()`

---

## 📊 API Endpoints

### User Endpoints:
```
POST   /api/createUser          - Create user
GET    /api/getUser/<userID>    - Get user info
GET    /api/listUsers           - List all users (admin only)
GET    /api/getUserBookings/<userID> - Get user's bookings
```

### Booking Endpoints:
```
POST   /api/bookSeats           - Make booking
POST   /api/cancelBooking       - Cancel booking
GET    /api/getBooking/<id>     - Get booking details
GET    /api/listBookings        - List all bookings (admin only)
```

### Seat Endpoints:
```
POST   /api/initSeats           - Initialize seats for route
GET    /api/getSeats/<routeID>  - Get seats for route
GET    /api/getSeatStats/<routeID> - Get seat statistics
```

### Admin Endpoints:
```
POST   /api/adminLogin          - Admin login
```

---

## 🔑 Changing Admin Password

### Method 1: Environment Variable (Recommended)
```bash
# PowerShell
$env:ADMIN_PASSWORD = "mynewpassword"
python app.py

# CMD
set ADMIN_PASSWORD=mynewpassword
python app.py
```

### Method 2: Edit Code
File: `app.py`
```python
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'mynewpassword')
```

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to backend"
**Solution:** Make sure C++ executable exists
```bash
cd backend
g++ -std=c++11 logic.cpp -o logic.exe
# OR on Linux:
g++ -std=c++11 logic.cpp -o logic
```

### Problem: Admin login fails
**Solution:** Check password
- Default: `admin123` (case-sensitive)
- Check browser console (F12) for errors
- Restart Flask server

### Problem: User data not saving
**Solution:** Check file permissions
- `backend/users.txt` should be writable
- Check if Flask has write access to `backend/` folder

### Problem: Seats show as booked forever
**Solution:** Check `backend/seats.txt`
- Delete file to reset
- Seats will be re-initialized on next booking

### Problem: Backend compilation errors
**Solution:** Use correct C++ version
```bash
# Requires C++11 or later
g++ -std=c++11 backend/logic.cpp -o backend/logic.exe
```

---

## 📝 Data Reset

Delete all data files to start fresh:
```bash
# PowerShell
Remove-Item backend/users.txt
Remove-Item backend/bookings.txt
Remove-Item backend/seats.txt

# CMD
del backend\users.txt
del backend\bookings.txt
del backend\seats.txt
```

New files will be created automatically on next use.

---

## ✨ Code Size Comparison

| Aspect | Old | New |
|--------|-----|-----|
| Lines of Code | 828 | 350 |
| Functions | 50+ | 20 |
| Readability | Medium | High |
| Data Persistence | Yes | Yes |
| Features | 60% | 100% |

---

## 🎯 Next Features to Add

1. ✅ Route management (done - in Flask)
2. ✅ User authentication (done)
3. ✅ Seat allocation (done)
4. ✅ Booking management (done)
5. Coming soon: Payment integration
6. Coming soon: Email notifications
7. Coming soon: Advanced filters

---

## 📞 Support

For issues:
1. Check browser console (F12)
2. Check Flask terminal output
3. Check data files in `backend/`
4. Restart Flask server
5. Clear browser cache

---

**Happy Booking! 🚌✨**
