from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://walletuser:walletpass123@database:5432/altcorp_wallet"
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost,http://localhost:80,http://localhost:3000,http://localhost:8080"
    
    # Domain
    DOMAIN: str = "localhost"
    
    # Resend (Email service)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "AltCorp Wallet <noreply@altcorp.com.br>"
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    
    def get_allowed_origins(self) -> List[str]:
        """Parse ALLOWED_ORIGINS string into list"""
        if not self.ALLOWED_ORIGINS:
            return []
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # <--- ESSA LINHA SALVA O SISTEMA

settings = Settings()
