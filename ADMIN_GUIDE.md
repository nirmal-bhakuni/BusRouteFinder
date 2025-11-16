# 🔐 Admin Access Guide

## Admin Credentials

**Username:** `admin` (always)
**Password:** `admin123` (default)

## How to Access Admin Panel

1. Open the application: `http://localhost:5000`
2. Click **"🔒 Admin Panel"** button in top-right corner
3. You'll be redirected to: `http://localhost:5000/admin.html`
4. Enter password: `admin123`
5. Click **"Login"**

## Admin Panel Features

Once logged in, you can:

### 1. **Add New Routes** ➕
- Enter: From City, To City, Distance (km), Ticket Price
- Enter optional route coordinates (JSON format)
- Seats will be automatically initialized (40 per route)

### 2. **View All Routes** 🚍
- See all available routes with:
  - Distance
  - Ticket price
  - Seat availability stats (Available, Booked, Reserved)

### 3. **View Registered Users** 👥
- See all users who created profiles:
  - User ID
  - Name
  - Email
  - Total bookings made
  - Total amount spent

### 4. **View All Bookings** 📋
- See all bookings with:
  - Booking ID
  - User ID who made the booking
  - Route taken
  - Seats booked
  - Total price
  - Booking date/time
  - Status (Active/Cancelled)

### 5. **View System Statistics** 📊
- Total routes
- Total bookings
- Registered users
- Total revenue

## Changing Admin Password

### Option 1: Environment Variable
```bash
# Windows PowerShell
$env:ADMIN_PASSWORD = "mynewpassword"
python app.py

# Windows CMD
set ADMIN_PASSWORD=mynewpassword
python app.py
```

### Option 2: Edit Code
Edit `app.py`:
```python
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'mynewpassword')
```

### Option 3: Using .env File
Create `.env` file in project root:
```
ADMIN_PASSWORD=mynewpassword
```

## Database Access

### View Persisted Data

All user and booking data is stored in human-readable text files:

**User Data:** `backend/users.txt`
- Format: `userID|name|email|totalBookings|totalSpent`

**Booking Data:** `backend/bookings.txt`
- Format: `bookingID|userID|routeInfo|seatIDs|totalPrice|timestamp|status`

**Seat Data:** `backend/seats.txt`
- Format: `seatID|status|userID|bookingID`

### Manual Data Reset

Delete these files to reset all data:
```bash
# Windows PowerShell
Remove-Item backend/users.txt
Remove-Item backend/bookings.txt
Remove-Item backend/seats.txt
```

New files will be created automatically on next run.

## Troubleshooting Admin Login

### Problem: "Invalid password" Error
- **Solution:** Password is case-sensitive
- Default password: `admin123` (lowercase)
- Check spelling carefully

### Problem: Admin panel doesn't load
- **Solution:** 
  1. Make sure Flask server is running
  2. Check browser console (F12) for errors
  3. Try clearing browser cache (Ctrl+Shift+Del)

### Problem: Can't see bookings after logout/login
- **Solution:**
  1. Data is in `backend/bookings.txt` - file might be corrupted
  2. Restart Flask server
  3. Try clearing `backend/bookings.txt` to start fresh

## API Endpoints for Admin

**Check Admin Password:**
```bash
curl -X POST http://localhost:5000/api/adminLogin \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"admin123\"}"
```

**Get All Users:**
```bash
curl http://localhost:5000/api/listUsers?password=admin123
```

**Get All Bookings:**
```bash
curl http://localhost:5000/api/listBookings?password=admin123
```

---

**Need to reset password?** Delete `app.py` configuration and reinstall, or contact system administrator.
