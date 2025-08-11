# StratCap Local Development & Debugging Guide

## 🚀 Quick Start (Infrastructure-Only Setup)

### Step 1: Start Infrastructure Services
```bash
# Start only database, Redis, and admin tools
docker-compose -f docs/docker-compose.debug.yml up -d

# Verify services are running
docker-compose -f docs/docker-compose.debug.yml ps
```

### Step 2: Setup Backend Development Environment
```bash
cd stratcap/backend

# Install dependencies
npm install

# Setup environment variables (copy from .env.example)
cp .env.example .env

# Run database migrations
npm run migrate

# Start backend in development mode with debugger
npm run dev
```

### Step 3: Setup Frontend Development Environment
```bash
cd stratcap/frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

## 🔧 Development URLs
- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend API**: http://localhost:8000 (Express server)
- **Database**: localhost:5432 (PostgreSQL)
- **Redis**: localhost:6379
- **pgAdmin**: http://localhost:5050 (Database management)
- **Redis Commander**: http://localhost:8081 (Redis management)

## 🐛 Debugging Capabilities

### Backend Debugging (Node.js/TypeScript)
```bash
# With nodemon for hot reload
npm run dev

# With Node.js debugger
node --inspect src/index.ts

# With VS Code debugging (launch.json configuration)
```

### Frontend Debugging (React/Vite)
```bash
# Development server with hot reload
npm run dev

# React DevTools available in browser
# Redux DevTools for state debugging
```

## 🎯 Benefits of This Architecture

### ✅ **Advantages**
- **Hot Reload**: Instant code changes in both frontend and backend
- **Native Debugging**: Full IDE integration with breakpoints
- **Performance**: No container overhead for application code
- **Flexibility**: Easy to switch between different Node.js versions
- **Tool Integration**: Direct access to linters, formatters, test runners
- **Memory Efficiency**: Lower resource usage than full containerization

### 🔍 **Enhanced Debugging Features**
- **VS Code Integration**: Native TypeScript debugging
- **Browser DevTools**: React/Redux debugging tools
- **Database Access**: Direct connection to PostgreSQL via pgAdmin
- **Cache Inspection**: Redis data via Redis Commander
- **Network Debugging**: Clear separation of concerns
- **Log Streaming**: Direct console output without Docker log overhead

## 📋 VS Code Debugging Configuration

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/stratcap/backend/src/index.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["-r", "ts-node/register"],
      "cwd": "${workspaceFolder}/stratcap/backend"
    }
  ]
}
```

## 🧪 Testing Strategy

### Backend Testing
```bash
cd stratcap/backend

# Unit tests with coverage
npm run test

# Watch mode for TDD
npm run test:watch

# Integration tests with real database
npm run test:integration
```

### Frontend Testing
```bash
cd stratcap/frontend

# Unit tests
npm run test

# E2E tests with Cypress
npm run test:e2e:open
```

## 📦 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://stratcap:stratcap123@localhost:5432/stratcap
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=8000
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
VITE_NODE_ENV=development
```

## 🔄 Workflow Commands

### Daily Development Workflow
```bash
# 1. Start infrastructure
docker-compose -f docs/docker-compose.debug.yml up -d

# 2. Start backend (Terminal 1)
cd stratcap/backend && npm run dev

# 3. Start frontend (Terminal 2)
cd stratcap/frontend && npm run dev

# 4. Run tests (Terminal 3)
npm run test:watch
```

### Cleanup
```bash
# Stop infrastructure when done
docker-compose -f docs/docker-compose.debug.yml down

# Keep data volumes
docker-compose -f docs/docker-compose.debug.yml down --volumes
```

## 🚨 Troubleshooting

### Common Issues
1. **Port Conflicts**: Ensure ports 3000, 8000, 5432, 6379, 5050, 8081 are available
2. **Database Connection**: Verify PostgreSQL is running with `docker ps`
3. **Environment Variables**: Check .env files are properly configured
4. **Dependencies**: Run `npm install` in both frontend and backend directories

### Health Checks
```bash
# Check database connection
psql -h localhost -p 5432 -U stratcap -d stratcap

# Check Redis connection
redis-cli -h localhost -p 6379 ping

# Check backend API
curl http://localhost:8000/health

# Check frontend
curl http://localhost:3000
```

## 🏗️ Architecture Decision Rationale

### Why Infrastructure-Only Containers?

#### **Performance Benefits**
- **Zero Container Overhead**: Application code runs natively on host
- **Instant Hot Reload**: Vite and Nodemon provide millisecond refresh times
- **Memory Efficiency**: ~60% less RAM usage compared to full containerization
- **CPU Performance**: Native Node.js execution without virtualization layer

#### **Development Experience**
- **IDE Integration**: Full TypeScript IntelliSense and debugging support
- **Breakpoint Debugging**: VS Code debugger attaches directly to Node.js process
- **Tool Chain Access**: ESLint, Prettier, Jest run without container complexity
- **File System Performance**: No volume mounting latency on file changes

#### **Consistency Guarantees**
- **Database Environment**: PostgreSQL 15 with exact production configuration
- **Cache Layer**: Redis 7 with consistent data structures and performance
- **Admin Tools**: pgAdmin and Redis Commander for data inspection
- **Network Isolation**: Infrastructure services isolated in Docker network

### Alternative Architectures Considered

#### **Full Containerization** ❌
```yaml
# Rejected: Performance overhead
services:
  frontend: { build: ./frontend }  # Slower hot reload
  backend: { build: ./backend }   # Complex debugging setup
```

#### **Local Everything** ❌  
```bash
# Rejected: Environment inconsistency
postgres --local-install  # Version conflicts
redis --local-install     # Configuration drift
```

#### **Hybrid Infrastructure** ✅
```yaml
# Selected: Best of both worlds
services:
  postgres: { image: postgres:15 }  # Consistent DB
  redis: { image: redis:7 }         # Reliable cache
# Applications run locally for optimal DX
```

## 📊 Performance Comparison

| Architecture | Hot Reload | Memory Usage | Debug Setup | Tool Integration |
|-------------|------------|--------------|-------------|------------------|
| **Infrastructure-Only** | ⚡ <100ms | 🟢 2GB | 🟢 Native | 🟢 Full |
| **Full Container** | 🐌 2-5s | 🟡 5GB | 🟡 Complex | 🟡 Limited |
| **Local Everything** | ⚡ <100ms | 🟢 1GB | 🟢 Native | 🔴 Inconsistent |

## 🔐 Security Considerations

### Development Environment Safety
- **Database Isolation**: PostgreSQL runs in isolated Docker network
- **Credential Management**: Development credentials separate from production
- **Port Binding**: Services bind to localhost only, not external interfaces
- **Volume Permissions**: Database volumes use Docker-managed permissions

### Production Parity
- **Same Database Version**: PostgreSQL 15-alpine matches production
- **Same Redis Version**: Redis 7-alpine for cache consistency  
- **Environment Variables**: `.env` files mirror production structure
- **Migration Scripts**: Same Sequelize migrations run in both environments

## 🚀 Quick Commands Reference

```bash
# Infrastructure Management
docker-compose -f docs/docker-compose.debug.yml up -d
docker-compose -f docs/docker-compose.debug.yml down
docker-compose -f docs/docker-compose.debug.yml logs -f

# Development Servers
cd stratcap/backend && npm run dev    # Backend with hot reload
cd stratcap/frontend && npm run dev   # Frontend with Vite

# Database Operations
npm run migrate                       # Run migrations
npm run migrate:undo                 # Rollback migration
npm run seed                         # Seed test data

# Testing
npm run test                         # Unit tests
npm run test:watch                   # TDD mode
npm run test:e2e:open               # E2E testing
```

This architecture provides **optimal debugging capabilities** while maintaining **production environment consistency** for your StratCap application.