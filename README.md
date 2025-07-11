# StratCap Fund Management Platform

A comprehensive fund management platform designed for private equity, venture capital, hedge funds, and real estate funds. Built with modern microservices architecture for scalability, security, and compliance.

## 🎯 Overview

StratCap streamlines complex fund operations by:
- **Unifying Data**: Seamless integration with GL systems and investor portals
- **Automating Workflows**: Capital calls, distributions, and waterfall calculations
- **Delivering Insights**: Real-time analytics and comprehensive reporting
- **Ensuring Compliance**: SOC 2, SEC, and FINRA compliance built-in

## 🏗️ Architecture

### Technology Stack
- **Backend**: FastAPI (Python 3.11+), PostgreSQL, Redis, Kafka
- **Frontend**: React 18, TypeScript, Material-UI, Redux Toolkit
- **Infrastructure**: Docker, Kubernetes, AWS, Terraform
- **Monitoring**: Prometheus, Grafana, ELK Stack

### Microservices
- **API Gateway**: Request routing, authentication, rate limiting
- **User Management**: Authentication, authorization, user profiles
- **Fund Management**: Fund operations, investor management
- **Data Ingestion**: GL integration, data processing
- **Calculation Engine**: Financial calculations, waterfalls
- **Workflow Engine**: Process automation, approvals
- **Reporting**: Report generation, analytics
- **Notification**: Email, SMS, system alerts

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Docker Compose
- Node.js 18+
- Python 3.11+

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd StratCap
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Initialize database**
   ```bash
   # Database is automatically initialized with docker-compose
   # Check logs: docker-compose logs postgres
   ```

5. **Access the application**
   - API Gateway: http://localhost:8000
   - API Documentation: http://localhost:8000/api/docs
   - Frontend: http://localhost:3000
   - pgAdmin: http://localhost:5050 (admin@stratcap.com / admin123)
   - Redis Commander: http://localhost:8081

### Development Workflow

1. **Backend Development**
   ```bash
   # Start specific service for development
   cd backend/api-gateway
   pip install -r requirements.txt
   uvicorn src.main:app --reload --port 8000
   ```

2. **Frontend Development**
   ```bash
   cd frontend/web-app
   npm install
   npm start
   ```

3. **Running Tests**
   ```bash
   # Backend tests
   cd backend/api-gateway
   pytest tests/ -v

   # Frontend tests
   cd frontend/web-app
   npm test
   ```

## 📊 Database Schema

### Core Entities
- **Users**: Authentication and user management
- **Funds**: Fund information and configurations
- **Investors**: Investor profiles and KYC data
- **Commitments**: Investor commitments to funds
- **Capital Calls**: Capital call management
- **Distributions**: Distribution processing
- **Audit Trail**: Comprehensive audit logging

### Key Features
- UUID primary keys for all entities
- Comprehensive audit trails
- Optimized indexes for performance
- Data validation constraints
- Automatic timestamp management

## 🔐 Security

### Authentication & Authorization
- **OAuth 2.0**: Standard authentication protocol
- **JWT Tokens**: Stateless authentication
- **MFA**: Multi-factor authentication support
- **RBAC**: Role-based access control

### Security Features
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Rate Limiting**: API throttling and abuse prevention
- **Input Validation**: Comprehensive request validation
- **Audit Logging**: Complete activity tracking
- **Security Headers**: OWASP security headers

### Compliance
- **SOC 2 Type II**: Security and availability controls
- **SEC Compliance**: Investment adviser requirements
- **GDPR/CCPA**: Data privacy compliance
- **Financial Regulations**: SEC Rule 204, FINRA requirements

## 🎛️ API Documentation

### Core Endpoints

#### Authentication
```http
POST /api/auth/login          # User login
POST /api/auth/refresh        # Token refresh
POST /api/auth/logout         # User logout
```

#### Fund Management
```http
GET  /api/funds               # List funds
POST /api/funds               # Create fund
GET  /api/funds/{id}          # Get fund details
PUT  /api/funds/{id}          # Update fund
```

#### Investor Management
```http
GET  /api/investors           # List investors
POST /api/investors           # Create investor
GET  /api/investors/{id}      # Get investor details
PUT  /api/investors/{id}      # Update investor
```

#### Financial Operations
```http
POST /api/calculations/waterfall    # Waterfall calculations
POST /api/calculations/fees         # Fee calculations
POST /api/workflows/capital-calls   # Capital call workflow
POST /api/workflows/distributions   # Distribution workflow
```

#### Reporting
```http
GET  /api/reports/investor-statements/{id}  # Investor statements
POST /api/reports/custom                    # Custom reports
GET  /api/reports/performance/{fund-id}     # Performance reports
```

### API Features
- **OpenAPI 3.0**: Complete API documentation
- **Request Validation**: Automatic request/response validation
- **Error Handling**: Consistent error responses
- **Rate Limiting**: Configurable rate limits
- **Versioning**: API versioning support

## 🔧 Configuration

### Environment Variables

#### Core Settings
```bash
ENVIRONMENT=development|staging|production
DEBUG=true|false
PORT=8000
LOG_LEVEL=DEBUG|INFO|WARNING|ERROR
```

#### Database
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
DATABASE_POOL_SIZE=5
DATABASE_MAX_CONNECTIONS=20
```

#### Security
```bash
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60
```

#### External Services
```bash
REDIS_URL=redis://host:port
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
AWS_REGION=us-east-1
```

## 🚢 Deployment

### Development
```bash
docker-compose up -d
```

### Staging/Production
```bash
# Using Kubernetes
kubectl apply -k infrastructure/kubernetes/overlays/production/

# Using Terraform
cd infrastructure/terraform/environments/prod
terraform init
terraform plan
terraform apply
```

### CI/CD Pipeline
- **GitHub Actions**: Automated testing and deployment
- **Multi-stage**: Test → Security Scan → Build → Deploy
- **Environments**: Automatic deployment to staging and production
- **Rollback**: Automatic rollback on health check failures

## 📈 Monitoring

### Metrics & Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and visualization
- **Health Checks**: Kubernetes probes
- **Alerting**: PagerDuty integration

### Logging
- **Structured Logging**: JSON formatted logs
- **ELK Stack**: Centralized log management
- **Log Levels**: Configurable log levels
- **Audit Logging**: Compliance audit trails

### Performance
- **Response Times**: <200ms API response target
- **Uptime**: 99.9% availability SLA
- **Scalability**: Horizontal pod autoscaling
- **Caching**: Redis caching for performance

## 🧪 Testing

### Test Coverage
- **Unit Tests**: >90% code coverage
- **Integration Tests**: API and database integration
- **End-to-End Tests**: Complete user workflows
- **Performance Tests**: Load and stress testing

### Test Commands
```bash
# Run all tests
make test

# Backend tests
cd backend/api-gateway && pytest tests/ -v --cov=src

# Frontend tests
cd frontend/web-app && npm test

# Integration tests
cd tests/integration && pytest -v

# Performance tests
cd tests/performance && locust -f load_test.py
```

## 📁 Project Structure

```
StratCap/
├── backend/
│   ├── api-gateway/           # API Gateway service
│   ├── services/              # Microservices
│   ├── shared/                # Shared libraries
│   └── database/              # Database schemas
├── frontend/
│   ├── web-app/               # React web application
│   ├── mobile-app/            # React Native mobile app
│   └── shared-components/     # Shared UI components
├── infrastructure/
│   ├── kubernetes/            # Kubernetes manifests
│   ├── terraform/             # Infrastructure as Code
│   ├── docker/                # Docker configurations
│   └── monitoring/            # Monitoring configs
├── tests/                     # Test suites
├── docs/                      # Documentation
└── scripts/                   # Utility scripts
```

## 🤝 Contributing

### Development Process
1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Add** tests for new functionality
5. **Ensure** all tests pass
6. **Submit** a pull request

### Code Standards
- **Python**: PEP 8, Black formatting
- **TypeScript**: ESLint, Prettier formatting
- **Documentation**: Comprehensive docstrings and comments
- **Testing**: Test-driven development

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

### Getting Help
- **Documentation**: Check the `/docs` folder
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Email**: support@stratcap.com

### Emergency Contacts
- **Production Issues**: DevOps team
- **Security Issues**: Security team
- **Business Issues**: Product team

---

**StratCap Fund Management Platform** - Streamlining fund operations through technology