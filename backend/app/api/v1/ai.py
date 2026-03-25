from typing import Annotated

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.core.dependencies import get_current_user
from app.database.models import User
from app.services.groq_service import process_audio
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/process-audio",
    responses={
        400: {"description": "Arquivo de áudio inválido"},
        500: {"description": "Erro interno ao processar áudio"},
    },
)
async def process_audio_endpoint(
    file: Annotated[UploadFile, File(...)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Recebe áudio, transcreve com Whisper e extrai dados com LLaMA via Groq."""
    try:
        audio_bytes = await file.read()
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Arquivo de áudio vazio")
        if len(audio_bytes) > 25 * 1024 * 1024:  # 25MB limit
            raise HTTPException(status_code=400, detail="Arquivo muito grande (máx 25MB)")

        result = await process_audio(audio_bytes, file.filename or "audio.webm")
        return result

    except ValueError as e:
        logger.error(f"Config error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar áudio: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar áudio: {str(e)}")
