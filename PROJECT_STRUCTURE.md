# StratCap Project Structure

## Overview
This document outlines the complete folder structure for the StratCap Fund Management Platform project.

## Root Directory Structure

```
/workspaces/StratCap/
├── backend/                    # Backend microservices and APIs
│   ├── api-gateway/           # API Gateway service
│   ├── services/              # Core microservices
│   │   ├── data-ingestion/    # Data ingestion service
│   │   ├── calculation-engine/ # Financial calculation engine
│   │   ├── workflow-engine/   # Workflow automation service
│   │   ├── reporting/         # Reporting service
│   │   ├── user-management/   # User management service
│   │   ├── fund-management/   # Fund management service
│   │   └── notification/      # Notification service
│   ├── shared/               # Shared libraries and utilities
│   └── database/             # Database migrations and schemas
├── frontend/                  # Frontend applications
│   ├── web-app/              # React web application
│   ├── mobile-app/           # React Native mobile app
│   └── shared-components/    # Shared UI components
├── infrastructure/           # Infrastructure as Code
│   ├── kubernetes/           # Kubernetes manifests
│   ├── terraform/            # Terraform configurations
│   ├── docker/               # Docker configurations
│   └── monitoring/           # Monitoring and observability
├── docs/                     # Documentation
│   ├── architecture/         # Architecture documents
│   ├── api/                  # API documentation
│   ├── user-guides/          # User guides and manuals
│   └── compliance/           # Compliance documentation
├── tests/                    # Testing suites
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   ├── e2e/                  # End-to-end tests
│   └── performance/          # Performance tests
├── scripts/                  # Utility scripts
│   ├── deployment/           # Deployment scripts
│   ├── migration/            # Database migration scripts
│   └── utilities/            # General utility scripts
├── PRD.md                    # Product Requirements Document
├── data-architecture.md     # Data Architecture Document
├── security-architecture.md # Security Architecture Document
└── technical-architecture.md # Technical Architecture Document
```

## Backend Services Structure

### API Gateway (`/backend/api-gateway/`)
```
api-gateway/
├── src/
│   ├── config/              # Configuration files
│   ├── middleware/          # Gateway middleware
│   ├── routes/              # Route definitions
│   └── utils/               # Utility functions
├── tests/                   # API Gateway tests
├── Dockerfile              # Container configuration
├── package.json            # Dependencies
└── README.md               # Service documentation
```

### Microservices (`/backend/services/*/`)
Each service follows this structure:
```
service-name/
├── src/
│   ├── controllers/         # Request handlers
│   ├── models/              # Data models
│   ├── services/            # Business logic
│   ├── repositories/        # Data access layer
│   ├── config/              # Configuration
│   ├── middleware/          # Service middleware
│   └── utils/               # Utility functions
├── tests/                   # Service tests
├── migrations/              # Database migrations
├── Dockerfile              # Container configuration
├── requirements.txt        # Python dependencies
└── README.md               # Service documentation
```

### Shared Libraries (`/backend/shared/`)
```
shared/
├── auth/                   # Authentication utilities
├── database/               # Database utilities
├── logging/                # Logging configuration
├── validation/             # Input validation
├── exceptions/             # Custom exceptions
├── models/                 # Shared data models
└── utils/                  # Common utilities
```

## Frontend Structure

### Web Application (`/frontend/web-app/`)
```
web-app/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom hooks
│   ├── services/           # API services
│   ├── store/              # Redux store
│   ├── utils/              # Utility functions
│   ├── styles/             # CSS/SCSS files
│   └── types/              # TypeScript types
├── tests/                  # Frontend tests
├── package.json           # Dependencies
└── README.md              # Frontend documentation
```

### Shared Components (`/frontend/shared-components/`)
```
shared-components/
├── src/
│   ├── components/         # Reusable components
│   ├── hooks/              # Shared hooks
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript types
├── storybook/              # Storybook configuration
└── package.json           # Component library dependencies
```

## Infrastructure Structure

### Kubernetes (`/infrastructure/kubernetes/`)
```
kubernetes/
├── base/                   # Base configurations
├── overlays/               # Environment-specific overlays
│   ├── development/        # Development environment
│   ├── staging/            # Staging environment
│   └── production/         # Production environment
├── charts/                 # Helm charts
└── scripts/                # Deployment scripts
```

### Terraform (`/infrastructure/terraform/`)
```
terraform/
├── modules/                # Reusable Terraform modules
├── environments/           # Environment-specific configurations
│   ├── dev/                # Development environment
│   ├── staging/            # Staging environment
│   └── prod/               # Production environment
├── variables/              # Variable definitions
└── outputs/                # Output definitions
```

## Documentation Structure

### Architecture (`/docs/architecture/`)
```
architecture/
├── system-design/          # System design documents
├── data-models/            # Data model documentation
├── api-design/             # API design documents
├── security/               # Security documentation
└── decisions/              # Architecture decision records
```

### API Documentation (`/docs/api/`)
```
api/
├── openapi/                # OpenAPI specifications
├── postman/                # Postman collections
├── examples/               # API usage examples
└── authentication/         # Authentication guides
```

## Testing Structure

### Unit Tests (`/tests/unit/`)
```
unit/
├── backend/                # Backend unit tests
│   ├── services/           # Service unit tests
│   └── shared/             # Shared library tests
└── frontend/               # Frontend unit tests
```

### Integration Tests (`/tests/integration/`)
```
integration/
├── api/                    # API integration tests
├── database/               # Database integration tests
└── external/               # External service tests
```

### End-to-End Tests (`/tests/e2e/`)
```
e2e/
├── specs/                  # Test specifications
├── fixtures/               # Test data
├── page-objects/           # Page object models
└── utils/                  # Test utilities
```

## Development Workflow

1. **Backend Development**: Start with `/backend/services/` for microservice development
2. **Frontend Development**: Use `/frontend/web-app/` for React application development
3. **Shared Components**: Develop reusable components in `/frontend/shared-components/`
4. **Infrastructure**: Configure deployment in `/infrastructure/`
5. **Documentation**: Maintain docs in `/docs/`
6. **Testing**: Write tests in appropriate `/tests/` subdirectories

## Getting Started

1. Clone the repository
2. Review the PRD and architecture documents
3. Set up the development environment using scripts in `/scripts/`
4. Start with backend services development
5. Build the frontend application
6. Run tests to ensure everything works
7. Deploy using infrastructure configurations

This structure supports:
- ✅ Microservices architecture
- ✅ Modern frontend development
- ✅ Infrastructure as Code
- ✅ Comprehensive testing
- ✅ Detailed documentation
- ✅ DevOps best practices