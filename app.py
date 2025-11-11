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
USE_DB = os.environ.get('USE_DB', 'true').lower() == 'true'
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///data.db')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

if USE_DB:
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db = SQLAlchemy(app)
else:
    db = None

# =======================
# Database Models
# =======================
if USE_DB:
    class Route(db.Model):
        __tablename__ = 'routes'
        id = db.Column(db.Integer, primary_key=True)
        from_city = db.Column(db.String(100), nullable=False)
        to_city = db.Column(db.String(100), nullable=False)
        distance = db.Column(db.Float, nullable=False)
        ticket_price = db.Column(db.Float)
        coords = db.Column(db.Text)
        stops = db.Column(db.Text)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)

        def to_dict(self):
            return {
                'id': self.id,
                'from': self.from_city,
                'to': self.to_city,
                'distance': self.distance,
                'ticket_price': self.ticket_price,
                'coords': json.loads(self.coords) if self.coords else [],
                'stops': json.loads(self.stops) if self.stops else []
            }

    class Bus(db.Model):
        __tablename__ = 'buses'
        id = db.Column(db.Integer, primary_key=True)
        route_id = db.Column(db.Integer, db.ForeignKey('routes.id'))
        operator = db.Column(db.String(100))
        seats = db.Column(db.Integer, default=40)
        fare_modifier = db.Column(db.Float, default=1.0)

    class Booking(db.Model):
        __tablename__ = 'bookings'
        id = db.Column(db.Integer, primary_key=True)
        route_id = db.Column(db.Integer, db.ForeignKey('routes.id'))
        user_name = db.Column(db.String(100), nullable=False)
        seats_booked = db.Column(db.Integer, nullable=False)
        total_price = db.Column(db.Float, nullable=False)
        booked_at = db.Column(db.DateTime, default=datetime.utcnow)

        def to_dict(self):
            route = Route.query.get(self.route_id)
            return {
                'id': self.id,
                'route': f"{route.from_city} → {route.to_city}" if route else "Unknown",
                'user_name': self.user_name,
                'seats_booked': self.seats_booked,
                'total_price': self.total_price,
                'booked_at': self.booked_at.isoformat()
            }

# =======================
# Helper Functions (File Mode)
# =======================
def load_routes_from_file():
    routes = []
    try:
        with open(os.path.join(os.path.dirname(__file__), 'backend', 'routes.txt'), 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                parts = line.split('|')
                if len(parts) < 3:
                    continue
                # Safe parsing
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
                        ticket_price = None
                coords = []
                if len(parts) > 4 and parts[4].strip():
                    try:
                        coords = json.loads(parts[4].strip())
                    except json.JSONDecodeError:
                        coords = []
                routes.append({
                    'from': from_city,
                    'to': to_city,
                    'distance': distance,
                    'ticket_price': ticket_price,
                    'coords': coords
                })
    except FileNotFoundError:
        pass
    return routes

def save_booking_to_file(route_info, user_name, seats, price):
    with open('backend/bookings.txt', 'a') as f:
        booking = {
            'route': route_info,
            'user_name': user_name,
            'seats': seats,
            'price': price,
            'timestamp': datetime.now().isoformat()
        }
        f.write(json.dumps(booking) + '\n')

def load_bookings_from_file():
    bookings = []
    try:
        with open('backend/bookings.txt', 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    bookings.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except FileNotFoundError:
        pass
    return bookings

# =======================
# C++ Backend Integration
# =======================
def call_cpp_logic(cmd_data):
    binary = './backend/logic.exe' if os.name == 'nt' else './backend/logic'
    try:
        result = subprocess.run(
            [binary],
            input=json.dumps(cmd_data),
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode != 0:
            return {'error': f'C++ error: {result.stderr.strip()}'}
        return json.loads(result.stdout)
    except subprocess.TimeoutExpired:
        return {'error': 'C++ computation timeout'}
    except json.JSONDecodeError:
        return {'error': f'Invalid C++ output: {result.stdout.strip()}'}
    except Exception as e:
        return {'error': str(e)}

# =======================
# Routes
# =======================
@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('frontend', path)

@app.route('/api/findRoute', methods=['POST'])
def find_route():
    data = request.json
    from_city = data.get('from', '').strip()
    to_city = data.get('to', '').strip()

    if not from_city or not to_city:
        return jsonify({'error': 'Source and destination required'}), 400

    # Load routes
    routes_data = Route.query.all() if USE_DB else load_routes_from_file()
    routes_data = [r.to_dict() for r in routes_data] if USE_DB else routes_data

    if not routes_data:
        return jsonify({'error': 'No routes available'}), 404

    # Call C++ logic
    cpp_input = {'cmd': 'findRoute', 'from': from_city, 'to': to_city, 'routes': routes_data}
    result = call_cpp_logic(cpp_input)
    if 'error' in result:
        return jsonify(result), 500
    if 'path' not in result or not result['path']:
        return jsonify({'error': 'No path found'}), 404

    # Collect coordinates and calculate fare
    path_coords = []
    total_custom_fare = 0
    has_custom_prices = True

    for i in range(len(result['path']) - 1):
        from_stop = result['path'][i].strip().lower()
        to_stop = result['path'][i + 1].strip().lower()
        matched = False
        for route in routes_data:
            r_from = route['from'].strip().lower()
            r_to = route['to'].strip().lower()
            if (r_from == from_stop and r_to == to_stop) or (r_from == to_stop and r_to == from_stop):
                if route.get('coords'):
                    path_coords.extend(route['coords'])
                if route.get('ticket_price') is not None:
                    total_custom_fare += route['ticket_price']
                else:
                    has_custom_prices = False
                matched = True
                break
        if not matched:
            has_custom_prices = False

    if has_custom_prices and total_custom_fare > 0:
        result['fare'] = total_custom_fare

    result['coords'] = path_coords
    return jsonify(result)

@app.route('/api/listRoutes', methods=['GET'])
def list_routes():
    if USE_DB:
        routes = Route.query.all()
        return jsonify([r.to_dict() for r in routes])
    else:
        return jsonify(load_routes_from_file())

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

    if USE_DB:
        route = Route(
            from_city=from_city,
            to_city=to_city,
            distance=distance,
            ticket_price=ticket_price,
            coords=json.dumps(coords),
            stops=json.dumps([])
        )
        db.session.add(route)
        db.session.commit()
        return jsonify({'success': True, 'id': route.id})
    else:
        coords_str = json.dumps(coords)
        price_str = str(ticket_price) if ticket_price else ''
        line_to_write = f"{from_city}|{to_city}|{distance}|{price_str}|{coords_str}\n"
        print(f"Writing to file: {line_to_write}")
        with open('backend/routes.txt', 'a') as f:
            f.write(line_to_write)
        return jsonify({'success': True})

@app.route('/api/removeRoute', methods=['POST'])
def remove_route():
    data = request.json
    if data.get('password') != ADMIN_PASSWORD:
        return jsonify({'error': 'Unauthorized'}), 401

    if USE_DB:
        route_id = data.get('route_id')
        route = Route.query.get(route_id)
        if route:
            db.session.delete(route)
            db.session.commit()
            return jsonify({'success': True})
        return jsonify({'error': 'Route not found'}), 404
    else:
        return jsonify({'error': 'Remove not supported in file mode'}, 400)

@app.route('/api/book', methods=['POST'])
def book_ticket():
    data = request.json
    user_name = data.get('user_name', '').strip()
    seats = data.get('seats', 0)
    route_info = data.get('route_info', '')
    price = data.get('price', 0)

    if not user_name or seats <= 0:
        return jsonify({'error': 'Invalid booking data'}), 400

    if USE_DB:
        booking = Booking(
            route_id=data.get('route_id', 0),
            user_name=user_name,
            seats_booked=seats,
            total_price=price
        )
        db.session.add(booking)
        db.session.commit()
        return jsonify({
            'success': True,
            'booking_id': booking.id,
            'message': f'Booking confirmed for {user_name}'
        })
    else:
        save_booking_to_file(route_info, user_name, seats, price)
        return jsonify({
            'success': True,
            'message': f'Booking confirmed for {user_name}'
        })

@app.route('/api/listBookings', methods=['GET'])
def list_bookings():
    password = request.args.get('password')
    if password != ADMIN_PASSWORD:
        return jsonify({'error': 'Unauthorized'}), 401

    if USE_DB:
        bookings = Booking.query.order_by(Booking.booked_at.desc()).all()
        return jsonify([b.to_dict() for b in bookings])
    else:
        return jsonify(load_bookings_from_file())

@app.route('/api/adminLogin', methods=['POST'])
def admin_login():
    data = request.json
    password = data.get('password', '')
    if password == ADMIN_PASSWORD:
        return jsonify({
            'success': True,
            'token': 'simple-token-' + password[:4]
        })
    return jsonify({'error': 'Invalid password'}), 401

# =======================
# Initialize Database
# =======================
if USE_DB:
    with app.app_context():
        db.create_all()
        print("Database initialized")

if __name__ == '__main__':
    print(f"Running in {'DATABASE' if USE_DB else 'FILE'} mode")
    print(f"Admin password: {ADMIN_PASSWORD}")
    app.run(host='0.0.0.0', port=5000, debug=True)

