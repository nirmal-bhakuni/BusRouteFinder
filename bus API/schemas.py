from pydantic import BaseModel
from typing import Optional

class RouteBase(BaseModel):
    origin: str
    destination: str
    distance_km: Optional[float] = None
    duration_min: Optional[int] = None
    origin_lat: Optional[float] = None
    origin_lng: Optional[float] = None
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None


class RouteCreate(RouteBase):
    pass


class RouteOut(RouteBase):
    id: int
    class Config:
        from_attributes = True


class BusBase(BaseModel):
    operator: str
    total_seats: int
    fare: float
    is_active: bool = True


class BusCreate(BusBase):
    route_id: int


class BusOut(BusBase):
    id: int
    route: RouteOut
    class Config:
        from_attributes = True


class BookingBase(BaseModel):
    passenger_name: str
    seats_booked: int


class BookingCreate(BookingBase):
    bus_id: int


class BookingOut(BookingBase):
    id: int
    total_price: float
    bus: BusOut
    class Config:
        from_attributes = True
