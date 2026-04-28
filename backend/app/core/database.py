from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_db():
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db_instance.db = db_instance.client[settings.MONGODB_DB]
    # Create indexes
    await db_instance.db.users.create_index("email", unique=True)
    await db_instance.db.sessions.create_index("user_id")
    await db_instance.db.sessions.create_index("status")
    print(f"✅ Connected to MongoDB: {settings.MONGODB_DB}")

async def close_db():
    if db_instance.client:
        db_instance.client.close()
        print("MongoDB connection closed")

def get_db():
    return db_instance.db
