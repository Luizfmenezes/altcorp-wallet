from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1 import router as api_router
from app.database.session import engine
from app.database import models
from app.services.cleanup_service import cleanup_loop
import asyncio
import logging
from sqlalchemy import text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
models.Base.metadata.create_all(bind=engine)


def ensure_runtime_schema_updates() -> None:
    """Aplica ajustes simples de schema necessários em bases já existentes."""
    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_identity_change_at TIMESTAMPTZ",
        "ALTER TABLE cards ADD COLUMN IF NOT EXISTS icon VARCHAR(50)",
        "ALTER TABLE cards ADD COLUMN IF NOT EXISTS credit_limit DOUBLE PRECISION",
        "ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS owner VARCHAR(100) NOT NULL DEFAULT 'Shared'",
        "ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE",
        "ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS installment_info JSONB",
    ]
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


ensure_runtime_schema_updates()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicia tarefas de background ao subir o servidor."""
    cleanup_task = asyncio.create_task(cleanup_loop())
    logger.info("[Lifespan] Cleanup scheduler iniciado.")
    yield
    cleanup_task.cancel()
    logger.info("[Lifespan] Cleanup scheduler encerrado.")


app = FastAPI(
    title="AltCorp Wallet API",
    description="API para gerenciamento de finanças pessoais",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Add validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"❌ Validation error for {request.url}: {exc.errors()}")
    try:
        body = exc.body if isinstance(exc.body, (dict, list, str, type(None))) else str(exc.body)
    except Exception:
        body = None
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": body}
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "AltCorp Wallet API",
        "version": "1.0.0",
        "status": "online"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
