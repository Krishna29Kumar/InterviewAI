"""
FILE: backend/app/services/scrapers/weekly_updater.py
=======================================================
Har hafte automatically naye questions scrape karo.

Setup karo (cron):
  crontab -e
  0 2 * * 0 cd /path/to/backend && source venv/bin/activate && python3 app/services/scrapers/weekly_updater.py >> /tmp/scraper.log 2>&1

Ya manually chalao:
  python3 weekly_updater.py
"""

import asyncio
import os
import json
from pathlib import Path
from datetime import datetime, timedelta
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import sys

ENV_PATH = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

sys.path.insert(0, os.path.dirname(__file__))
# pyrefly: ignore [missing-import]
from github_scraper import run_scraper   as run_github
# pyrefly: ignore [missing-import]
from web_scraper    import run_web_scraper as run_web

MONGO_URL = os.getenv("MONGODB_URL")

if not MONGO_URL:
    raise RuntimeError(
        f"❌ MONGODB_URL not found! Checked .env at: {ENV_PATH}\n"
        f"   Make sure backend/.env exists and has MONGODB_URL set."
    )

LOG_FILE = "/tmp/interviewai_scraper.log"


async def should_run_update() -> bool:
    """Check karo — last update kab hua tha."""
    mongo = AsyncIOMotorClient(MONGO_URL)
    col   = mongo["interviewai"]["scraper_meta"]

    last_run = await col.find_one({"_id": "last_update"})

    if not last_run:
        return True  # Pehli baar

    last_time = last_run.get("timestamp")
    if not last_time:
        return True

    # 7 din se zyada hua → update karo
    last_dt = datetime.fromisoformat(last_time)
    days_since = (datetime.utcnow() - last_dt).days

    mongo.close()
    return days_since >= 7


async def save_update_timestamp(new_count: int):
    """Last update time save karo."""
    mongo = AsyncIOMotorClient(MONGO_URL)
    col   = mongo["interviewai"]["scraper_meta"]

    await col.update_one(
        {"_id": "last_update"},
        {"$set": {
            "timestamp":  datetime.utcnow().isoformat(),
            "new_added":  new_count,
            "updated_at": datetime.utcnow().isoformat(),
        }},
        upsert=True,
    )
    mongo.close()


async def get_current_count() -> int:
    mongo = AsyncIOMotorClient(MONGO_URL)
    count = await mongo["interviewai"]["questions"].count_documents({})
    mongo.close()
    return count


async def main():
    log_msg = f"\n{'='*50}\n[{datetime.now().strftime('%d %b %Y %H:%M')}] Weekly Updater Started\n"
    print(log_msg)

    # Check if update needed
    needs_update = await should_run_update()

    if not needs_update:
        msg = "⏭️  Last update was less than 7 days ago. Skipping."
        print(msg)
        return

    before_count = await get_current_count()
    print(f"📊 Questions before update: {before_count}")

    # Run scrapers
    print("\n🔄 Running GitHub scraper...")
    await run_github()

    print("\n🔄 Running Web scraper...")
    await run_web()

    after_count = await get_current_count()
    new_added   = after_count - before_count

    await save_update_timestamp(new_added)

    summary = f"""
✅ Weekly Update Complete!
   Before: {before_count}
   After:  {after_count}
   New:    +{new_added}
   Time:   {datetime.now().strftime('%d %b %Y %H:%M')}
"""
    print(summary)

    # Log file mein save karo
    with open(LOG_FILE, 'a') as f:
        f.write(summary)


if __name__ == "__main__":
    asyncio.run(main())
