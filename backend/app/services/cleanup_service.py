"""
Serviço de limpeza automática de contas não verificadas.

Regras:
- Após 30 minutos sem verificar email → conta marcada como inativa (is_active=False)
- Após 40 minutos sem verificar email → conta deletada permanentemente
"""

import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.database.models import User

logger = logging.getLogger(__name__)

DEACTIVATE_AFTER_MINUTES = 30
DELETE_AFTER_MINUTES = 40
CHECK_INTERVAL_SECONDS = 60 * 5  # roda a cada 5 minutos


def run_cleanup(db: Session) -> dict:
    """
    Executa a limpeza de contas não verificadas.
    Retorna um resumo do que foi feito.
    """
    now = datetime.utcnow()
    deactivate_threshold = now - timedelta(minutes=DEACTIVATE_AFTER_MINUTES)
    delete_threshold = now - timedelta(minutes=DELETE_AFTER_MINUTES)

    # --- 1. Deletar contas não verificadas com mais de 40 min ---
    to_delete = db.query(User).filter(
        User.email_verified == False,
        User.google_id == None,          # nunca deletar contas Google
        User.created_at <= delete_threshold,
    ).all()

    deleted_count = 0
    for user in to_delete:
        logger.info(
            f"[Cleanup] Deletando conta não verificada: {user.username} "
            f"({user.email}) criada em {user.created_at}"
        )
        db.delete(user)
        deleted_count += 1

    if deleted_count:
        db.commit()

    # --- 2. Desativar contas não verificadas entre 30-40 min ---
    to_deactivate = db.query(User).filter(
        User.email_verified == False,
        User.is_active == True,
        User.google_id == None,
        User.created_at <= deactivate_threshold,
        User.created_at > delete_threshold,   # ainda não na faixa de deleção
    ).all()

    deactivated_count = 0
    for user in to_deactivate:
        logger.info(
            f"[Cleanup] Desativando conta não verificada: {user.username} "
            f"({user.email}) criada em {user.created_at}"
        )
        user.is_active = False
        deactivated_count += 1

    if deactivated_count:
        db.commit()

    return {
        "deleted": deleted_count,
        "deactivated": deactivated_count,
        "checked_at": now.isoformat(),
    }


async def cleanup_loop():
    """Loop assíncrono que roda a limpeza a cada CHECK_INTERVAL_SECONDS."""
    logger.info(
        f"[Cleanup] Scheduler iniciado — "
        f"desativa em {DEACTIVATE_AFTER_MINUTES}min, "
        f"deleta em {DELETE_AFTER_MINUTES}min, "
        f"intervalo: {CHECK_INTERVAL_SECONDS}s"
    )

    # Aguarda 10 segundos antes da primeira execução (deixa o app subir)
    await asyncio.sleep(10)

    while True:
        try:
            db: Session = SessionLocal()
            try:
                result = run_cleanup(db)
                if result["deleted"] or result["deactivated"]:
                    logger.info(
                        f"[Cleanup] Resultado: "
                        f"{result['deleted']} deletadas, "
                        f"{result['deactivated']} desativadas"
                    )
            finally:
                db.close()
        except Exception as e:
            logger.error(f"[Cleanup] Erro ao executar limpeza: {e}")

        await asyncio.sleep(CHECK_INTERVAL_SECONDS)
