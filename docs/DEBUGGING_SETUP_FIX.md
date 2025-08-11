# StratCap Backend Development Setup Fix

## 🚨 Nodemon Issue Resolution

### Problem
```bash
sh: 1: nodemon: not found
npm error Lifecycle script `dev` failed with error
```

### Solution Steps

#### 1. Clean and Reinstall Dependencies
```bash
cd stratcap/backend

# Clean everything
rm -rf node_modules package-lock.json

# Reinstall all dependencies (including devDependencies)
npm install

# Verify nodemon is installed
npx nodemon --version
```

#### 2. Alternative Development Commands

If nodemon issues persist, use these alternatives:

```bash
# Option A: Direct ts-node execution with watch
npx ts-node --watch src/index.ts

# Option B: Use nodemon via npx
npx nodemon

# Option C: Manual TypeScript compilation + node
npm run build && node dist/index.js
```

#### 3. Enhanced Package.json Scripts

Update the backend package.json dev scripts for better reliability:

```json
{
  "scripts": {
    "dev": "nodemon",
    "dev:alt": "ts-node --watch src/index.ts",
    "dev:debug": "nodemon --inspect",
    "dev:build": "tsc --watch",
    "start:dev": "ts-node src/index.ts"
  }
}
```

#### 4. Complete Development Workflow

```bash
# 1. Start infrastructure
docker-compose -f docs/docker-compose.debug.yml up -d

# 2. Setup backend (choose one)
cd stratcap/backend

# Clean install approach
rm -rf node_modules && npm install

# Alternative: Use specific Node version
nvm use 18 && npm install

# 3. Start backend (try in order)
npm run dev                    # Primary method
npx nodemon                   # If npm script fails  
npm run dev:alt               # Alternative with ts-node
npm run start:dev             # Direct ts-node execution

# 4. Start frontend (separate terminal)
cd stratcap/frontend
npm install
npm run dev
```

## 🔍 Troubleshooting Steps

### Check 1: Node.js Version
```bash
node --version  # Should be >= 18
npm --version   # Should be >= 8
```

### Check 2: Dependencies Installation
```bash
cd stratcap/backend
ls node_modules/.bin/nodemon  # Should exist
npx which nodemon             # Should show path
```

### Check 3: Environment Setup
```bash
# Copy environment file
cp .env.example .env

# Verify database connection
echo "DATABASE_URL=postgresql://stratcap:stratcap123@localhost:5432/stratcap" >> .env
```

### Check 4: Database Migration
```bash
# After infrastructure is running
npm run migrate
npm run seed
```

## ⚡ Quick Fix Commands

```bash
# Complete setup from scratch
cd stratcap/backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
cp .env.example .env
docker-compose -f ../../docs/docker-compose.debug.yml up -d
sleep 10
npm run migrate
npm run dev
```

## 🐛 Alternative Debugging Approaches

### Option 1: VS Code Integrated Terminal
```bash
# Use VS Code's integrated terminal
code stratcap/backend
# Press Ctrl+` to open terminal
npm run dev
```

### Option 2: Direct Node.js Debugging
```bash
# Start with Node.js debugging enabled
node --inspect -r ts-node/register src/index.ts
```

### Option 3: Docker-based Backend Development
```bash
# If local setup continues to fail, use containerized backend
docker-compose -f docker-compose.yml up backend postgres redis
# Frontend still runs locally for better development experience
```

## 📋 Development Environment Checklist

- [ ] Node.js 18+ installed
- [ ] NPM dependencies installed in backend
- [ ] Infrastructure containers running
- [ ] Environment variables configured  
- [ ] Database migrations executed
- [ ] Backend server starting successfully
- [ ] Frontend development server running
- [ ] Both services accessible via browser

## 🚀 Success Indicators

When everything works correctly, you should see:

```bash
# Backend terminal output
[nodemon] starting `ts-node ./src/index.ts`
Server running on port 8000
Database connected successfully
Redis connected successfully

# Frontend terminal output  
VITE v5.2.10  ready in 423 ms
➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

If nodemon issues persist, contact the development team or use the alternative startup methods provided above.