from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.routers import auth, products, stock, financial, contacts, reports, payments
from app.routers import categories, financial_categories, deposits, accounts, payment_types, units, recurrence_frequencies
from app.routers import requisicoes, roles
from app.routers.sales import sale_type_router, sale_router

import traceback
import os
from datetime import datetime

Base.metadata.create_all(bind=engine)

from app.config import DATABASE_URL

# Migrações SQLite (só executa se for SQLite)
if DATABASE_URL.startswith("sqlite"):
    import sqlite3
    db_path = DATABASE_URL.replace("sqlite:///", "")
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("PRAGMA table_info(stock_movements)")
        cols = [row[1] for row in c.fetchall()]
        if "movement_date" not in cols:
            c.execute("ALTER TABLE stock_movements ADD COLUMN movement_date DATETIME DEFAULT CURRENT_TIMESTAMP")
            conn.commit()
        c.execute("PRAGMA table_info(products)")
        product_cols = {row[1]: row for row in c.fetchall()}
        if product_cols.get("name") and product_cols["name"][3]:
            c.execute("CREATE TABLE IF NOT EXISTS products_new (id INTEGER PRIMARY KEY, name TEXT, description TEXT, sku TEXT UNIQUE, barcode TEXT, price REAL, cost_price REAL, current_stock INTEGER DEFAULT 0, min_stock INTEGER DEFAULT 0, unit_id INTEGER REFERENCES units(id), category_id INTEGER REFERENCES categories(id), deposit_id INTEGER REFERENCES deposits(id), is_active BOOLEAN DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME)")
            c.execute("INSERT INTO products_new SELECT * FROM products")
            c.execute("DROP TABLE products")
            c.execute("ALTER TABLE products_new RENAME TO products")
            c.execute("CREATE INDEX IF NOT EXISTS ix_products_sku ON products(sku)")
            conn.commit()
        c.execute("PRAGMA table_info(accounts)")
        acc_cols = [row[1] for row in c.fetchall()]
        for col, typedef in [("flag", "TEXT"), ("closing_day", "INTEGER"), ("due_day", "INTEGER"), ("best_purchase_day", "INTEGER"), ("credit_limit", "REAL")]:
            if col not in acc_cols:
                c.execute("ALTER TABLE accounts ADD COLUMN " + col + " " + typedef)
        conn.commit()
        c.execute("PRAGMA table_info(transactions)")
        tx_cols = [row[1] for row in c.fetchall()]
        if "recurrence_frequency" not in tx_cols:
            c.execute("ALTER TABLE transactions ADD COLUMN recurrence_frequency TEXT")
            if "is_recurring" in tx_cols:
                c.execute("UPDATE transactions SET recurrence_frequency = 'mensal' WHERE is_recurring = 1")
        if "due_date" not in tx_cols:
            c.execute("ALTER TABLE transactions ADD COLUMN due_date DATETIME")
        if "status" not in tx_cols:
            c.execute("ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'pendente'")
        conn.commit()
        conn.close()

from seed import seed, seed_frequencies
seed()
seed_frequencies()

app = FastAPI(title="Sistema de Gestão", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(stock.router)
app.include_router(financial_categories.router)
app.include_router(financial.router)
app.include_router(contacts.router)
app.include_router(deposits.router)
app.include_router(accounts.router)
app.include_router(payment_types.router)
app.include_router(units.router)
app.include_router(reports.router)
app.include_router(recurrence_frequencies.router)
app.include_router(payments.router)
app.include_router(sale_type_router)
app.include_router(sale_router)
app.include_router(requisicoes.router)
app.include_router(roles.router)

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {"message": "API do Sistema de Gestão - Estoque, Vendas e Financeiro"}
