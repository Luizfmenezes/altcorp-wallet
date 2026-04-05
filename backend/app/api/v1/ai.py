import json
import logging
from typing import Annotated

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from app.core.dependencies import get_current_user
from app.database.models import User
from app.schemas.schemas import InvoiceImportResponse, InvoiceImportTextRequest
from app.services.groq_service import process_audio, extract_invoice_items, extract_text_from_pdf

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


@router.post(
    "/process-invoice-text",
    response_model=InvoiceImportResponse,
    responses={
        400: {"description": "Texto ou parâmetros da fatura inválidos"},
        500: {"description": "Erro interno ao processar texto da fatura"},
    },
)
async def process_invoice_text_endpoint(
    payload: InvoiceImportTextRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Processa texto livre de fatura e retorna lançamentos estruturados via Groq."""
    try:
        if not payload.content.strip():
            raise HTTPException(status_code=400, detail="Texto da fatura vazio")

        result = await extract_invoice_items(
            content=payload.content,
            people=payload.people,
            card_name=payload.card_name or "",
            reference_month=payload.reference_month,
            reference_year=payload.reference_year,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar texto da fatura: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar texto da fatura")


@router.post(
    "/process-invoice-document",
    response_model=InvoiceImportResponse,
    responses={
        400: {"description": "Arquivo ou parâmetros inválidos"},
        422: {"description": "Texto insuficiente extraído do PDF"},
        500: {"description": "Erro interno ao processar documento da fatura"},
    },
)
async def process_invoice_document_endpoint(
    file: Annotated[UploadFile, File(...)],
    people_json: Annotated[str, Form()] = "[]",
    card_name: Annotated[str, Form()] = "",
    reference_month: Annotated[int | None, Form()] = None,
    reference_year: Annotated[int | None, Form()] = None,
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Processa PDF/TXT de fatura e retorna lançamentos estruturados via Groq."""
    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Arquivo vazio")

        people = json.loads(people_json) if people_json else []
        filename = (file.filename or "").lower()
        if filename.endswith(".pdf"):
            raw_text = extract_text_from_pdf(file_bytes)
            if len(raw_text.strip()) < 20:
                raise HTTPException(status_code=422, detail="Não foi possível extrair texto suficiente do PDF. Verifique se o arquivo não é somente imagem.")
        elif filename.endswith(".txt"):
            raw_text = file_bytes.decode("utf-8", errors="ignore").strip()
        else:
            raise HTTPException(status_code=400, detail="Formato não suportado. Use PDF ou TXT.")

        result = await extract_invoice_items(
            content=raw_text,
            people=people,
            card_name=card_name,
            reference_month=reference_month,
            reference_year=reference_year,
        )
        return result
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Lista de pessoas inválida")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar documento da fatura: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar documento da fatura")
