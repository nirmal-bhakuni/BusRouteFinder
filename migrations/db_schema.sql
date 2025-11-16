-- Database schema for Bus Route Finder & Booking System
-- MySQL/MariaDB compatible

-- --------------------------
-- Routes table
-- --------------------------
CREATE TABLE IF NOT EXISTS routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_city VARCHAR(100) NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    distance FLOAT NOT NULL,
    ticket_price FLOAT,
    coords TEXT,
    stops TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_from_city (from_city),
    INDEX idx_to_city (to_city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------
-- Buses table
-- --------------------------
CREATE TABLE IF NOT EXISTS buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT,
    operator VARCHAR(100),
    seats INT DEFAULT 40,
    fare_modifier FLOAT DEFAULT 1.0,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------
-- Users table
-- --------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------
-- Bookings table
-- --------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT,
    user_id INT,
    user_name VARCHAR(100) NOT NULL,
    seats_booked INT NOT NULL,
    total_price FLOAT NOT NULL,
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_booked_at (booked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------
-- Seats table (optional for seat availability per bus)
-- --------------------------
CREATE TABLE IF NOT EXISTS seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT,
    seat_number INT,
    is_booked BOOLEAN DEFAULT 0,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------
-- Sample seed data for routes
-- --------------------------
INSERT INTO routes (from_city, to_city, distance, ticket_price, coords) VALUES
('Delhi', 'Agra', 233, 120.00, '[{"lat":28.6139,"lng":77.2090},{"lat":27.1767,"lng":78.0081}]'),
('Agra', 'Mumbai', 1194, 600.00, '[{"lat":27.1767,"lng":78.0081},{"lat":19.0760,"lng":72.8777}]'),
('Delhi', 'Jaipur', 280, 150.00, '[{"lat":28.6139,"lng":77.2090},{"lat":26.9124,"lng":75.7873}]'),
('Jaipur', 'Udaipur', 393, 200.00, '[{"lat":26.9124,"lng":75.7873},{"lat":24.5854,"lng":73.7125}]'),
('Mumbai', 'Pune', 148, 85.00, '[{"lat":19.0760,"lng":72.8777},{"lat":18.5204,"lng":73.8567}]'),
('Delhi', 'Chandigarh', 243, 130.00, '[{"lat":28.6139,"lng":77.2090},{"lat":30.7333,"lng":76.7794}]'),
('Bangalore', 'Chennai', 346, 180.00, '[{"lat":12.9716,"lng":77.5946},{"lat":13.0827,"lng":80.2707}]'),
('Kolkata', 'Patna', 583, 300.00, '[{"lat":22.5726,"lng":88.3639},{"lat":25.5941,"lng":85.1376}]');

-- --------------------------
-- Sample seed data for buses
-- --------------------------
INSERT INTO buses (route_id, operator, seats, fare_modifier) VALUES
(1, 'Express Delhi', 40, 1.0),
(2, 'Mumbai Express', 50, 1.0),
(3, 'Rajasthan Travels', 35, 1.0),
(4, 'Udaipur Connect', 30, 1.0);
