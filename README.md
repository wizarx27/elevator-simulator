# Elevator Simulator

A simple React-based simulator for a 30-floor building with one or two elevators.

This project is also a testing project for AI-assisted development. Its features and behavior are being iterated through natural-language requests.

## Features

- Simulate a building with floors 1 through 30.
- Choose one- or two-elevator mode.
- Call an elevator with **Up** or **Down** buttons on each valid floor.
- Open the destination selector only when an elevator is travelling in the same direction as the call.
- Choose a destination after the elevator arrives, or cancel the ride.
- Run both elevators independently; new calls prefer an idle elevator so separate calls can run in parallel.
- Reassign a pending pickup when the other elevator becomes idle and is closer.
- See each elevator's current floor, direction, stops, and travel time.
- Set elevator speed to Slow, Normal, or Fast.
- Reset the whole simulation or reset only travel time.

## Run locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Technology

- React
- Vite
- JavaScript
