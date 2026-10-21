.PHONY: setup train test test-backend test-frontend dev dev-backend dev-frontend docker-build docker-up clean

setup:
	@echo "Installing Backend dependencies..."
	pip install -r backend/requirements.txt
	@echo "Installing Frontend dependencies..."
	cd frontend && npm install
	@echo "Training models and generating metrics..."
	cd ml && python train.py && python export_metrics.py
	@echo "Setup complete!"

train:
	@echo "Retraining CardioCare Dual-Model Ensembles..."
	cd ml && python train.py && python export_metrics.py

test: test-backend test-frontend

test-backend:
	@echo "Running Pytest backend test suite..."
	cd backend && python -m pytest app/tests/test_api.py -v

test-frontend:
	@echo "Running Vitest frontend component tests..."
	cd frontend && npm test

dev-backend:
	@echo "Starting FastAPI backend on http://127.0.0.1:8000..."
	cd backend && uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

dev-frontend:
	@echo "Starting Vite frontend on http://127.0.0.1:5173..."
	cd frontend && npm run dev

dev:
	@echo "Starting CardioCare end-to-end..."
	@echo "Start backend: uvicorn app.main:app --reload --port 8000 (in backend/)"
	@echo "Start frontend: npm run dev (in frontend/)"

docker-build:
	docker compose build

docker-up:
	docker compose up -d

clean:
	rm -rf backend/.pytest_cache frontend/dist frontend/node_modules
