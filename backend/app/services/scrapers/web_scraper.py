"""
FILE: backend/app/services/scrapers/web_scraper.py
====================================================
BeautifulSoup se GFG + other web pages scrape karo.
Saare BTech domains covered.
"""

import httpx
import asyncio
from bs4 import BeautifulSoup
import re
import os
from pathlib import Path
from datetime import datetime

# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

MONGO_URL = os.getenv("MONGODB_URL")

if not MONGO_URL:
    raise RuntimeError(
        f"❌ MONGODB_URL not found! Checked .env at: {ENV_PATH}\n"
        f"   Make sure backend/.env exists and has MONGODB_URL set."
    )

DB_NAME    = "interviewai"
COLLECTION = "questions"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept":     "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# ─────────────────────────────────────────────
# ALL WEB SOURCES
# ─────────────────────────────────────────────
WEB_SOURCES = [

    # ── FRONTEND ──
    {"url": "https://www.geeksforgeeks.org/react-interview-questions-and-answers/",          "domain": "frontend",          "topic": "react",              "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/top-50-javascript-interview-questions-answers/",  "domain": "frontend",          "topic": "javascript",         "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/css-interview-questions-and-answers/",            "domain": "frontend",          "topic": "css",                "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/html-interview-questions-and-answers/",           "domain": "frontend",          "topic": "html",               "parser": "gfg"},

    # ── BACKEND ──
    {"url": "https://www.geeksforgeeks.org/node-interview-questions-and-answers/",           "domain": "backend",           "topic": "nodejs",             "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/django-interview-questions/",                     "domain": "backend",           "topic": "django",             "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/spring-boot-interview-questions/",                "domain": "backend",           "topic": "spring_boot",        "parser": "gfg"},

    # ── DSA ──
    {"url": "https://www.geeksforgeeks.org/commonly-asked-data-structure-interview-questions-set-1/", "domain": "dsa",    "topic": "data_structures",    "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/top-50-array-coding-problems-for-interviews/",    "domain": "dsa",               "topic": "arrays",             "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/commonly-asked-algorithm-interview-questions-set-1/", "domain": "dsa",           "topic": "algorithms",         "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/top-50-dynamic-programming-coding-problems-for-interviews/", "domain": "dsa",   "topic": "dynamic_programming","parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/top-50-tree-coding-problems-for-interviews/",     "domain": "dsa",               "topic": "trees",              "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/top-50-graph-coding-problems-for-interviews/",    "domain": "dsa",               "topic": "graphs",             "parser": "gfg"},

    # ── AI/ML ──
    {"url": "https://www.geeksforgeeks.org/machine-learning-interview-questions/",           "domain": "ai_ml",             "topic": "machine_learning",   "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/deep-learning-interview-questions/",              "domain": "ai_ml",             "topic": "deep_learning",      "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/artificial-intelligence-interview-questions/",    "domain": "ai_ml",             "topic": "ai_general",         "parser": "gfg"},

    # ── DATA SCIENCE ──
    {"url": "https://www.geeksforgeeks.org/data-science-interview-questions-and-answers/",  "domain": "data_science",      "topic": "data_science",       "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/pandas-interview-questions/",                     "domain": "data_science",      "topic": "pandas",             "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/numpy-interview-questions/",                      "domain": "data_science",      "topic": "numpy",              "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/statistics-interview-questions/",                 "domain": "data_science",      "topic": "statistics",         "parser": "gfg"},

    # ── CYBERSECURITY ──
    {"url": "https://www.geeksforgeeks.org/cyber-security-interview-questions/",             "domain": "cybersecurity",     "topic": "security_general",   "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/network-security-interview-questions/",           "domain": "cybersecurity",     "topic": "network_security",   "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/cryptography-interview-questions/",               "domain": "cybersecurity",     "topic": "cryptography",       "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/ethical-hacking-interview-questions/",            "domain": "cybersecurity",     "topic": "ethical_hacking",    "parser": "gfg"},

    # ── ROBOTICS / EMBEDDED ──
    {"url": "https://www.geeksforgeeks.org/embedded-systems-interview-questions/",           "domain": "robotics",          "topic": "embedded_systems",   "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/iot-interview-questions-and-answers/",            "domain": "robotics",          "topic": "iot",                "parser": "gfg"},

    # ── DATABASE ──
    {"url": "https://www.geeksforgeeks.org/sql-interview-questions/",                        "domain": "database",          "topic": "sql",                "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/commonly-asked-dbms-interview-questions/",        "domain": "database",          "topic": "dbms",               "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/mongodb-interview-questions/",                    "domain": "database",          "topic": "mongodb",            "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/postgresql-interview-questions/",                 "domain": "database",          "topic": "postgresql",         "parser": "gfg"},

    # ── DEVOPS ──
    {"url": "https://www.geeksforgeeks.org/docker-interview-questions/",                     "domain": "devops",            "topic": "docker",             "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/kubernetes-interview-questions/",                 "domain": "devops",            "topic": "kubernetes",         "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/aws-interview-questions/",                        "domain": "devops",            "topic": "aws",                "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/git-interview-questions-and-answers/",            "domain": "devops",            "topic": "git",                "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/linux-interview-questions/",                      "domain": "devops",            "topic": "linux",              "parser": "gfg"},

    # ── SYSTEM DESIGN ──
    {"url": "https://www.geeksforgeeks.org/system-design-interview-questions/",              "domain": "system_design",     "topic": "system_design",      "parser": "gfg"},

    # ── CS FUNDAMENTALS ──
    {"url": "https://www.geeksforgeeks.org/commonly-asked-oop-interview-questions/",         "domain": "cs_fundamentals",   "topic": "oops",               "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/commonly-asked-operating-systems-interview-questions/", "domain": "operating_systems", "topic": "os",            "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/commonly-asked-computer-networks-interview-questions/", "domain": "computer_networks", "topic": "networking",    "parser": "gfg"},

    # ── PYTHON ──
    {"url": "https://www.geeksforgeeks.org/python-interview-questions/",                     "domain": "python",            "topic": "python_general",     "parser": "gfg"},

    # ── JAVA ──
    {"url": "https://www.geeksforgeeks.org/java-interview-questions/",                       "domain": "java",              "topic": "java_general",       "parser": "gfg"},

    # ── C/C++ ──
    {"url": "https://www.geeksforgeeks.org/c-interview-questions/",                          "domain": "cpp",               "topic": "c_language",         "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/cpp-interview-questions/",                        "domain": "cpp",               "topic": "cpp_language",       "parser": "gfg"},

    # ── MOBILE ──
    {"url": "https://www.geeksforgeeks.org/android-interview-questions/",                    "domain": "mobile",            "topic": "android",            "parser": "gfg"},
    {"url": "https://www.geeksforgeeks.org/flutter-interview-questions/",                    "domain": "mobile",            "topic": "flutter",            "parser": "gfg"},

    # ── BLOCKCHAIN ──
    {"url": "https://www.geeksforgeeks.org/blockchain-interview-questions/",                 "domain": "blockchain",        "topic": "blockchain_general", "parser": "gfg"},

    # ── NLP ──
    {"url": "https://www.geeksforgeeks.org/nlp-interview-questions/",                        "domain": "nlp",               "topic": "nlp_general",        "parser": "gfg"},
]


# ─────────────────────────────────────────────
# GFG PARSER
# ─────────────────────────────────────────────
def parse_gfg(soup: BeautifulSoup, domain: str, topic: str, url: str) -> list:
    questions = []

    for tag in soup.find_all(['h2', 'h3', 'h4']):
        text = tag.get_text(strip=True)
        text = re.sub(r'^\d+[\.\)]\s*', '', text).strip()
        text = re.sub(r'\[.*?\]', '', text).strip()

        if '?' in text and 15 < len(text) < 350:
            answer = ''
            next_el = tag.find_next_sibling()
            if next_el and next_el.name in ['p', 'ul', 'ol', 'div']:
                answer = next_el.get_text(separator=' ', strip=True)[:400]

            questions.append({
                "question":   text,
                "answer":     answer or "See full explanation on GeeksForGeeks.",
                "domain":     domain,
                "topic":      topic,
                "difficulty": _diff(text),
                "source":     url,
                "tags":       [domain, topic.replace('_', '-')],
                "scraped_at": datetime.utcnow().isoformat(),
                "verified":   False,
            })

    return questions


def _diff(q: str) -> str:
    q = q.lower()
    if any(k in q for k in ['implement','design','optimize','algorithm','advanced','complex']): return 'hard'
    if any(k in q for k in ['difference','explain','how','why','compare','describe']):          return 'medium'
    return 'easy'


# ─────────────────────────────────────────────
# FETCH + PARSE
# ─────────────────────────────────────────────
async def fetch_page(client, source):
    url    = source["url"]
    domain = source["domain"]
    topic  = source["topic"]

    try:
        print(f"  🌐 {url[-60:]}")
        r = await client.get(url, headers=HEADERS, timeout=25, follow_redirects=True)

        if r.status_code != 200:
            print(f"     ❌ HTTP {r.status_code}")
            return []

        soup = BeautifulSoup(r.text, 'lxml')
        for el in soup(['script','style','nav','footer','header','aside']):
            el.decompose()

        qs = parse_gfg(soup, domain, topic, url)
        print(f"     📝 {len(qs)} questions")
        return qs

    except Exception as e:
        print(f"     ❌ {e}")
        return []


async def save_to_mongo(questions, collection):
    saved = 0
    for q in questions:
        exists = await collection.find_one(
            {"question": {"$regex": f"^{re.escape(q['question'][:40])}"}}
        )
        if not exists:
            await collection.insert_one(q)
            saved += 1
    return saved


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
async def run_web_scraper():
    print("\n🌐 Web Scraper Starting...")
    print(f"📦 Total pages: {len(WEB_SOURCES)}")
    print("=" * 60)

    mongo = AsyncIOMotorClient(MONGO_URL)
    col   = mongo[DB_NAME][COLLECTION]

    total    = 0
    by_domain = {}

    async with httpx.AsyncClient() as client:
        for source in WEB_SOURCES:
            qs    = await fetch_page(client, source)
            saved = await save_to_mongo(qs, col)
            total += saved
            d = source["domain"]
            by_domain[d] = by_domain.get(d, 0) + saved
            print(f"     💾 Saved: {saved}\n")
            await asyncio.sleep(2.5)  # respectful delay

    print("=" * 60)
    print(f"✅ Web Done! Total: {total}")
    print("\n📈 By Domain:")
    for d, c in sorted(by_domain.items(), key=lambda x: -x[1]):
        print(f"   {d:22s} → {c}")

    mongo.close()


if __name__ == "__main__":
    asyncio.run(run_web_scraper())
