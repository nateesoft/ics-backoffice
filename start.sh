#!/bin/bash
echo "Starting ICS Backoffice..."
echo ""
echo "Backend -> http://localhost:3001"
echo "Frontend -> http://localhost:3000"
echo ""

# Start backend
cd backend && npm run start:dev &
BACKEND_PID=$!

# Start frontend
cd ../frontend && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
