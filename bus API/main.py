from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import crud, models, schemas
from database import SessionLocal, engine
from utils import get_coordinates
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bus Route Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Bus Route Finder API is running!"}

@app.get("/routes/all", response_model=list[schemas.RouteOut])
def get_all_routes(db: Session = Depends(get_db)):
    routes = db.query(models.Route).all()
    return routes

@app.post("/routes", response_model=schemas.RouteOut)
def create_route(route: schemas.RouteCreate, db: Session = Depends(get_db)):
    # Fetch coordinates if not provided
    if not route.origin_lat or not route.origin_lng:
        lat, lng = get_coordinates(route.origin)
        route.origin_lat, route.origin_lng = lat, lng

    if not route.destination_lat or not route.destination_lng:
        lat, lng = get_coordinates(route.destination)
        route.destination_lat, route.destination_lng = lat, lng

    return crud.create_route(db, route)


@app.get("/routes/search", response_model=list[schemas.RouteOut])
def search_routes(origin: str = None, destination: str = None, db: Session = Depends(get_db)):
    routes = crud.search_routes(db, origin, destination)
    return routes


@app.post("/buses", response_model=schemas.BusOut)
def create_bus(bus: schemas.BusCreate, db: Session = Depends(get_db)):
    return crud.create_bus(db, bus)


@app.get("/buses", response_model=list[schemas.BusOut])
def list_buses(db: Session = Depends(get_db)):
    return crud.list_buses(db)


@app.post("/bookings", response_model=schemas.BookingOut)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_booking(db, booking)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
