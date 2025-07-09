"""
Logger configuration for the application
"""

import logging
import sys
from typing import Any

from src.config.settings import settings


class CustomFormatter(logging.Formatter):
    """
    Custom formatter for structured logging
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record with additional context
        """
        # Add custom fields if available
        if hasattr(record, "request_id"):
            record.msg = f"[{record.request_id}] {record.msg}"
        
        return super().format(record)


def setup_logger(name: str = "stratcap") -> logging.Logger:
    """
    Setup logger with custom configuration
    """
    logger = logging.getLogger(name)
    
    # Set log level from settings
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logger.setLevel(log_level)
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    
    # Format based on environment
    if settings.ENVIRONMENT == "production":
        # JSON format for production (easier to parse)
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
            '"logger": "%(name)s", "message": "%(message)s"}'
        )
    else:
        # Human-readable format for development
        formatter = CustomFormatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Prevent propagation to avoid duplicate logs
    logger.propagate = False
    
    return logger


# Create global logger instance
logger = setup_logger()


def log_info(message: str, **kwargs: Any) -> None:
    """
    Log info message with extra context
    """
    logger.info(message, extra=kwargs)


def log_error(message: str, **kwargs: Any) -> None:
    """
    Log error message with extra context
    """
    logger.error(message, extra=kwargs, exc_info=True)


def log_warning(message: str, **kwargs: Any) -> None:
    """
    Log warning message with extra context
    """
    logger.warning(message, extra=kwargs)


def log_debug(message: str, **kwargs: Any) -> None:
    """
    Log debug message with extra context
    """
    logger.debug(message, extra=kwargs)