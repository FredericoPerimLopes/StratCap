# StratCap - Fund Administration & Portfolio Management Platform

A comprehensive web-based platform designed for the administration and management of investment fund families. Built with Node.js, React, TypeScript, and PostgreSQL.

## 🚀 Features

### Core Functionality
- **Fund Family Management**: Centralized management of fund families with detailed configuration
- **Fund Administration**: Complete fund lifecycle management from setup to closure
- **Investor Management**: Comprehensive investor entity management with KYC/AML tracking
- **Capital Activities**: Automated capital calls, distributions, and reallocations
- **Transaction Management**: Detailed transaction tracking and reconciliation
- **Reporting & Analytics**: Advanced reporting with hypothetical waterfalls

### Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Multi-Factor Authentication (MFA)**: TOTP-based MFA support
- **Role-Based Access Control**: Granular permissions (admin, manager, analyst, viewer)
- **Password Security**: Bcrypt hashing with secure password policies

### Technical Features
- **Real-time Updates**: Live updates across the platform
- **API-First Design**: RESTful APIs with comprehensive documentation
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **Comprehensive Testing**: Backend and frontend test suites

## 🏗️ Architecture

### Backend
- **Framework**: Node.js with Express
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT with Passport.js
- **Validation**: Joi for request validation
- **Testing**: Jest with Supertest
- **Documentation**: Automatic API documentation

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **UI Components**: Tailwind CSS with Headless UI
- **Forms**: React Hook Form with Yup validation
- **Testing**: Jest with React Testing Library

### Database Schema
- **Users**: Authentication and user management
- **Fund Families**: Top-level fund organization
- **Funds**: Individual fund entities
- **Investors**: Investor entity management
- **Commitments**: Investment commitments
- **Capital Activities**: Capital calls and distributions
- **Transactions**: Financial transaction records

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 12
- npm >= 9.0.0

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stratcap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   
   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb stratcap_db
   
   # Run migrations
   cd backend
   npm run migrate
   
   # Seed initial data (optional)
   npm run seed
   ```

5. **Start the development servers**
   ```bash
   # Start both backend and frontend
   npm run dev
   
   # Or start individually
   npm run dev:backend  # Backend on http://localhost:5000
   npm run dev:frontend # Frontend on http://localhost:5173
   ```

## 📚 API Documentation

The API follows RESTful conventions with comprehensive endpoint coverage:

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/mfa/setup` - Setup MFA
- `POST /api/auth/password/reset` - Password reset

### Fund Management Endpoints
- `GET /api/fund-families` - List fund families
- `POST /api/fund-families` - Create fund family
- `GET /api/fund-families/:id` - Get fund family details
- `PATCH /api/fund-families/:id` - Update fund family
- `DELETE /api/fund-families/:id` - Delete fund family

### Capital Activity Endpoints
- `GET /api/capital-activities` - List capital activities
- `POST /api/capital-activities` - Create capital activity
- `GET /api/capital-activities/:id` - Get activity details
- `POST /api/capital-activities/:id/approve` - Approve activity

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Frontend Testing
```bash
cd frontend
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### End-to-End Testing
```bash
cd frontend
npm run test:e2e      # Run Cypress tests
npm run test:e2e:open # Open Cypress GUI
```

## 🚀 Deployment

### Production Build
```bash
npm run build         # Build both backend and frontend
npm run build:backend # Build backend only
npm run build:frontend # Build frontend only
```

### Environment Configuration
Ensure the following environment variables are set for production:
- `NODE_ENV=production`
- Database connection settings
- JWT secrets
- SMTP configuration for emails
- File upload configurations

## 📋 Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for both backend and frontend
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

### Database Migrations
```bash
# Create new migration
npx sequelize-cli migration:generate --name migration-name

# Run migrations
npm run migrate

# Undo last migration
npm run migrate:undo
```

### Adding New Features
1. Create database migrations if needed
2. Add/update models and services
3. Implement API endpoints with validation
4. Add comprehensive tests
5. Update frontend state management
6. Implement UI components
7. Add integration tests

## 🔒 Security Considerations

- **Authentication**: JWT tokens with secure refresh mechanism
- **Password Security**: Bcrypt hashing with salt rounds
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting implemented
- **CORS**: Configured for production domains
- **Headers**: Security headers with Helmet.js

## 📊 Performance

- **Database**: Optimized queries with proper indexing
- **Caching**: Redis caching for frequently accessed data
- **Compression**: Gzip compression enabled
- **CDN**: Static asset delivery via CDN
- **Monitoring**: Application performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

Built with ❤️ by the StratCap Development Team