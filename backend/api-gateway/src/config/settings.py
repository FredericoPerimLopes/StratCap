"""
Application settings and configuration
"""

from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, validator


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    """
    
    # Application settings
    APP_NAME: str = "StratCap API Gateway"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    PORT: int = Field(default=8000, env="PORT")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Security settings
    JWT_SECRET: str = Field(..., env="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_EXPIRATION_MINUTES: int = Field(default=60, env="JWT_EXPIRATION_MINUTES")
    JWT_REFRESH_EXPIRATION_DAYS: int = Field(default=30, env="JWT_REFRESH_EXPIRATION_DAYS")
    
    # Database settings
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_POOL_SIZE: int = Field(default=5, env="DATABASE_POOL_SIZE")
    DATABASE_MAX_CONNECTIONS: int = Field(default=20, env="DATABASE_MAX_CONNECTIONS")
    
    # Redis settings
    REDIS_URL: str = Field(..., env="REDIS_URL")
    REDIS_POOL_SIZE: int = Field(default=10, env="REDIS_POOL_SIZE")
    
    # Kafka settings
    KAFKA_BOOTSTRAP_SERVERS: str = Field(default="kafka:9092", env="KAFKA_BOOTSTRAP_SERVERS")
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"],
        env="ALLOWED_ORIGINS"
    )
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1", "api-gateway", "testserver"],
        env="ALLOWED_HOSTS"
    )
    
    # Rate limiting settings
    RATE_LIMIT_DEFAULT: int = Field(default=100, env="RATE_LIMIT_DEFAULT")
    RATE_LIMIT_WINDOW: int = Field(default=60, env="RATE_LIMIT_WINDOW")
    
    # Service URLs
    USER_MANAGEMENT_URL: str = Field(
        default="http://user-management:8001",
        env="USER_MANAGEMENT_URL"
    )
    FUND_MANAGEMENT_URL: str = Field(
        default="http://fund-management:8002",
        env="FUND_MANAGEMENT_URL"
    )
    DATA_INGESTION_URL: str = Field(
        default="http://data-ingestion:8003",
        env="DATA_INGESTION_URL"
    )
    CALCULATION_ENGINE_URL: str = Field(
        default="http://calculation-engine:8004",
        env="CALCULATION_ENGINE_URL"
    )
    WORKFLOW_ENGINE_URL: str = Field(
        default="http://workflow-engine:8005",
        env="WORKFLOW_ENGINE_URL"
    )
    REPORTING_SERVICE_URL: str = Field(
        default="http://reporting:8006",
        env="REPORTING_SERVICE_URL"
    )
    NOTIFICATION_SERVICE_URL: str = Field(
        default="http://notification:8007",
        env="NOTIFICATION_SERVICE_URL"
    )
    
    # External service settings
    AWS_REGION: str = Field(default="us-east-1", env="AWS_REGION")
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(default=None, env="AWS_SECRET_ACCESS_KEY")
    
    @validator("ALLOWED_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("ALLOWED_HOSTS", pre=True)
    def parse_allowed_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create global settings instance
settings = Settings()