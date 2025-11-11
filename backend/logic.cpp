#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <queue>
#include <algorithm>
#include <cmath>
#include <sstream>
#include <iomanip>

// Simple JSON parsing - in production use a library like nlohmann/json
// For this demo, we'll parse simple JSON structures manually

struct Coordinate {
    double lat;
    double lng;
};

struct Route {
    std::string from;
    std::string to;
    double distance;
    std::vector<Coordinate> coords;
};

// Parse a simple JSON array of routes
std::vector<Route> parseRoutes(const std::string& json) {
    std::vector<Route> routes;
    // Simple parser for demo purposes
    // Expected format: [{"from":"A","to":"B","distance":100,"coords":[{"lat":28.6,"lng":77.2},...]}]
    
    size_t pos = json.find('[');
    if (pos == std::string::npos) return routes;
    
    pos++;
    while (pos < json.length()) {
        size_t start = json.find('{', pos);
        if (start == std::string::npos) break;
        
        size_t end = json.find('}', start);
        if (end == std::string::npos) break;
        
        std::string routeStr = json.substr(start, end - start + 1);
        Route r;
        
        // Extract from
        size_t fromPos = routeStr.find("\"from\"");
        if (fromPos != std::string::npos) {
            size_t valStart = routeStr.find(':', fromPos) + 1;
            size_t quoteStart = routeStr.find('"', valStart);
            size_t quoteEnd = routeStr.find('"', quoteStart + 1);
            r.from = routeStr.substr(quoteStart + 1, quoteEnd - quoteStart - 1);
        }
        
        // Extract to
        size_t toPos = routeStr.find("\"to\"");
        if (toPos != std::string::npos) {
            size_t valStart = routeStr.find(':', toPos) + 1;
            size_t quoteStart = routeStr.find('"', valStart);
            size_t quoteEnd = routeStr.find('"', quoteStart + 1);
            r.to = routeStr.substr(quoteStart + 1, quoteEnd - quoteStart - 1);
        }
        
        // Extract distance
        size_t distPos = routeStr.find("\"distance\"");
        if (distPos != std::string::npos) {
            size_t valStart = routeStr.find(':', distPos) + 1;
            size_t valEnd = routeStr.find_first_of(",}", valStart);
            r.distance = std::stod(routeStr.substr(valStart, valEnd - valStart));
        }
        
        routes.push_back(r);
        pos = end + 1;
    }
    
    return routes;
}

// Build adjacency graph from routes
std::map<std::string, std::vector<std::pair<std::string, double>>> buildGraph(const std::vector<Route>& routes) {
    std::map<std::string, std::vector<std::pair<std::string, double>>> graph;
    
    for (const auto& route : routes) {
        graph[route.from].push_back({route.to, route.distance});
        // Bidirectional routes
        graph[route.to].push_back({route.from, route.distance});
    }
    
    return graph;
}

// Dijkstra's algorithm to find shortest path
std::pair<std::vector<std::string>, double> findShortestPath(
    const std::map<std::string, std::vector<std::pair<std::string, double>>>& graph,
    const std::string& start,
    const std::string& end) {
    
    std::map<std::string, double> distances;
    std::map<std::string, std::string> previous;
    std::priority_queue<std::pair<double, std::string>, 
                       std::vector<std::pair<double, std::string>>,
                       std::greater<std::pair<double, std::string>>> pq;
    
    // Initialize distances
    for (const auto& node : graph) {
        distances[node.first] = INFINITY;
    }
    distances[start] = 0;
    pq.push({0, start});
    
    while (!pq.empty()) {
        auto [dist, current] = pq.top();
        pq.pop();
        
        if (current == end) break;
        if (dist > distances[current]) continue;
        
        if (graph.find(current) != graph.end()) {
            for (const auto& [neighbor, weight] : graph.at(current)) {
                double newDist = distances[current] + weight;
                if (newDist < distances[neighbor]) {
                    distances[neighbor] = newDist;
                    previous[neighbor] = current;
                    pq.push({newDist, neighbor});
                }
            }
        }
    }
    
    // Reconstruct path
    std::vector<std::string> path;
    if (distances[end] == INFINITY) {
        return {path, -1};
    }
    
    std::string current = end;
    while (current != start) {
        path.push_back(current);
        current = previous[current];
    }
    path.push_back(start);
    std::reverse(path.begin(), path.end());
    
    return {path, distances[end]};
}

// Calculate fare based on distance
double calculateFare(double distance) {
    // Base fare: $10
    // Per km: $0.5
    double baseFare = 10.0;
    double perKmRate = 0.5;
    return baseFare + (distance * perKmRate);
}

// Estimate time based on distance (average speed 60 km/h)
double estimateTime(double distance) {
    double avgSpeed = 60.0; // km/h
    return distance / avgSpeed; // hours
}

// Main function to process commands
int main(int argc, char* argv[]) {
    // Read JSON from stdin
    std::string input;
    std::string line;
    while (std::getline(std::cin, line)) {
        input += line;
    }
    
    // Parse command
    size_t cmdPos = input.find("\"cmd\"");
    if (cmdPos == std::string::npos) {
        std::cout << "{\"error\":\"No command specified\"}" << std::endl;
        return 1;
    }
    
    size_t valStart = input.find(':', cmdPos) + 1;
    size_t quoteStart = input.find('"', valStart);
    size_t quoteEnd = input.find('"', quoteStart + 1);
    std::string cmd = input.substr(quoteStart + 1, quoteEnd - quoteStart - 1);
    
    if (cmd == "findRoute") {
        // Extract from
        std::string from, to;
        size_t fromPos = input.find("\"from\"");
        if (fromPos != std::string::npos) {
            size_t vStart = input.find(':', fromPos) + 1;
            size_t qStart = input.find('"', vStart);
            size_t qEnd = input.find('"', qStart + 1);
            from = input.substr(qStart + 1, qEnd - qStart - 1);
        }
        
        // Extract to
        size_t toPos = input.find("\"to\"");
        if (toPos != std::string::npos) {
            size_t vStart = input.find(':', toPos) + 1;
            size_t qStart = input.find('"', vStart);
            size_t qEnd = input.find('"', qStart + 1);
            to = input.substr(qStart + 1, qEnd - qStart - 1);
        }
        
        // Extract routes array
        size_t routesPos = input.find("\"routes\"");
        size_t arrStart = input.find('[', routesPos);
        size_t arrEnd = input.rfind(']');
        std::string routesJson = input.substr(arrStart, arrEnd - arrStart + 1);
        
        std::vector<Route> routes = parseRoutes(routesJson);
        auto graph = buildGraph(routes);
        
        auto [path, distance] = findShortestPath(graph, from, to);
        
        if (distance < 0) {
            std::cout << "{\"error\":\"No route found\"}" << std::endl;
            return 1;
        }
        
        double fare = calculateFare(distance);
        double time = estimateTime(distance);
        
        // Build path string
        std::ostringstream pathStr;
        pathStr << "[";
        for (size_t i = 0; i < path.size(); i++) {
            pathStr << "\"" << path[i] << "\"";
            if (i < path.size() - 1) pathStr << ",";
        }
        pathStr << "]";
        
        // Output JSON result
        std::cout << std::fixed << std::setprecision(2);
        std::cout << "{"
                  << "\"path\":" << pathStr.str() << ","
                  << "\"distance\":" << distance << ","
                  << "\"time\":" << time << ","
                  << "\"fare\":" << fare
                  << "}" << std::endl;
        
    } else if (cmd == "calculateFare") {
        // Extract distance
        double distance = 0;
        size_t distPos = input.find("\"distance\"");
        if (distPos != std::string::npos) {
            size_t valStart = input.find(':', distPos) + 1;
            size_t valEnd = input.find_first_of(",}", valStart);
            distance = std::stod(input.substr(valStart, valEnd - valStart));
        }
        
        double fare = calculateFare(distance);
        std::cout << std::fixed << std::setprecision(2);
        std::cout << "{\"fare\":" << fare << "}" << std::endl;
    } else {
        std::cout << "{\"error\":\"Unknown command\"}" << std::endl;
        return 1;
    }
    
    return 0;
}
