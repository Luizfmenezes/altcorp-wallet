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
    
    # CORS - aceita IP local + domínio de produção
    ALLOWED_ORIGINS: str = "http://localhost,http://localhost:80,http://localhost:3000,http://localhost:8080,http://192.168.15.5:8080,https://wallet.altcorphub.com"
    
    # Domain
    DOMAIN: str = "localhost"
    
    # Resend (Email service)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "AltCorp Wallet <noreply@altcorp.com.br>"
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    
    # Groq AI (gratuito - transcrição Whisper + LLaMA 3.3 70B)
    # Obtenha em: https://console.groq.com/keys
    GROQ_API_KEY: str = ""
    
    def get_allowed_origins(self) -> List[str]:
        """Parse ALLOWED_ORIGINS string into list, sempre inclui IP e domínio."""
        if not self.ALLOWED_ORIGINS:
            return [
                "http://192.168.15.5:8080",
                "https://wallet.altcorphub.com",
            ]
        origins = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        # Garante que os essenciais estejam sempre presentes
        essentials = ["http://192.168.15.5:8080", "https://wallet.altcorphub.com"]
        for e in essentials:
            if e not in origins:
                origins.append(e)
        return origins
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
