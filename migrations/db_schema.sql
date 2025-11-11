-- Database schema for Bus Route Finder & Booking System
-- MySQL/MariaDB compatible

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

CREATE TABLE IF NOT EXISTS buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT,
    operator VARCHAR(100),
    seats INT DEFAULT 40,
    fare_modifier FLOAT DEFAULT 1.0,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT,
    user_name VARCHAR(100) NOT NULL,
    seats_booked INT NOT NULL,
    total_price FLOAT NOT NULL,
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
    INDEX idx_booked_at (booked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample seed data
INSERT INTO routes (from_city, to_city, distance, ticket_price, coords) VALUES
('Delhi', 'Agra', 233, 120.00, '[{"lat":28.6139,"lng":77.2090},{"lat":27.1767,"lng":78.0081}]'),
('Agra', 'Mumbai', 1194, 600.00, '[{"lat":27.1767,"lng":78.0081},{"lat":19.0760,"lng":72.8777}]'),
('Delhi', 'Jaipur', 280, 150.00, '[{"lat":28.6139,"lng":77.2090},{"lat":26.9124,"lng":75.7873}]'),
('Jaipur', 'Udaipur', 393, 200.00, '[{"lat":26.9124,"lng":75.7873},{"lat":24.5854,"lng":73.7125}]'),
('Mumbai', 'Pune', 148, 85.00, '[{"lat":19.0760,"lng":72.8777},{"lat":18.5204,"lng":73.8567}]'),
('Delhi', 'Chandigarh', 243, 130.00, '[{"lat":28.6139,"lng":77.2090},{"lat":30.7333,"lng":76.7794}]'),
('Bangalore', 'Chennai', 346, 180.00, '[{"lat":12.9716,"lng":77.5946},{"lat":13.0827,"lng":80.2707}]'),
('Kolkata', 'Patna', 583, 300.00, '[{"lat":22.5726,"lng":88.3639},{"lat":25.5941,"lng":85.1376}]');
