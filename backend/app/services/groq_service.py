"""
Serviço de IA usando Groq Cloud API (100% gratuito).
- Whisper Large v3 Turbo para transcrição de áudio
- LLaMA 3.3 70B Versatile para extração de dados financeiros

Tier gratuito Groq: ~14.400 req/dia LLMs, Whisper ilimitado.
Docs: https://console.groq.com/docs/api-reference
"""
import json
import logging
import re
from io import BytesIO

import httpx
from pypdf import PdfReader
from app.core.config import settings

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1"

# Modelos gratuitos do Groq (atualizar se necessário)
WHISPER_MODEL = "whisper-large-v3-turbo"
LLM_MODEL = "llama-3.3-70b-versatile"

EXTRACTION_PROMPT = """Você é um assistente financeiro. Analise a transcrição abaixo e extraia os dados do gasto.

Retorne APENAS um JSON válido (sem markdown, sem texto extra) com esta estrutura exata:
{
  "transcricao": "texto original da transcrição",
  "valor": 0.00,
  "categoria": "Alimentacao|Transporte|Moradia|Lazer|Saude|Educacao|Compras|Servicos|Outros",
  "descricao": "descrição curta do gasto",
  "metodo_pagamento": "avulso|cartao",
  "nome_cartao": "nome do cartão se mencionado, senão vazio"
}

Regras:
- "valor" deve ser numérico (float). Se o usuário disser "vinte reais", valor = 20.00
- "categoria" deve ser exatamente uma das opções listadas (sem acento)
- "metodo_pagamento" deve ser "cartao" se o usuário mencionar cartão/crédito/débito, senão "avulso"
- "nome_cartao" = nome do cartão mencionado (Nubank, Inter, C6, etc.), vazio se não mencionou
- "descricao" = resumo curto e claro do gasto

Transcrição: {transcription}"""

INVOICE_IMPORT_PROMPT = """Você é um assistente financeiro especializado em faturas de cartão.

Analise o texto abaixo e retorne APENAS um JSON válido, sem markdown, no formato:
{
    "items": [
        {
            "date": "YYYY-MM-DD",
            "description": "descrição limpa do lançamento",
            "category": "Alimentacao|Transporte|Moradia|Lazer|Saude|Educacao|Compras|Servicos|Outros",
            "amount": 0.0,
            "owner": "nome da pessoa responsável",
            "notes": "observação opcional"
        }
    ]
}

Regras obrigatórias:
- Extraia apenas cobranças/despesas reais da fatura.
- Ignore pagamentos recebidos, créditos, estornos, saldo anterior, limite, juros resumidos e textos explicativos.
- Se aparecer parcela (ex.: Parcela 3/4), preserve isso na descrição.
- amount deve ser sempre positivo.
- category deve ser uma das opções listadas, sem acento.
- owner deve ser uma das pessoas conhecidas: {people}. Se não houver indicação explícita, use {default_owner}.
- Se a data vier sem ano, use o ano de referência {reference_year}.
- Se a data vier sem mês/ano e não houver outra pista, use o mês {reference_month} e ano {reference_year}.
- Não invente lançamentos que não existam no texto.
- Normalize datas para YYYY-MM-DD.

Nome do cartão: __CARD_NAME__

Texto da fatura/transcrição:
__CONTENT__
"""


def _build_invoice_import_prompt(
    content: str,
    people: list[str],
    default_owner: str,
    card_name: str,
    reference_month: int | None,
    reference_year: int | None,
) -> str:
    """Monta o prompt sem usar str.format para preservar as chaves do exemplo JSON."""
    return (
        INVOICE_IMPORT_PROMPT
        .replace("{people}", ", ".join(people) if people else "Eu")
        .replace("{default_owner}", default_owner)
        .replace("{reference_month}", str(reference_month) if reference_month is not None else "atual")
        .replace("{reference_year}", str(reference_year) if reference_year is not None else "atual")
        .replace("__CARD_NAME__", card_name or "não informado")
        .replace("__CONTENT__", content)
    )


def _get_headers() -> dict:
    """Retorna headers de autenticação para a Groq API."""
    if not settings.GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY não configurada. "
            "Obtenha sua chave gratuita em: https://console.groq.com/keys"
        )
    return {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}


def _clean_json_response(content: str) -> str:
    """Remove blocos markdown e espaços extras de respostas LLM."""
    content = content.strip()
    # Remove ```json ... ``` ou ``` ... ```
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*\n?", "", content)
        content = re.sub(r"\n?```\s*$", "", content)
    return content.strip()


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Transcreve áudio usando Groq Whisper (gratuito, sem limites)."""
    headers = _get_headers()

    # Detecta content-type pelo filename
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webm"
    content_types = {
        "webm": "audio/webm", "mp3": "audio/mpeg", "wav": "audio/wav",
        "m4a": "audio/mp4", "ogg": "audio/ogg", "flac": "audio/flac",
    }
    content_type = content_types.get(ext, "audio/webm")

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{GROQ_API_URL}/audio/transcriptions",
            headers=headers,
            data={
                "model": WHISPER_MODEL,
                "language": "pt",
                "response_format": "text",
            },
            files={"file": (filename, audio_bytes, content_type)},
        )

        if response.status_code == 429:
            logger.warning("[Groq] Rate limit atingido na transcrição")
            raise ValueError("Limite de requisições atingido. Tente novamente em alguns segundos.")

        response.raise_for_status()
        return response.text.strip()


async def extract_expense_data(transcription: str) -> dict:
    """Extrai dados financeiros do texto usando LLaMA 3.3 70B (gratuito)."""
    headers = {**_get_headers(), "Content-Type": "application/json"}
    prompt = EXTRACTION_PROMPT.replace("{transcription}", transcription)

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{GROQ_API_URL}/chat/completions",
            headers=headers,
            json={
                "model": LLM_MODEL,
                "messages": [
                    {"role": "system", "content": "Você responde APENAS em JSON válido, sem markdown."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.1,
                "max_tokens": 300,
                "response_format": {"type": "json_object"},
            },
        )

        if response.status_code == 429:
            logger.warning("[Groq] Rate limit atingido na extração LLM")
            raise ValueError("Limite de requisições atingido. Tente novamente em alguns segundos.")

        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        content = _clean_json_response(content)

        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"[Groq] Falha ao parsear JSON: {content}")
            raise ValueError(f"Resposta da IA não é um JSON válido: {e}")


async def process_audio(audio_bytes: bytes, filename: str = "audio.webm") -> dict:
    """Pipeline completo: transcrição → extração de dados financeiros via Groq (gratuito)."""
    logger.info(f"[Groq] Iniciando transcrição ({len(audio_bytes)} bytes)...")
    transcription = await transcribe_audio(audio_bytes, filename)
    logger.info(f"[Groq] Transcrição: {transcription}")

    logger.info("[Groq] Extraindo dados financeiros...")
    expense_data = await extract_expense_data(transcription)
    expense_data["transcricao"] = transcription
    logger.info(f"[Groq] Dados extraídos: {expense_data}")

    return expense_data


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extrai texto de um PDF usando PyPDF."""
    reader = PdfReader(BytesIO(pdf_bytes))
    texts: list[str] = []
    for page in reader.pages:
        text = page.extract_text(extraction_mode="layout") or page.extract_text() or ""
        if text.strip():
            texts.append(text)
    return "\n\n".join(texts).strip()


async def extract_invoice_items(content: str, people: list[str] | None = None, card_name: str = "", reference_month: int | None = None, reference_year: int | None = None) -> dict:
    """Extrai lançamentos de fatura a partir de texto usando Groq."""
    normalized_people = [person.strip() for person in (people or []) if person and person.strip()]
    default_owner = normalized_people[0] if normalized_people else "Eu"
    prompt = _build_invoice_import_prompt(
        content=content,
        people=normalized_people,
        default_owner=default_owner,
        card_name=card_name,
        reference_month=reference_month,
        reference_year=reference_year,
    )

    headers = {**_get_headers(), "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{GROQ_API_URL}/chat/completions",
            headers=headers,
            json={
                "model": LLM_MODEL,
                "messages": [
                    {"role": "system", "content": "Você responde APENAS em JSON válido, sem markdown."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.1,
                "max_tokens": 2000,
                "response_format": {"type": "json_object"},
            },
        )

        if response.status_code == 429:
            logger.warning("[Groq] Rate limit atingido na extração de fatura")
            raise ValueError("Limite de requisições da IA atingido. Tente novamente em alguns segundos.")

        response.raise_for_status()
        data = response.json()
        content_response = _clean_json_response(data["choices"][0]["message"]["content"])
        parsed = json.loads(content_response)
        parsed_items = parsed.get("items", [])

        cleaned_items = []
        for item in parsed_items:
            amount = float(item.get("amount") or 0)
            if amount <= 0:
                continue
            cleaned_items.append({
                "date": item.get("date", ""),
                "description": (item.get("description") or "").strip(),
                "category": item.get("category", "Outros"),
                "amount": round(amount, 2),
                "owner": item.get("owner") or default_owner,
                "notes": item.get("notes") or None,
            })

        return {"raw_text": content, "items": cleaned_items}
