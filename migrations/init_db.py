#!/usr/bin/env python3
"""
Database initialization script
Run this to set up the database schema
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, db, Route
import json

def init_database():
    """Initialize database with schema and sample data"""
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        
        # Check if we already have data
        if Route.query.first():
            print("Database already has data. Skipping seed.")
            return
        
        # Add sample routes
        print("Adding sample routes...")
        sample_routes = [
            {
                'from_city': 'Delhi',
                'to_city': 'Agra',
                'distance': 233,
                'ticket_price': 120.00,
                'coords': json.dumps([{"lat": 28.6139, "lng": 77.2090}, {"lat": 27.1767, "lng": 78.0081}])
            },
            {
                'from_city': 'Agra',
                'to_city': 'Mumbai',
                'distance': 1194,
                'ticket_price': 600.00,
                'coords': json.dumps([{"lat": 27.1767, "lng": 78.0081}, {"lat": 19.0760, "lng": 72.8777}])
            },
            {
                'from_city': 'Delhi',
                'to_city': 'Jaipur',
                'distance': 280,
                'ticket_price': 150.00,
                'coords': json.dumps([{"lat": 28.6139, "lng": 77.2090}, {"lat": 26.9124, "lng": 75.7873}])
            },
            {
                'from_city': 'Jaipur',
                'to_city': 'Udaipur',
                'distance': 393,
                'ticket_price': 200.00,
                'coords': json.dumps([{"lat": 26.9124, "lng": 75.7873}, {"lat": 24.5854, "lng": 73.7125}])
            },
            {
                'from_city': 'Mumbai',
                'to_city': 'Pune',
                'distance': 148,
                'ticket_price': 85.00,
                'coords': json.dumps([{"lat": 19.0760, "lng": 72.8777}, {"lat": 18.5204, "lng": 73.8567}])
            },
            {
                'from_city': 'Delhi',
                'to_city': 'Chandigarh',
                'distance': 243,
                'ticket_price': 130.00,
                'coords': json.dumps([{"lat": 28.6139, "lng": 77.2090}, {"lat": 30.7333, "lng": 76.7794}])
            },
            {
                'from_city': 'Bangalore',
                'to_city': 'Chennai',
                'distance': 346,
                'ticket_price': 180.00,
                'coords': json.dumps([{"lat": 12.9716, "lng": 77.5946}, {"lat": 13.0827, "lng": 80.2707}])
            },
            {
                'from_city': 'Kolkata',
                'to_city': 'Patna',
                'distance': 583,
                'ticket_price': 300.00,
                'coords': json.dumps([{"lat": 22.5726, "lng": 88.3639}, {"lat": 25.5941, "lng": 85.1376}])
            }
        ]
        
        for route_data in sample_routes:
            route = Route(**route_data, stops=json.dumps([]))
            db.session.add(route)
        
        db.session.commit()
        print(f"Added {len(sample_routes)} sample routes")
        print("Database initialization complete!")

if __name__ == '__main__':
    init_database()
