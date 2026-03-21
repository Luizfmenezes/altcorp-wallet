#!/usr/bin/env python3
"""
Small utility to reset a user's password using the project's DB settings and hashing.

Usage (recommend run inside project's virtualenv):
  python backend/scripts/reset_admin_password.py --username admin

The script prompts for the new password (no echo). It updates the DB using SQLAlchemy
and the project's `get_password_hash` function so the hashing config stays consistent.

Security: this script never prints the password and only stores the hashed value in DB.
"""
import argparse
import getpass
import sys

from app.core.security import get_password_hash
from app.database.session import SessionLocal
from app.database.models import User


def reset_password(username: str = None, user_id: int = None):
    if not username and not user_id:
        raise ValueError("Provide either username or user_id")

    new_password = getpass.getpass(prompt="Nova senha (não será mostrada): ")
    confirm = getpass.getpass(prompt="Confirme a nova senha: ")
    if new_password != confirm:
        print("As senhas não coincidem. Abortando.")
        return 1

    if len(new_password) < 8:
        print("Aviso: a senha tem menos de 8 caracteres — use uma senha mais forte.")

    hashed = get_password_hash(new_password)

    db = SessionLocal()
    try:
        if username:
            user = db.query(User).filter(User.username == username.strip().lower()).first()
        else:
            user = db.query(User).filter(User.id == user_id).first()

        if not user:
            print("Usuário não encontrado.")
            return 2

        user.hashed_password = hashed
        db.add(user)
        db.commit()
        print(f"Senha atualizada para o usuário '{user.username}' (id={user.id}).")
        return 0
    except Exception as e:
        print("Erro ao atualizar a senha:", e)
        db.rollback()
        return 3
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Reset admin/user password safely")
    parser.add_argument("--username", help="Username to update (case-insensitive)")
    parser.add_argument("--id", type=int, dest="user_id", help="User id to update")
    args = parser.parse_args()

    rc = reset_password(username=args.username, user_id=args.user_id)
    sys.exit(rc)


if __name__ == "__main__":
    main()
