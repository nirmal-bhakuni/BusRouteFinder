from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    origin = Column(String(100))
    destination = Column(String(100))
    distance_km = Column(Float)
    duration_min = Column(Integer)
    origin_lat = Column(Float, nullable=True)
    origin_lng = Column(Float, nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lng = Column(Float, nullable=True)

    buses = relationship("Bus", back_populates="route")


class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    operator = Column(String(100))
    total_seats = Column(Integer)
    fare = Column(Float)
    is_active = Column(Boolean, default=True)
    route_id = Column(Integer, ForeignKey("routes.id"))

    route = relationship("Route", back_populates="buses")
    bookings = relationship("Booking", back_populates="bus")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    passenger_name = Column(String(100))
    seats_booked = Column(Integer)
    total_price = Column(Float)
    bus_id = Column(Integer, ForeignKey("buses.id"))

    bus = relationship("Bus", back_populates="bookings")
