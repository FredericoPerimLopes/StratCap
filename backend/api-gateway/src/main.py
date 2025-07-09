"""
StratCap API Gateway
Main entry point for the API Gateway service
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from src.config.settings import settings
from src.middleware.auth import AuthMiddleware
from src.middleware.rate_limit import RateLimitMiddleware
from src.middleware.logging import LoggingMiddleware
from src.routes import health, auth, funds, investors, calculations, reports, workflows
from src.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    """
    # Startup
    logger.info("Starting StratCap API Gateway")
    
    # Initialize database connections
    # await init_database()
    
    # Initialize Redis connections
    # await init_redis()
    
    # Initialize message queue connections
    # await init_kafka()
    
    yield
    
    # Shutdown
    logger.info("Shutting down StratCap API Gateway")
    
    # Close database connections
    # await close_database()
    
    # Close Redis connections
    # await close_redis()
    
    # Close message queue connections
    # await close_kafka()


# Create FastAPI application
app = FastAPI(
    title="StratCap API Gateway",
    description="API Gateway for StratCap Fund Management Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Trusted Host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Add custom middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthMiddleware)

# Setup Prometheus metrics
instrumentator = Instrumentator()
instrumentator.instrument(app).expose(app, endpoint="/metrics")

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(funds.router, prefix="/api/funds", tags=["funds"])
app.include_router(investors.router, prefix="/api/investors", tags=["investors"])
app.include_router(calculations.router, prefix="/api/calculations", tags=["calculations"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(workflows.router, prefix="/api/workflows", tags=["workflows"])


@app.get("/", tags=["root"])
async def root():
    """
    Root endpoint
    """
    return {
        "message": "Welcome to StratCap API Gateway",
        "version": "1.0.0",
        "docs": "/api/docs"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )