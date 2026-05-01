import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./tinylink.db")

# SQLite fallback for local dev (swap asyncpg → aiosqlite)
# Railway sometimes sends "postgres://" instead of "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Safe column migrations (add only if missing)
        is_pg = "postgresql" in str(DATABASE_URL)
        if is_pg:
            migrations = [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_secret VARCHAR(64)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT FALSE",
            ]
        else:
            # SQLite doesn't support IF NOT EXISTS in ALTER TABLE; use try/except
            migrations = [
                "ALTER TABLE users ADD COLUMN two_fa_secret VARCHAR(64)",
                "ALTER TABLE users ADD COLUMN two_fa_enabled BOOLEAN DEFAULT 0",
            ]
        for sql in migrations:
            try:
                await conn.execute(__import__('sqlalchemy').text(sql))
            except Exception:
                pass  # Column already exists
