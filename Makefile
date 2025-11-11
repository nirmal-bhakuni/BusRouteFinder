# Makefile for Bus Route Finder

CXX = g++
CXXFLAGS = -O2 -std=c++17
TARGET = backend/logic
SRC = backend/logic.cpp

all: $(TARGET)

$(TARGET): $(SRC)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SRC)

clean:
	rm -f $(TARGET)

rebuild: clean all

.PHONY: all clean rebuild
