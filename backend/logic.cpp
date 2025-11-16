#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <set>
#include <queue>
#include <algorithm>
#include <cmath>
#include <sstream>
#include <iomanip>
#include <fstream>

using namespace std;

// ========================
// Data Structures
// ========================

struct Coordinate {
    double lat;
    double lng;
};

struct Route {
    int routeID;
    string from;
    string to;
    double distance;
    double ticketPrice;
    vector<Coordinate> coords;
};

struct Seat {
    string seatID;
    string status; // "Available", "Booked", "Reserved"
    string userID;
    int routeID;
    string bookingID;
};

struct Booking {
    string bookingID;
    int routeID;
    string routeInfo;
    string userID;
    vector<string> seatIDs;
    double totalPrice;
    string timestamp;
    string status; // "Active", "Cancelled"
};

struct User {
    string userID;
    string name;
    string email;
    vector<string> bookingIDs;
    int totalBookings;
    double totalSpent;
};

// ========================
// Global Data Storage
// ========================
map<string, Seat> seats; // seatID -> Seat
map<string, User> users; // userID -> User
map<string, Booking> bookings; // bookingID -> Booking
map<int, Route> routes; // routeID -> Route
int nextBookingID = 1;

// For route search - built from routes.txt
map<string, vector<int>> routeGraph; // lowercase stop -> list of route IDs
map<int, Route> allStoredRoutes; // routeID -> Route (from routes.txt)

// ========================
// Data Persistence
// ========================
const string USERS_FILE = "backend/data_users.txt";
const string BOOKINGS_FILE = "backend/data_bookings.txt";
const string SEATS_FILE = "backend/data_seats.txt";
const string ROUTES_FILE = "backend/routes.txt";

void saveUsers() {
    ofstream file(USERS_FILE);
    if (!file.is_open()) return;
    
    for (const auto& pair : users) {
        const User& u = pair.second;
        file << u.userID << "|" << u.name << "|" << u.email << "|"
             << u.totalBookings << "|" << fixed << setprecision(2) << u.totalSpent << "\n";
    }
    file.close();
}

void loadUsers() {
    ifstream file(USERS_FILE);
    if (!file.is_open()) return;
    
    string line;
    while (getline(file, line)) {
        if (line.empty()) continue;
        
        size_t pos1 = line.find('|');
        size_t pos2 = line.find('|', pos1 + 1);
        size_t pos3 = line.find('|', pos2 + 1);
        size_t pos4 = line.find('|', pos3 + 1);
        
        if (pos1 != string::npos && pos2 != string::npos && pos3 != string::npos && pos4 != string::npos) {
            string userID = line.substr(0, pos1);
            string name = line.substr(pos1 + 1, pos2 - pos1 - 1);
            string email = line.substr(pos2 + 1, pos3 - pos2 - 1);
            int bookings = stoi(line.substr(pos3 + 1, pos4 - pos3 - 1));
            double spent = stod(line.substr(pos4 + 1));
            
            users[userID] = {userID, name, email, {}, bookings, spent};
        }
    }
    file.close();
}

void saveBookings() {
    ofstream file(BOOKINGS_FILE);
    if (!file.is_open()) return;
    
    for (const auto& pair : bookings) {
        const Booking& b = pair.second;
        file << b.bookingID << "|" << b.routeID << "|" << b.routeInfo << "|"
             << b.userID << "|";
        
        // Save seat IDs
        for (size_t i = 0; i < b.seatIDs.size(); i++) {
            if (i > 0) file << ",";
            file << b.seatIDs[i];
        }
        file << "|" << fixed << setprecision(2) << b.totalPrice << "|"
             << b.timestamp << "|" << b.status << "\n";
    }
    file.close();
}

void loadBookings() {
    ifstream file(BOOKINGS_FILE);
    if (!file.is_open()) return;
    
    string line;
    while (getline(file, line)) {
        if (line.empty()) continue;
        
        size_t pos = 0;
        vector<string> parts;
        string part;
        
        for (int i = 0; i < 8; i++) {
            size_t next = line.find('|', pos);
            if (next == string::npos) {
                parts.push_back(line.substr(pos));
                break;
            }
            parts.push_back(line.substr(pos, next - pos));
            pos = next + 1;
        }
        
        if (parts.size() >= 8) {
            string bookingID = parts[0];
            int routeID = stoi(parts[1]);
            string routeInfo = parts[2];
            string userID = parts[3];
            
            vector<string> seatIDs;
            stringstream ss(parts[4]);
            string seat;
            while (getline(ss, seat, ',')) {
                if (!seat.empty()) seatIDs.push_back(seat);
            }
            
            double totalPrice = stod(parts[5]);
            string timestamp = parts[6];
            string status = parts[7];
            
            bookings[bookingID] = {bookingID, routeID, routeInfo, userID, seatIDs, totalPrice, timestamp, status};
            
            // Update nextBookingID
            int num = stoi(bookingID.substr(2));
            if (num >= nextBookingID) nextBookingID = num + 1;
        }
    }
    file.close();
}

void saveSeatState() {
    ofstream file(SEATS_FILE);
    if (!file.is_open()) return;
    
    for (const auto& pair : seats) {
        const Seat& s = pair.second;
        file << s.seatID << "|" << s.status << "|" << s.userID << "|"
             << s.routeID << "|" << s.bookingID << "\n";
    }
    file.close();
}

void loadSeatState() {
    ifstream file(SEATS_FILE);
    if (!file.is_open()) return;
    
    string line;
    while (getline(file, line)) {
        if (line.empty()) continue;
        
        size_t pos1 = line.find('|');
        size_t pos2 = line.find('|', pos1 + 1);
        size_t pos3 = line.find('|', pos2 + 1);
        size_t pos4 = line.find('|', pos3 + 1);
        
        if (pos1 != string::npos && pos2 != string::npos && pos3 != string::npos && pos4 != string::npos) {
            string seatID = line.substr(0, pos1);
            string status = line.substr(pos1 + 1, pos2 - pos1 - 1);
            string userID = line.substr(pos2 + 1, pos3 - pos2 - 1);
            int routeID = stoi(line.substr(pos3 + 1, pos4 - pos3 - 1));
            string bookingID = line.substr(pos4 + 1);
            
            seats[seatID] = {seatID, status, userID, routeID, bookingID};
        }
    }
    file.close();
}

// ========================
// Utility Functions
// ========================

string generateBookingID() {
    return "BK" + to_string(nextBookingID++);
}

string getCurrentTimestamp() {
    time_t now = time(0);
    char buf[80];
    strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", localtime(&now));
    return string(buf);
}

string toLowerCase(const string& str) {
    string result = str;
    transform(result.begin(), result.end(), result.begin(), ::tolower);
    return result;
}

// Load routes from routes.txt
void loadRoutesFromFile() {
    allStoredRoutes.clear();
    routeGraph.clear();
    
    ifstream file(ROUTES_FILE);
    if (!file.is_open()) return;
    
    string line;
    int routeID = 1;
    while (getline(file, line)) {
        if (line.empty() || line[0] == '#') continue;
        
        size_t pos1 = line.find('|');
        size_t pos2 = line.find('|', pos1 + 1);
        size_t pos3 = line.find('|', pos2 + 1);
        size_t pos4 = line.find('|', pos3 + 1);
        
        if (pos1 == string::npos || pos2 == string::npos || pos3 == string::npos) continue;
        
        string from = line.substr(0, pos1);
        string to = line.substr(pos1 + 1, pos2 - pos1 - 1);
        double distance = stod(line.substr(pos2 + 1, pos3 - pos2 - 1));
        
        double ticketPrice = 0;
        string priceStr = line.substr(pos3 + 1, pos4 - pos3 - 1);
        if (!priceStr.empty()) {
            try {
                ticketPrice = stod(priceStr);
            } catch (...) {
                ticketPrice = distance * 0.5;
            }
        } else {
            ticketPrice = distance * 0.5;
        }
        
        Route route = {routeID, from, to, distance, ticketPrice, {}};
        allStoredRoutes[routeID] = route;
        
        string fromLower = toLowerCase(from);
        routeGraph[fromLower].push_back(routeID);
        
        routeID++;
    }
    file.close();
}

struct PathNode {
    string stop;
    vector<int> path;
};

vector<int> findRoutePath(const string& startStop, const string& endStop) {
    string start = toLowerCase(startStop);
    string end = toLowerCase(endStop);
    
    if (start == end) return {};
    if (routeGraph.find(start) == routeGraph.end()) return {};
    
    queue<PathNode> q;
    set<string> visited;
    
    q.push({start, {}});
    visited.insert(start);
    
    while (!q.empty()) {
        PathNode current = q.front();
        q.pop();
        
        if (routeGraph.find(current.stop) != routeGraph.end()) {
            for (int routeID : routeGraph[current.stop]) {
                if (allStoredRoutes.find(routeID) == allStoredRoutes.end()) continue;
                
                Route& route = allStoredRoutes[routeID];
                string nextStop = toLowerCase(route.to);
                
                if (nextStop == end) {
                    vector<int> result = current.path;
                    result.push_back(routeID);
                    return result;
                }
                
                if (visited.find(nextStop) == visited.end()) {
                    visited.insert(nextStop);
                    vector<int> newPath = current.path;
                    newPath.push_back(routeID);
                    q.push({nextStop, newPath});
                }
            }
        }
    }
    
    return {};
}

// ========================
// Seat Management
// ========================

void initializeSeatsForRoute(int routeID, int totalSeats = 40) {
    for (int i = 1; i <= totalSeats; i++) {
        string seatID = "R" + to_string(routeID) + "S" + to_string(i);
        seats[seatID] = {seatID, "Available", "", routeID, ""};
    }
}

int countAvailableSeats(int routeID) {
    int count = 0;
    for (const auto& pair : seats) {
        if (pair.second.routeID == routeID && pair.second.status == "Available") {
            count++;
        }
    }
    return count;
}

int countBookedSeats(int routeID) {
    int count = 0;
    for (const auto& pair : seats) {
        if (pair.second.routeID == routeID && pair.second.status == "Booked") {
            count++;
        }
    }
    return count;
}

int countReservedSeats(int routeID) {
    int count = 0;
    for (const auto& pair : seats) {
        if (pair.second.routeID == routeID && pair.second.status == "Reserved") {
            count++;
        }
    }
    return count;
}

vector<string> getAvailableSeats(int routeID) {
    vector<string> available;
    for (const auto& pair : seats) {
        if (pair.second.routeID == routeID && pair.second.status == "Available") {
            available.push_back(pair.second.seatID);
        }
    }
    sort(available.begin(), available.end());
    return available;
}

vector<string> getBookedSeats(int routeID) {
    vector<string> booked;
    for (const auto& pair : seats) {
        if (pair.second.routeID == routeID && pair.second.status == "Booked") {
            booked.push_back(pair.second.seatID);
        }
    }
    sort(booked.begin(), booked.end());
    return booked;
}

// ========================
// User Management
// ========================

bool createUser(const string& userID, const string& name, const string& email) {
    if (users.find(userID) != users.end()) {
        return false; // User already exists
    }
    users[userID] = {userID, name, email, {}, 0, 0.0};
    saveUsers();  // Persist to file
    return true;
}

bool updateUser(const string& userID, const string& name, const string& email) {
    if (users.find(userID) == users.end()) {
        return false;
    }
    users[userID].name = name;
    users[userID].email = email;
    saveUsers();  // Persist to file
    return true;
}

bool userExists(const string& userID) {
    return users.find(userID) != users.end();
}

// ========================
// Booking Management
// ========================

string bookSeats(int routeID, const string& routeInfo, const string& userID, 
                 const vector<string>& seatIDs, double pricePerSeat) {
    
    if (!userExists(userID)) {
        return "ERROR:User does not exist";
    }
    
    // Check if all seats are available
    for (const string& seatID : seatIDs) {
        if (seats.find(seatID) == seats.end()) {
            return "ERROR:Seat " + seatID + " does not exist";
        }
        if (seats[seatID].status != "Available") {
            return "ERROR:Seat " + seatID + " is not available";
        }
        if (seats[seatID].routeID != routeID) {
            return "ERROR:Seat " + seatID + " does not belong to this route";
        }
    }
    
    // Create booking
    string bookingID = generateBookingID();
    double totalPrice = pricePerSeat * seatIDs.size();
    
    Booking booking = {
        bookingID,
        routeID,
        routeInfo,
        userID,
        seatIDs,
        totalPrice,
        getCurrentTimestamp(),
        "Active"
    };
    
    bookings[bookingID] = booking;
    
    // Update seats
    for (const string& seatID : seatIDs) {
        seats[seatID].status = "Booked";
        seats[seatID].userID = userID;
        seats[seatID].bookingID = bookingID;
    }
    
    // Update user
    users[userID].bookingIDs.push_back(bookingID);
    users[userID].totalBookings++;
    users[userID].totalSpent += totalPrice;
    
    // Persist changes
    saveBookings();
    saveSeatState();
    saveUsers();
    
    return bookingID;
}

bool cancelBooking(const string& bookingID, const string& userID) {
    if (bookings.find(bookingID) == bookings.end()) {
        return false;
    }
    
    Booking& booking = bookings[bookingID];
    
    if (booking.userID != userID) {
        return false; // User doesn't own this booking
    }
    
    if (booking.status == "Cancelled") {
        return false; // Already cancelled
    }
    
    // Free up seats
    for (const string& seatID : booking.seatIDs) {
        if (seats.find(seatID) != seats.end()) {
            seats[seatID].status = "Available";
            seats[seatID].userID = "";
            seats[seatID].bookingID = "";
        }
    }
    
    // Update booking status
    booking.status = "Cancelled";
    
    // Update user stats
    users[userID].totalSpent -= booking.totalPrice;
    
    return true;
}

bool reserveSeat(const string& seatID, const string& userID) {
    if (seats.find(seatID) == seats.end()) {
        return false;
    }
    
    if (seats[seatID].status != "Available") {
        return false;
    }
    
    seats[seatID].status = "Reserved";
    seats[seatID].userID = userID;
    return true;
}

bool releaseSeat(const string& seatID, const string& userID) {
    if (seats.find(seatID) == seats.end()) {
        return false;
    }
    
    if (seats[seatID].userID != userID) {
        return false;
    }
    
    if (seats[seatID].status == "Reserved") {
        seats[seatID].status = "Available";
        seats[seatID].userID = "";
        return true;
    }
    
    return false;
}

// ========================
// JSON Output Functions
// ========================

string vectorToJSON(const vector<string>& vec) {
    ostringstream oss;
    oss << "[";
    for (size_t i = 0; i < vec.size(); i++) {
        oss << "\"" << vec[i] << "\"";
        if (i < vec.size() - 1) oss << ",";
    }
    oss << "]";
    return oss.str();
}

string seatsToJSON(int routeID) {
    ostringstream oss;
    oss << "[";
    bool first = true;
    for (const auto& pair : seats) {
        if (pair.second.routeID == routeID) {
            if (!first) oss << ",";
            first = false;
            oss << "{"
                << "\"seatID\":\"" << pair.second.seatID << "\","
                << "\"status\":\"" << pair.second.status << "\","
                << "\"userID\":\"" << pair.second.userID << "\","
                << "\"bookingID\":\"" << pair.second.bookingID << "\""
                << "}";
        }
    }
    oss << "]";
    return oss.str();
}

string allSeatsToJSON() {
    ostringstream oss;
    oss << "[";
    bool first = true;
    for (const auto& pair : seats) {
        if (!first) oss << ",";
        first = false;
        oss << "{"
            << "\"seatID\":\"" << pair.second.seatID << "\","
            << "\"status\":\"" << pair.second.status << "\","
            << "\"userID\":\"" << pair.second.userID << "\","
            << "\"routeID\":" << pair.second.routeID << ","
            << "\"bookingID\":\"" << pair.second.bookingID << "\""
            << "}";
    }
    oss << "]";
    return oss.str();
}

string userToJSON(const string& userID) {
    if (users.find(userID) == users.end()) {
        return "{}";
    }
    
    const User& u = users[userID];
    ostringstream oss;
    oss << "{"
        << "\"userID\":\"" << u.userID << "\","
        << "\"name\":\"" << u.name << "\","
        << "\"email\":\"" << u.email << "\","
        << "\"totalBookings\":" << u.totalBookings << ","
        << "\"totalSpent\":" << fixed << setprecision(2) << u.totalSpent << ","
        << "\"bookingIDs\":" << vectorToJSON(u.bookingIDs)
        << "}";
    return oss.str();
}

string allUsersToJSON() {
    ostringstream oss;
    oss << "[";
    bool first = true;
    for (const auto& pair : users) {
        if (!first) oss << ",";
        first = false;
        oss << userToJSON(pair.first);
    }
    oss << "]";
    return oss.str();
}

string bookingToJSON(const string& bookingID) {
    if (bookings.find(bookingID) == bookings.end()) {
        return "{}";
    }
    
    const Booking& b = bookings[bookingID];
    ostringstream oss;
    oss << "{"
        << "\"bookingID\":\"" << b.bookingID << "\","
        << "\"routeID\":" << b.routeID << ","
        << "\"routeInfo\":\"" << b.routeInfo << "\","
        << "\"userID\":\"" << b.userID << "\","
        << "\"seatIDs\":" << vectorToJSON(b.seatIDs) << ","
        << "\"totalPrice\":" << fixed << setprecision(2) << b.totalPrice << ","
        << "\"timestamp\":\"" << b.timestamp << "\","
        << "\"status\":\"" << b.status << "\""
        << "}";
    return oss.str();
}

string allBookingsToJSON() {
    ostringstream oss;
    oss << "[";
    bool first = true;
    for (const auto& pair : bookings) {
        if (!first) oss << ",";
        first = false;
        oss << bookingToJSON(pair.first);
    }
    oss << "]";
    return oss.str();
}

string userBookingsToJSON(const string& userID) {
    if (users.find(userID) == users.end()) {
        return "[]";
    }
    
    ostringstream oss;
    oss << "[";
    bool first = true;
    for (const string& bookingID : users[userID].bookingIDs) {
        if (!first) oss << ",";
        first = false;
        oss << bookingToJSON(bookingID);
    }
    oss << "]";
    return oss.str();
}

string seatStatsToJSON(int routeID) {
    ostringstream oss;
    oss << "{"
        << "\"routeID\":" << routeID << ","
        << "\"total\":40,"
        << "\"available\":" << countAvailableSeats(routeID) << ","
        << "\"booked\":" << countBookedSeats(routeID) << ","
        << "\"reserved\":" << countReservedSeats(routeID)
        << "}";
    return oss.str();
}

// ========================
// JSON Input Parser
// ========================

string extractValue(const string& input, const string& key) {
    size_t keyPos = input.find("\"" + key + "\"");
    if (keyPos == string::npos) return "";
    
    size_t colonPos = input.find(':', keyPos);
    if (colonPos == string::npos) return "";
    
    size_t valueStart = input.find_first_not_of(" \t\n\r", colonPos + 1);
    if (valueStart == string::npos) return "";
    
    if (input[valueStart] == '"') {
        size_t valueEnd = input.find('"', valueStart + 1);
        if (valueEnd == string::npos) return "";
        return input.substr(valueStart + 1, valueEnd - valueStart - 1);
    } else if (isdigit(input[valueStart]) || input[valueStart] == '-') {
        size_t valueEnd = input.find_first_of(",}\n", valueStart);
        if (valueEnd == string::npos) valueEnd = input.length();
        return input.substr(valueStart, valueEnd - valueStart);
    }
    
    return "";
}

vector<string> extractArray(const string& input, const string& key) {
    vector<string> result;
    size_t keyPos = input.find("\"" + key + "\"");
    if (keyPos == string::npos) return result;
    
    size_t arrayStart = input.find('[', keyPos);
    size_t arrayEnd = input.find(']', arrayStart);
    if (arrayStart == string::npos || arrayEnd == string::npos) return result;
    
    string arrayContent = input.substr(arrayStart + 1, arrayEnd - arrayStart - 1);
    size_t pos = 0;
    while (pos < arrayContent.length()) {
        size_t quoteStart = arrayContent.find('"', pos);
        if (quoteStart == string::npos) break;
        size_t quoteEnd = arrayContent.find('"', quoteStart + 1);
        if (quoteEnd == string::npos) break;
        result.push_back(arrayContent.substr(quoteStart + 1, quoteEnd - quoteStart - 1));
        pos = quoteEnd + 1;
    }
    
    return result;
}

// ========================
// Main Command Processor
// ========================

int main(int argc, char* argv[]) {
    string input, line;
    while (getline(cin, line)) {
        input += line;
    }
    
    // Load persisted data so this process knows about existing users/bookings/seats
    loadUsers();
    loadBookings();
    loadSeatState();
    loadRoutesFromFile();

    string cmd = extractValue(input, "cmd");
    
    if (cmd.empty()) {
        cout << "{\"error\":\"No command specified\"}" << endl;
        return 1;
    }
    
    // User Management Commands
    if (cmd == "createUser") {
        string userID = extractValue(input, "userID");
        string name = extractValue(input, "name");
        string email = extractValue(input, "email");
        
        if (createUser(userID, name, email)) {
            cout << "{\"success\":true,\"user\":" << userToJSON(userID) << "}" << endl;
        } else {
            cout << "{\"error\":\"User already exists\"}" << endl;
        }
    }
    else if (cmd == "updateUser") {
        string userID = extractValue(input, "userID");
        string name = extractValue(input, "name");
        string email = extractValue(input, "email");
        
        if (updateUser(userID, name, email)) {
            cout << "{\"success\":true,\"user\":" << userToJSON(userID) << "}" << endl;
        } else {
            cout << "{\"error\":\"User not found\"}" << endl;
        }
    }
    else if (cmd == "getUser") {
        string userID = extractValue(input, "userID");
        string result = userToJSON(userID);
        if (result == "{}") {
            cout << "{\"error\":\"User not found\"}" << endl;
        } else {
            cout << result << endl;
        }
    }
    else if (cmd == "getAllUsers") {
        cout << allUsersToJSON() << endl;
    }
    
    // Seat Management Commands
    else if (cmd == "initSeats") {
        string routeIDStr = extractValue(input, "routeID");
        int routeID = routeIDStr.empty() ? 1 : stoi(routeIDStr);
        initializeSeatsForRoute(routeID);
        // Persist seat state after initialization so subsequent calls see it
        saveSeatState();
        cout << "{\"success\":true,\"message\":\"Seats initialized for route " << routeID << "\"}" << endl;
    }
    else if (cmd == "getSeats") {
        string routeIDStr = extractValue(input, "routeID");
        int routeID = routeIDStr.empty() ? 1 : stoi(routeIDStr);
        cout << seatsToJSON(routeID) << endl;
    }
    else if (cmd == "getAllSeats") {
        cout << allSeatsToJSON() << endl;
    }
    else if (cmd == "getSeatStats") {
        string routeIDStr = extractValue(input, "routeID");
        int routeID = routeIDStr.empty() ? 1 : stoi(routeIDStr);
        cout << seatStatsToJSON(routeID) << endl;
    }
    else if (cmd == "getAvailableSeats") {
        string routeIDStr = extractValue(input, "routeID");
        int routeID = routeIDStr.empty() ? 1 : stoi(routeIDStr);
        vector<string> available = getAvailableSeats(routeID);
        cout << vectorToJSON(available) << endl;
    }
    else if (cmd == "getBookedSeats") {
        string routeIDStr = extractValue(input, "routeID");
        int routeID = routeIDStr.empty() ? 1 : stoi(routeIDStr);
        vector<string> booked = getBookedSeats(routeID);
        cout << vectorToJSON(booked) << endl;
    }
    
    // Booking Commands
    else if (cmd == "bookSeats") {
        string routeIDStr = extractValue(input, "routeID");
        string routeInfo = extractValue(input, "routeInfo");
        string userID = extractValue(input, "userID");
        string priceStr = extractValue(input, "pricePerSeat");
        vector<string> seatIDs = extractArray(input, "seatIDs");
        
        int routeID = stoi(routeIDStr);
        double pricePerSeat = stod(priceStr);
        
        string result = bookSeats(routeID, routeInfo, userID, seatIDs, pricePerSeat);
        
        if (result.substr(0, 6) == "ERROR:") {
            cout << "{\"error\":\"" << result.substr(6) << "\"}" << endl;
        } else {
            cout << "{\"success\":true,\"bookingID\":\"" << result << "\","
                 << "\"booking\":" << bookingToJSON(result) << "}" << endl;
        }
    }
    else if (cmd == "cancelBooking") {
        string bookingID = extractValue(input, "bookingID");
        string userID = extractValue(input, "userID");
        
        if (cancelBooking(bookingID, userID)) {
            cout << "{\"success\":true,\"message\":\"Booking cancelled successfully\"}" << endl;
        } else {
            cout << "{\"error\":\"Cannot cancel booking\"}" << endl;
        }
    }
    else if (cmd == "getBooking") {
        string bookingID = extractValue(input, "bookingID");
        string result = bookingToJSON(bookingID);
        if (result == "{}") {
            cout << "{\"error\":\"Booking not found\"}" << endl;
        } else {
            cout << result << endl;
        }
    }
    else if (cmd == "getAllBookings") {
        cout << allBookingsToJSON() << endl;
    }
    else if (cmd == "getUserBookings") {
        string userID = extractValue(input, "userID");
        cout << userBookingsToJSON(userID) << endl;
    }
    
    // Seat Reservation Commands
    else if (cmd == "reserveSeat") {
        string seatID = extractValue(input, "seatID");
        string userID = extractValue(input, "userID");
        
        if (reserveSeat(seatID, userID)) {
            cout << "{\"success\":true,\"message\":\"Seat reserved\"}" << endl;
        } else {
            cout << "{\"error\":\"Cannot reserve seat\"}" << endl;
        }
    }
    else if (cmd == "releaseSeat") {
        string seatID = extractValue(input, "seatID");
        string userID = extractValue(input, "userID");
        
        if (releaseSeat(seatID, userID)) {
            cout << "{\"success\":true,\"message\":\"Seat released\"}" << endl;
        } else {
            cout << "{\"error\":\"Cannot release seat\"}" << endl;
        }
    }
    
    else if (cmd == "findRoute") {
        string from = extractValue(input, "from");
        string to = extractValue(input, "to");
        
        vector<int> path = findRoutePath(from, to);
        
        if (path.empty()) {
            cout << "{\"error\":\"No route found\"}" << endl;
        } else {
            ostringstream oss;
            oss << "{\"success\":true,\"routePath\":[";
            
            double totalDistance = 0;
            double totalFare = 0;
            
            for (size_t i = 0; i < path.size(); i++) {
                int routeID = path[i];
                if (allStoredRoutes.find(routeID) != allStoredRoutes.end()) {
                    Route& route = allStoredRoutes[routeID];
                    if (i > 0) oss << ",";
                    oss << "{\"routeID\":" << routeID 
                        << ",\"from\":\"" << route.from << "\""
                        << ",\"to\":\"" << route.to << "\""
                        << ",\"distance\":" << fixed << setprecision(2) << route.distance
                        << ",\"ticketPrice\":" << fixed << setprecision(2) << route.ticketPrice
                        << "}";
                    totalDistance += route.distance;
                    totalFare += route.ticketPrice;
                }
            }
            
            oss << "],\"totalDistance\":" << fixed << setprecision(2) << totalDistance
                << ",\"totalFare\":" << fixed << setprecision(2) << totalFare
                << ",\"stops\":" << (int)path.size()
                << "}";
            
            cout << oss.str() << endl;
        }
    }
    
    else {
        cout << "{\"error\":\"Unknown command: " << cmd << "\"}" << endl;
        return 1;
    }
    
    return 0;
}