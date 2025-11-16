# 🚌 Bus Route Finder API (FastAPI + SQLAlchemy)

## 🚀 Setup Instructions

1. Create virtual environment and activate it
```bash
python -m venv venv
venv\Scripts\activate
```

2. Install dependencies
```bash
pip install -r requirements.txt
```

3. Run server
```bash
uvicorn main:app --reload
```

## 🧩 API Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|

| GET | `/` | Check API status |
| GET | `/routes/all` | Returns all the routs  |
| POST | `/routes` | Create a new route |
| GET | `/routes/search?origin=Delhi&destination=Mumbai` | Search routes |
| POST | `/buses` | Create new bus |
| GET | `/buses` | List all buses |
| POST | `/bookings` | Book seats on a bus |

# Example Responses
### Create Route
**Request**
```json
{
  "origin": "Delhi",
  "destination": "Mumbai",
  "distance_km": 1400,
  "duration_min": 1200
}
```


**Response**
```json
{
  "id": 1,
  "origin": "Delhi",
  "destination": "Mumbai",
  "distance_km": 1400,
  "duration_min": 1200
}
```

### All routes
**Request**
```json
{
  "origin": "string",
  "destination": "string",
  "distance_km": 0,
  "duration_min": 0,
  "origin_lat": 0,
  "origin_lng": 0,
  "destination_lat": 0,
  "destination_lng": 0,
  "id": 0
  }
```

### Create Bus
**Request**
```json
{
  "route_id": 1,
  "operator": "BlueLine",
  "total_seats": 40,
  "fare": 900.0,
  "is_active": true
}
```

**Response**
```json
{
  "id": 1,
  "operator": "BlueLine",
  "total_seats": 40,
  "fare": 900.0,
  "is_active": true,
  "route": {
    "id": 1,
    "origin": "Delhi",
    "destination": "Mumbai",
    "distance_km": 1400,
    "duration_min": 1200
  }
}
```

### Create Booking
**Request**
```json
{
  "bus_id": 1,
  "passenger_name": "Rohit Kumar",
  "seats_booked": 2
}
```

**Response**
```json
{
  "id": 1,
  "passenger_name": "Rohit Kumar",
  "seats_booked": 2,
  "total_price": 1800.0,
  "bus": {
    "id": 1,
    "operator": "BlueLine",
    "total_seats": 40,
    "fare": 900.0,
    "is_active": true,
    "route": {
      "id": 1,
      "origin": "Delhi",
      "destination": "Mumbai",
      "distance_km": 1400,
      "duration_min": 1200
    }
  }
}
```
