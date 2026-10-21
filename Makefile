.PHONY: setup train test test-backend test-frontend dev dev-backend dev-frontend docker-build docker-up

setup:
	@echo "Installing Backend dependencies..."
	pip install -r cardiocare/backend/requirements.txt
	@echo "Installing Frontend dependencies..."
	cd cardiocare/frontend && npm install
	@echo "Training models and generating metrics..."
	cd cardiocare/ml && python train.py && python export_metrics.py
	@echo "Setup complete!"

train:
	@echo "Retraining CardioCare Dual-Model Ensembles..."
	cd cardiocare/ml && python train.py && python export_metrics.py

train-diabetes:
	@echo "Retraining CardioCare Diabetes LightGBM Classifier..."
	cd cardiocare/ml && python train_diabetes.py

test: test-backend test-frontend

test-backend:
	@echo "Running Pytest backend test suite..."
	cd cardiocare/backend && python -m pytest app/tests/test_api.py -v

test-frontend:
	@echo "Running Vitest frontend component tests..."
	cd cardiocare/frontend && npm test

dev-backend:
	@echo "Starting FastAPI backend on http://127.0.0.1:8000..."
	cd cardiocare/backend && uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

dev-frontend:
	@echo "Starting Vite frontend on http://127.0.0.1:5173..."
	cd cardiocare/frontend && npm run dev

dev:
	@echo "To run CardioCare dev servers simultaneously:"
	@echo "Terminal 1: make dev-backend"
	@echo "Terminal 2: make dev-frontend"

docker-build:
	docker compose build

docker-up:
	docker compose up -d
