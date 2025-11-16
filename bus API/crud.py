from sqlalchemy.orm import Session
from models import Route, Bus, Booking
from schemas import RouteCreate, BusCreate, BookingCreate

def create_route(db: Session, route: RouteCreate):
    db_route = Route(**route.dict())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route


def search_routes(db: Session, origin: str = None, destination: str = None):
    q = db.query(Route)
    if origin:
        q = q.filter(Route.origin.ilike(f"%{origin}%"))
    if destination:
        q = q.filter(Route.destination.ilike(f"%{destination}%"))
    return q.all()


def create_bus(db: Session, bus: BusCreate):
    db_bus = Bus(**bus.dict())
    db.add(db_bus)
    db.commit()
    db.refresh(db_bus)
    return db_bus


def list_buses(db: Session):
    return db.query(Bus).all()


def seats_booked(db: Session, bus_id: int):
    bookings = db.query(Booking).filter(Booking.bus_id == bus_id).all()
    return sum(b.seats_booked for b in bookings)


def create_booking(db: Session, booking: BookingCreate):
    bus = db.query(Bus).filter(Bus.id == booking.bus_id).first()
    if not bus or not bus.is_active:
        raise ValueError("Invalid or inactive bus")

    available = bus.total_seats - seats_booked(db, bus.id)
    if booking.seats_booked > available:
        raise ValueError(f"Only {available} seats available")

    total_price = booking.seats_booked * bus.fare
    db_booking = Booking(**booking.dict(), total_price=total_price)
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking
