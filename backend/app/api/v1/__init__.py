from fastapi import APIRouter
from app.api.v1 import incomes, expenses, cards, budgets, auth, users, ai

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["authentication"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(incomes.router, prefix="/incomes", tags=["incomes"])
router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
router.include_router(cards.router, prefix="/cards", tags=["cards"])
router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
router.include_router(ai.router, prefix="/ai", tags=["ai"])
