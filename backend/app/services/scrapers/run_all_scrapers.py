"""
FILE: backend/app/services/scrapers/run_all_scrapers.py
=========================================================
EK command se saare scrapers chalao.

Run karo:
  cd /Users/arthrana/Desktop/interviewAi/InterviewAI/backend
  source venv/bin/activate
  cd app/services/scrapers
  python3 run_all_scrapers.py

Expected:
  GitHub repos: ~2000-3000 questions
  Web pages:    ~1500-2500 questions
  TOTAL:        ~3500-5500 questions
  Time:         20-40 minutes
"""

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# Scrapers import
sys.path.insert(0, os.path.dirname(__file__))
from github_scraper import run_scraper   as run_github
from web_scraper    import run_web_scraper as run_web

MONGO_URL = os.getenv("MONGODB_URL")

if not MONGO_URL:
    raise RuntimeError(
        f"❌ MONGODB_URL not found! Checked .env at: {ENV_PATH}\n"
        f"   Make sure backend/.env exists and has MONGODB_URL set."
    )


async def print_final_stats():
    """MongoDB mein total count dikhao domain wise."""
    mongo = AsyncIOMotorClient(MONGO_URL)
    col   = mongo["interviewai"]["questions"]

    print("\n\n📊 FINAL MONGODB STATS:")
    print("=" * 50)

    total = await col.count_documents({})
    print(f"Total Questions: {total}\n")

    pipeline = [{"$group": {"_id": "$domain", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}]

    async for doc in col.aggregate(pipeline):
        bar = "█" * min(doc['count'] // 10, 25)
        print(f"  {doc['_id']:22s} {bar} {doc['count']}")

    print("\nDifficulty Breakdown:")
    pipeline2 = [{"$group": {"_id": "$difficulty", "count": {"$sum": 1}}}]
    async for doc in col.aggregate(pipeline2):
        print(f"  {doc['_id']:10s} → {doc['count']}")

    mongo.close()


async def main():
    start = datetime.now()

    print("\n" + "█"*60)
    print("  🚀  INTERVIEWAI — COMPLETE QUESTION SCRAPER")
    print("█"*60)
    print(f"\n⏰ Started: {start.strftime('%d %b %Y, %H:%M:%S')}")
    print("""
Domains Being Scraped:
  ✅ Frontend (React, JS, HTML, CSS, Angular, Vue, TS)
  ✅ Backend (Node, Express, Django, Spring, REST API)
  ✅ DSA (Arrays, Trees, Graphs, DP, Algorithms)
  ✅ AI / Machine Learning
  ✅ Data Science (Pandas, NumPy, Statistics)
  ✅ Cybersecurity (Ethical Hacking, Crypto, Network Sec)
  ✅ Robotics / Embedded Systems / IoT
  ✅ Database (SQL, MongoDB, PostgreSQL, DBMS)
  ✅ DevOps (Docker, K8s, AWS, Git, Linux)
  ✅ System Design
  ✅ Python / Java / C / C++
  ✅ Computer Networks / OS / OOP
  ✅ Mobile (Android, Flutter, React Native)
  ✅ Blockchain / Web3
  ✅ NLP / Computer Vision
  ✅ Game Development
""")
    print("="*60)

    # STEP 1: GitHub
    print("\n\n📁 STEP 1/2: GitHub Repos (fast)")
    print("-"*40)
    await run_github()

    # STEP 2: Web
    print("\n\n🌐 STEP 2/2: Web Pages (slower — 2.5s delay each)")
    print("-"*40)
    await run_web()

    # Final stats
    await print_final_stats()

    end = datetime.now()
    mins = (end - start).seconds // 60

    print(f"\n\n⏱️  Total Time: ~{mins} minutes")
    print("🎉 DONE! Ab Ollama se AI questions generate karo!")
    print("█"*60)


if __name__ == "__main__":
    asyncio.run(main())
