import os, requests, time
from dotenv import load_dotenv

load_dotenv()
GOOGLE_MAPS_API_KEY = "AIzaSyAnTUJAK_SRAsWaVjgoV88mqaBGqz81KWM"

_geocode_cache = {}

def _use_google_geocode(city_name: str):
    if not GOOGLE_MAPS_API_KEY:
        return None
    try:
        res = requests.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"address": city_name, "key": GOOGLE_MAPS_API_KEY},
            timeout=10
        )
        data = res.json()
        if data.get("status") == "OK" and data.get("results"):
            loc = data["results"][0]["geometry"]["location"]
            return float(loc["lat"]), float(loc["lng"])
    except Exception:
        pass
    return None

def _use_nominatim(city_name: str):
    try:
        headers = {"User-Agent": "BusRouteFinder/1.0"}
        res = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": city_name, "format": "json", "limit": 1},
            headers=headers,
            timeout=10
        )
        if res.status_code == 200:
            data = res.json()
            if data:
                time.sleep(1)
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception:
        pass
    return None

def get_coordinates(city_name: str):
    if not city_name:
        return None, None
    key = city_name.strip().lower()
    if key in _geocode_cache:
        return _geocode_cache[key]

    coords = _use_google_geocode(city_name)
    if coords:
        _geocode_cache[key] = coords
        return coords

    coords = _use_nominatim(city_name)
    if coords:
        _geocode_cache[key] = coords
        return coords

    _geocode_cache[key] = (None, None)
    return None, None
