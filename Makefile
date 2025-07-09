# StratCap Fund Management Platform - Development Makefile

.PHONY: help install start stop clean test lint build deploy

# Default target
help:
	@echo "StratCap Fund Management Platform - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  install     Install all dependencies"
	@echo "  start       Start all services for development"
	@echo "  stop        Stop all running services"
	@echo "  clean       Clean up containers and volumes"
	@echo ""
	@echo "Testing:"
	@echo "  test        Run all tests"
	@echo "  test-backend Run backend tests only"
	@echo "  test-frontend Run frontend tests only"
	@echo "  lint        Run linting on all code"
	@echo ""
	@echo "Building:"
	@echo "  build       Build all Docker images"
	@echo "  build-backend Build backend services"
	@echo "  build-frontend Build frontend application"
	@echo ""
	@echo "Deployment:"
	@echo "  deploy-dev  Deploy to development environment"
	@echo "  deploy-staging Deploy to staging environment"
	@echo "  deploy-prod Deploy to production environment"
	@echo ""

# Installation
install: install-backend install-frontend

install-backend:
	@echo "Installing backend dependencies..."
	cd backend/api-gateway && pip install -r requirements.txt

install-frontend:
	@echo "Installing frontend dependencies..."
	cd frontend/web-app && npm install

# Development
start:
	@echo "Starting StratCap development environment..."
	cp .env.example .env
	docker-compose up -d
	@echo "Services started! Access points:"
	@echo "- API Gateway: http://localhost:8000"
	@echo "- API Docs: http://localhost:8000/api/docs"
	@echo "- Frontend: http://localhost:3000"
	@echo "- pgAdmin: http://localhost:5050"
	@echo "- Redis Commander: http://localhost:8081"

stop:
	@echo "Stopping all services..."
	docker-compose down

clean:
	@echo "Cleaning up containers and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# Testing
test: test-backend test-frontend

test-backend:
	@echo "Running backend tests..."
	cd backend/api-gateway && python -m pytest tests/ -v --cov=src

test-frontend:
	@echo "Running frontend tests..."
	cd frontend/web-app && npm test -- --coverage --watchAll=false

lint:
	@echo "Running linting..."
	cd backend/api-gateway && black src/ tests/ && flake8 src/ tests/
	cd frontend/web-app && npm run lint:fix

# Building
build: build-backend build-frontend

build-backend:
	@echo "Building backend Docker images..."
	docker-compose build api-gateway user-management fund-management data-ingestion calculation-engine workflow-engine reporting notification

build-frontend:
	@echo "Building frontend Docker image..."
	docker-compose build frontend

# Database operations
db-migrate:
	@echo "Running database migrations..."
	docker-compose exec postgres psql -U stratcap -d stratcap -f /docker-entrypoint-initdb.d/init.sql

db-reset:
	@echo "Resetting database..."
	docker-compose stop postgres
	docker volume rm stratcap_postgres_data
	docker-compose up -d postgres
	sleep 5
	make db-migrate

# Logs
logs:
	docker-compose logs -f

logs-api:
	docker-compose logs -f api-gateway

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f postgres

# Development helpers
shell-api:
	docker-compose exec api-gateway /bin/bash

shell-db:
	docker-compose exec postgres psql -U stratcap -d stratcap

shell-redis:
	docker-compose exec redis redis-cli

# Deployment
deploy-dev:
	@echo "Deploying to development environment..."
	kubectl apply -k infrastructure/kubernetes/overlays/development/

deploy-staging:
	@echo "Deploying to staging environment..."
	kubectl apply -k infrastructure/kubernetes/overlays/staging/

deploy-prod:
	@echo "Deploying to production environment..."
	kubectl apply -k infrastructure/kubernetes/overlays/production/

# Status
status:
	@echo "Service Status:"
	@docker-compose ps
	@echo ""
	@echo "Health Checks:"
	@curl -s http://localhost:8000/api/health | jq '.' || echo "API Gateway not responding"

# Security
security-scan:
	@echo "Running security scans..."
	docker run --rm -v $(PWD):/app aquasec/trivy fs /app

# Performance
performance-test:
	@echo "Running performance tests..."
	cd tests/performance && locust -f load_test.py --headless -u 10 -r 2 -t 30s --host=http://localhost:8000