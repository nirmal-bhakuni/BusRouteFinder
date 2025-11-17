import os
import json
import subprocess
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

# =======================
# Configuration
# =======================
USE_DB = os.environ.get('USE_DB', 'false').lower() == 'true'
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///data.db')

# ADMIN CREDENTIALS - CHANGE THESE!
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
ADMIN_USERNAME = 'admin'  # Username is always "admin"
# Access admin panel at: /admin.html
# Login with username: admin, password: admin123

if USE_DB:
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db = SQLAlchemy(app)
else:
    db = None

# =======================
# C++ Backend Integration
# =======================
def call_cpp_logic(cmd_data):
    """Call the C++ backend with JSON input and get JSON output"""
    binary = './backend/logic.exe' if os.name == 'nt' else './backend/logic'
    try:
        result = subprocess.run(
            [binary],
            input=json.dumps(cmd_data),
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode != 0:
            return {'error': f'C++ error: {result.stderr.strip()}'}
        return json.loads(result.stdout)
    except subprocess.TimeoutExpired:
        return {'error': 'C++ computation timeout'}
    except json.JSONDecodeError as e:
        return {'error': f'Invalid C++ output: {result.stdout.strip()}'}
    except Exception as e:
        return {'error': str(e)}

# =======================
# Helper Functions
# =======================
def load_routes_from_file():
    routes = []
    try:
        with open(os.path.join(os.path.dirname(__file__), 'backend', 'routes.txt'), 'r') as f:
            route_id = 1
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                parts = line.split('|')
                if len(parts) < 3:
                    continue
                from_city = parts[0].strip()
                to_city = parts[1].strip()
                try:
                    distance = float(parts[2].strip())
                except ValueError:
                    continue
                ticket_price = None
                if len(parts) > 3 and parts[3].strip():
                    try:
                        ticket_price = float(parts[3].strip())
                    except ValueError:
                        pass
                coords = []
                if len(parts) > 4 and parts[4].strip():
                    try:
                        coords = json.loads(parts[4].strip())
                    except json.JSONDecodeError:
                        pass
                routes.append({
                    'id': route_id,
                    'from': from_city,
                    'to': to_city,
                    'distance': distance,
                    'ticket_price': ticket_price,
                    'coords': coords
                })
                route_id += 1
    except FileNotFoundError:
        pass
    return routes

# =======================
# Routes - Static Files
# =======================
@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('frontend', path)

# =======================
# User Management APIs
# =======================
@app.route('/api/createUser', methods=['POST'])
def create_user():
    data = request.json
    userID = data.get('userID', '').strip()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    
    if not userID or not name or not email:
        return jsonify({'error': 'Invalid user data'}), 400
    
    result = call_cpp_logic({
        'cmd': 'createUser',
        'userID': userID,
        'name': name,
        'email': email
    })
    
    if 'error' in result:
        return jsonify(result), 400
    return jsonify(result)

@app.route('/api/getUser/<userID>', methods=['GET'])
def get_user(userID):
    result = call_cpp_logic({
        'cmd': 'getUser',
        'userID': userID
    })
    
    if 'error' in result:
        return jsonify(result), 404
    return jsonify(result)

@app.route('/api/updateUser', methods=['POST'])
def update_user():
    data = request.json
    userID = data.get('userID', '').strip()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    
    if not userID or not name or not email:
        return jsonify({'error': 'Invalid user data'}), 400
    
    result = call_cpp_logic({
        'cmd': 'updateUser',
        'userID': userID,
        'name': name,
        'email': email
    })
    
    if 'error' in result:
        return jsonify(result), 404
    return jsonify(result)

@app.route('/api/listUsers', methods=['GET'])
def list_users():
    password = request.args.get('password')
    if password != ADMIN_PASSWORD:
        return jsonify({'error': 'Unauthorized'}), 401
    
    result = call_cpp_logic({'cmd': 'getAllUsers'})
    return jsonify(result if isinstance(result, list) else [])

# =======================
# Seat Management APIs
# =======================
@app.route('/api/initSeats', methods=['POST'])
def init_seats():
    data = request.json
    route_id = data.get('routeID', 1)
    
    result = call_cpp_logic({
        'cmd': 'initSeats',
        'routeID': str(route_id)
    })
    
    return jsonify(result)

@app.route('/api/getSeats/<int:route_id>', methods=['GET'])
def get_seats(route_id):
    result = call_cpp_logic({
        'cmd': 'getSeats',
        'routeID': str(route_id)
    })
    
    return jsonify(result if isinstance(result, list) else [])

@app.route('/api/getSeatStats/<int:route_id>', methods=['GET'])
def get_seat_stats(route_id):
    result = call_cpp_logic({
        'cmd': 'getSeatStats',
        'routeID': str(route_id)
    })
    
    return jsonify(result)

@app.route('/api/getAvailableSeats/<int:route_id>', methods=['GET'])
def get_available_seats(route_id):
    result = call_cpp_logic({
        'cmd': 'getAvailableSeats',
        'routeID': str(route_id)
    })
    
    return jsonify(result if isinstance(result, list) else [])

@app.route('/api/getBookedSeats', methods=['GET'])
def get_booked_seats():
    route_id = request.args.get('route_id', 1, type=int)
    result = call_cpp_logic({
        'cmd': 'getBookedSeats',
        'routeID': str(route_id)
    })
    
    return jsonify(result if isinstance(result, list) else [])

# =======================
# Booking Management APIs
# =======================
@app.route('/api/bookSeats', methods=['POST'])
def book_seats():
    data = request.json
    route_id = data.get('routeID')
    route_info = data.get('route_info', '')
    user_id = data.get('userID', '').strip()
    seat_ids = data.get('seatIDs', [])
    price_per_seat = data.get('pricePerSeat', 0)
    
    if not user_id or not seat_ids:
        return jsonify({'error': 'Invalid booking data'}), 400
    
    result = call_cpp_logic({
        'cmd': 'bookSeats',
        'routeID': str(route_id),
        'routeInfo': route_info,
        'userID': user_id,
        'seatIDs': seat_ids,
        'pricePerSeat': str(price_per_seat)
    })
    
    if 'error' in result:
        return jsonify(result), 400
    return jsonify(result)

@app.route('/api/cancelBooking', methods=['POST'])
def cancel_booking():
    data = request.json
    booking_id = data.get('bookingID', '').strip()
    user_id = data.get('userID', '').strip()
    
    if not booking_id or not user_id:
        return jsonify({'error': 'Invalid request'}), 400
    
    result = call_cpp_logic({
        'cmd': 'cancelBooking',
        'bookingID': booking_id,
        'userID': user_id
    })
    
    if 'error' in result:
        return jsonify(result), 400
    return jsonify(result)

@app.route('/api/getBooking/<booking_id>', methods=['GET'])
def get_booking(booking_id):
    result = call_cpp_logic({
        'cmd': 'getBooking',
        'bookingID': booking_id
    })
    
    if 'error' in result:
        return jsonify(result), 404
    return jsonify(result)

@app.route('/api/listBookings', methods=['GET'])
def list_bookings():
    password = request.args.get('password')
    if password != ADMIN_PASSWORD:
        return jsonify({'error': 'Unauthorized'}), 401
    
    result = call_cpp_logic({'cmd': 'getAllBookings'})
    return jsonify(result if isinstance(result, list) else [])

@app.route('/api/getUserBookings/<user_id>', methods=['GET'])
def get_user_bookings(user_id):
    result = call_cpp_logic({
        'cmd': 'getUserBookings',
        'userID': user_id
    })
    
    return jsonify(result if isinstance(result, list) else [])

# =======================
# Seat Reservation APIs
# =======================
@app.route('/api/reserveSeat', methods=['POST'])
def reserve_seat():
    data = request.json
    seat_id = data.get('seatID', '').strip()
    user_id = data.get('userID', '').strip()
    
    if not seat_id or not user_id:
        return jsonify({'error': 'Invalid request'}), 400
    
    result = call_cpp_logic({
        'cmd': 'reserveSeat',
        'seatID': seat_id,
        'userID': user_id
    })
    
    if 'error' in result:
        return jsonify(result), 400
    return jsonify(result)

@app.route('/api/releaseSeat', methods=['POST'])
def release_seat():
    data = request.json
    seat_id = data.get('seatID', '').strip()
    user_id = data.get('userID', '').strip()
    
    if not seat_id or not user_id:
        return jsonify({'error': 'Invalid request'}), 400
    
    result = call_cpp_logic({
        'cmd': 'releaseSeat',
        'seatID': seat_id,
        'userID': user_id
    })
    
    if 'error' in result:
        return jsonify(result), 400
    return jsonify(result)

# =======================
# Route Management APIs
# =======================
@app.route('/api/listRoutes', methods=['GET'])
def list_routes():
    routes = load_routes_from_file()
    # Initialize seats for each route
    for route in routes:
        call_cpp_logic({
            'cmd': 'initSeats',
            'routeID': str(route['id'])
        })
    return jsonify(routes)

@app.route('/api/addRoute', methods=['POST'])
def add_route():
    data = request.json
    if data.get('password') != ADMIN_PASSWORD:
        return jsonify({'error': 'Unauthorized'}), 401
    
    from_city = data.get('from', '').strip()
    to_city = data.get('to', '').strip()
    distance = data.get('distance', 0)
    ticket_price = data.get('ticket_price', None)
    coords = data.get('coords', [])
    
    if not from_city or not to_city or distance <= 0:
        return jsonify({'error': 'Invalid route data'}), 400
    
    coords_str = json.dumps(coords)
    price_str = str(ticket_price) if ticket_price else ''
    line_to_write = f"{from_city}|{to_city}|{distance}|{price_str}|{coords_str}\n"
    
    with open('backend/routes.txt', 'a') as f:
        f.write(line_to_write)
    
    # Get the new route ID
    routes = load_routes_from_file()
    new_route_id = len(routes)
    
    # Initialize seats for the new route
    call_cpp_logic({
        'cmd': 'initSeats',
        'routeID': str(new_route_id)
    })
    
    return jsonify({'success': True, 'id': new_route_id})

@app.route('/api/removeRoute', methods=['POST'])
def remove_route():
    data = request.json
    if data.get('password') != ADMIN_PASSWORD:
        return jsonify({'error': 'Unauthorized'}), 401
    
    return jsonify({'error': 'Remove not supported in file mode'}), 400

# =======================
# Admin APIs
# =======================
@app.route('/api/adminLogin', methods=['POST', 'OPTIONS'])
def admin_login():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json(force=True)
    password = str(data.get('password', '')).strip()
    
    # Check admin password
    if password == ADMIN_PASSWORD:
        return jsonify({
            'success': True, 
            'token': 'admin-token',
            'message': f'Admin login successful'
        })
    
    return jsonify({
        'success': False, 
        'error': 'Invalid password. Hint: Default password is admin123'
    }), 401

# =======================
# Initialize & Run
# =======================

if __name__ == '__main__':
    print(f"Running in FILE mode with C++ backend")
    print(f"Admin password: {ADMIN_PASSWORD}")
    
    # Initialize seats for existing routes
    routes = load_routes_from_file()
    for route in routes:
        call_cpp_logic({
            'cmd': 'initSeats',
            'routeID': str(route['id'])
        })
    print(f"Initialized seats for {len(routes)} routes")
    
    app.run(host='0.0.0.0', port=5000, debug=True)