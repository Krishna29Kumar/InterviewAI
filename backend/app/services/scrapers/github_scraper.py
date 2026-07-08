import httpx
import asyncio
import base64
import re
import os
from pathlib import Path
from datetime import datetime
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
MONGO_URL    = os.getenv("MONGODB_URL")

if not MONGO_URL:
    raise RuntimeError(
        f"❌ MONGODB_URL not found! Checked .env at: {ENV_PATH}\n"
        f"   Make sure backend/.env exists and has MONGODB_URL set."
    )

DB_NAME    = "interviewai"
COLLECTION = "questions"

HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}" if GITHUB_TOKEN else "",
    "Accept":        "application/vnd.github.v3+json",
    "User-Agent":    "InterviewAI-Scraper/1.0",
}

REPOS = [
    {
        "repo":       "sudheerj/reactjs-interview-questions",
        "domain":     "frontend",
        "topic":      "react",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "sudheerj/javascript-interview-questions",
        "domain":     "frontend",
        "topic":      "javascript",
        "difficulty_hint": "easy",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Devinterview-io/css-interview-questions",
        "domain":     "frontend",
        "topic":      "css",
        "difficulty_hint": "easy",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Devinterview-io/typescript-interview-questions",
        "domain":     "frontend",
        "topic":      "typescript",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "sudheerj/angular-interview-questions",
        "domain":     "frontend",
        "topic":      "angular",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "sudheerj/vuejs-interview-questions",
        "domain":     "frontend",
        "topic":      "vuejs",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "arialdomartini/Back-End-Developer-Interview-Questions",
        "domain":     "backend",
        "topic":      "backend_general",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "learning-zone/nodejs-basics",
        "domain":     "backend",
        "topic":      "nodejs",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Devinterview-io/node-interview-questions",
        "domain":     "backend",
        "topic":      "nodejs_advanced",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Devinterview-io/api-design-interview-questions",
        "domain":     "backend",
        "topic":      "rest_api",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Ebazhanov/linkedin-skill-assessments-quizzes",
        "domain":     "backend",
        "topic":      "backend_quizzes",
        "difficulty_hint": "medium",
        "file_paths": ["rest-api/rest-api-quiz.md",
                       "json/json-quiz.md"],
    },
    {
        "repo":       "jwasham/coding-interview-university",
        "domain":     "dsa",
        "topic":      "coding_interview",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Ebazhanov/linkedin-skill-assessments-quizzes",
        "domain":     "dsa",
        "topic":      "dsa_quiz",
        "difficulty_hint": "medium",
        "file_paths": ["python/python-quiz.md",
                       "java/java-quiz.md"],
    },
    {
        "repo":       "andrewekhalel/MLQuestions",
        "domain":     "ai_ml",
        "topic":      "ml_questions",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Ebazhanov/linkedin-skill-assessments-quizzes",
        "domain":     "ai_ml",
        "topic":      "ml_quiz",
        "difficulty_hint": "medium",
        "file_paths": ["machine-learning/machine-learning-quiz.md"],
    },
    {
        "repo":       "Devinterview-io/deep-learning-interview-questions",
        "domain":     "ai_ml",
        "topic":      "deep_learning",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Devinterview-io/pytorch-interview-questions",
        "domain":     "ai_ml",
        "topic":      "pytorch",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Devinterview-io/reinforcement-learning-interview-questions",
        "domain":     "ai_ml",
        "topic":      "reinforcement_learning",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "rbhatia46/Data-Science-Interview-Resources",
        "domain":     "data_science",
        "topic":      "data_science_general",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "youssefHosni/Data-Science-Interview-Questions-Answers",
        "domain":     "data_science",
        "topic":      "ds_qa",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "iamtodor/data-science-interview-questions-and-answers",
        "domain":     "data_science",
        "topic":      "statistics",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "jassics/security-interview-questions",
        "domain":     "cybersecurity",
        "topic":      "security_general",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "imthenachoman/How-To-Secure-A-Linux-Server",
        "domain":     "cybersecurity",
        "topic":      "linux_security",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "coreb1t/awesome-pentest-cheat-sheets",
        "domain":     "cybersecurity",
        "topic":      "penetration_testing",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Devinterview-io/sql-interview-questions",
        "domain":     "database",
        "topic":      "sql",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Ebazhanov/linkedin-skill-assessments-quizzes",
        "domain":     "database",
        "topic":      "mongodb_quiz",
        "difficulty_hint": "medium",
        "file_paths": ["mongodb/mongodb-quiz.md",
                       "mysql/mysql-quiz.md"],
    },
    {
        "repo":       "Devinterview-io/nosql-interview-questions",
        "domain":     "database",
        "topic":      "nosql",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "trimstray/test-your-sysadmin-skills",
        "domain":     "devops",
        "topic":      "linux_sysadmin",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Ebazhanov/linkedin-skill-assessments-quizzes",
        "domain":     "devops",
        "topic":      "devops_quiz",
        "difficulty_hint": "medium",
        "file_paths": ["git/git-quiz.md",
                       "aws/aws-quiz.md",
                       "linux/linux-quiz.md"],
    },
    {
        "repo":       "Devinterview-io/docker-interview-questions",
        "domain":     "devops",
        "topic":      "docker",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Devinterview-io/software-architecture-interview-questions",
        "domain":     "system_design",
        "topic":      "software_architecture",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "learning-zone/python-basics",
        "domain":     "python",
        "topic":      "python_general",
        "difficulty_hint": "easy",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Ebazhanov/linkedin-skill-assessments-quizzes",
        "domain":     "python",
        "topic":      "python_quiz",
        "difficulty_hint": "medium",
        "file_paths": ["python/python-quiz.md"],
    },
    {
        "repo":       "learning-zone/java-basics",
        "domain":     "java",
        "topic":      "java_general",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Devinterview-io/java-interview-questions",
        "domain":     "java",
        "topic":      "java_interview",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Ebazhanov/linkedin-skill-assessments-quizzes",
        "domain":     "java",
        "topic":      "java_quiz",
        "difficulty_hint": "medium",
        "file_paths": ["java/java-quiz.md",
                       "spring-framework/spring-framework-quiz.md"],
    },
    {
        "repo":       "codetobuild/computer-network-interview-questions",
        "domain":     "computer_networks",
        "topic":      "networking_general",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "learning-zone/operating-system",
        "domain":     "operating_systems",
        "topic":      "os_general",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Devinterview-io/blockchain-interview-questions",
        "domain":     "blockchain",
        "topic":      "blockchain_general",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "MindorksOpenSource/android-interview-questions",
        "domain":     "mobile",
        "topic":      "android",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "onmyway133/ios-interview-questions",
        "domain":     "mobile",
        "topic":      "ios_swift",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "learning-zone/react-native-interview-questions",
        "domain":     "mobile",
        "topic":      "react_native",
        "difficulty_hint": "medium",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Ebazhanov/linkedin-skill-assessments-quizzes",
        "domain":     "computer_vision",
        "topic":      "cv_quiz",
        "difficulty_hint": "hard",
        "file_paths": ["opencv/opencv-quiz.md"],
    },
    {
        "repo":       "Devinterview-io/computer-vision-interview-questions",
        "domain":     "computer_vision",
        "topic":      "computer_vision",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Devinterview-io/nlp-interview-questions",
        "domain":     "nlp",
        "topic":      "natural_language_processing",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
    {
        "repo":       "Ebazhanov/linkedin-skill-assessments-quizzes",
        "domain":     "game_dev",
        "topic":      "unity_game_dev",
        "difficulty_hint": "medium",
        "file_paths": ["unity/unity-quiz.md",
                       "game-design/game-design-quiz.md"],
    },
    {
        "repo":       "Devinterview-io/cpp-interview-questions",
        "domain":     "cpp",
        "topic":      "cpp_language",
        "difficulty_hint": "hard",
        "file_paths": ["README.md"],
    },
]


def parse_markdown(md_text: str, domain: str, topic: str,
                   source: str, difficulty_hint: str) -> list:
    questions = []
    lines = md_text.split('\n')
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        if re.match(r'^#{2,4}\s+\d*[\.\)]?\s*.+\?', line):
            q_text = re.sub(r'^#{2,4}\s+\d*[\.\)]?\s*', '', line).strip()
            q_text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', q_text)
            q_text = re.sub(r'[*_`]', '', q_text).strip()

            if 10 < len(q_text) < 400:
                answer_lines = []
                j = i + 1
                while j < len(lines) and j < i + 25:
                    nl = lines[j].strip()
                    if re.match(r'^#{1,4}\s', nl) and j > i + 1:
                        break
                    if nl and not nl.startswith('#'):
                        clean = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', nl)
                        clean = re.sub(r'[*_`]', '', clean).strip()
                        if clean:
                            answer_lines.append(clean)
                    j += 1

                answer = ' '.join(answer_lines[:6]).strip()
                if len(answer) > 300:
                    answer = answer[:300] + '...'

                questions.append(_make_q(
                    q_text, answer, domain, topic,
                    source, difficulty_hint
                ))

        elif re.match(r'^\*\*Q[\d\.]*[:)]?\*\*', line):
            q_match = re.search(r'\*\*Q[\d\.]*[:)]?\*\*\s*:?\s*(.+)', line)
            if q_match:
                q_text = q_match.group(1).strip()
                answer = ''
                if i + 1 < len(lines):
                    a_match = re.search(r'\*\*A[\d\.]*[:)]?\*\*\s*:?\s*(.+)', lines[i+1])
                    if a_match:
                        answer = a_match.group(1).strip()[:300]
                if len(q_text) > 10:
                    questions.append(_make_q(
                        q_text, answer, domain, topic,
                        source, difficulty_hint
                    ))

        elif re.match(r'^\d+[\.\)]\s+.+\?$', line):
            q_text = re.sub(r'^\d+[\.\)]\s+', '', line).strip()
            q_text = re.sub(r'[*_`\[\]]', '', q_text).strip()
            if 10 < len(q_text) < 300:
                questions.append(_make_q(
                    q_text, '', domain, topic,
                    source, difficulty_hint
                ))

        i += 1

    seen = set()
    unique = []
    for q in questions:
        key = q['question'][:80].lower()
        if key not in seen:
            seen.add(key)
            unique.append(q)

    return unique


def _make_q(question, answer, domain, topic, source, difficulty_hint):
    return {
        "question":   question,
        "answer":     answer or "Refer to official documentation.",
        "domain":     domain,
        "topic":      topic,
        "difficulty": _difficulty(question, difficulty_hint),
        "source":     source,
        "tags":       _tags(domain, topic),
        "scraped_at": datetime.utcnow().isoformat(),
        "verified":   False,
    }


def _difficulty(question: str, hint: str) -> str:
    q = question.lower()
    hard_kw   = ['implement','design','optimize','architect','algorithm',
                 'complex','advanced','distributed','concurrent','internals',
                 'trade-off','scalab','exploit','vulnerability','pentest']
    medium_kw = ['difference','explain','how does','why','when','compare',
                 'lifecycle','what happens','how to','describe']
    if any(k in q for k in hard_kw):   return 'hard'
    if any(k in q for k in medium_kw): return 'medium'
    return hint if hint in ['easy','medium','hard'] else 'easy'


def _tags(domain: str, topic: str) -> list:
    tag_map = {
        'frontend':         ['web','ui','browser'],
        'backend':          ['server','api','rest'],
        'dsa':              ['algorithms','data-structures','coding'],
        'ai_ml':            ['artificial-intelligence','ml','deep-learning'],
        'data_science':     ['statistics','pandas','numpy','visualization'],
        'cybersecurity':    ['security','hacking','ctf','network-security'],
        'robotics':         ['embedded','ros','arduino','hardware'],
        'database':         ['sql','nosql','query','schema'],
        'devops':           ['ci-cd','docker','kubernetes','cloud'],
        'system_design':    ['scalability','microservices','distributed'],
        'python':           ['scripting','automation','django','flask'],
        'java':             ['spring','jvm','oop'],
        'computer_networks':['tcp-ip','http','dns','protocols'],
        'operating_systems':['process','thread','memory','scheduling'],
        'blockchain':       ['web3','ethereum','smart-contracts','defi'],
        'mobile':           ['android','ios','react-native','flutter'],
        'computer_vision':  ['opencv','cnn','image-processing'],
        'nlp':              ['transformers','bert','text-processing'],
        'game_dev':         ['unity','unreal','physics','rendering'],
        'cpp':              ['pointers','memory-management','stl'],
    }
    return tag_map.get(domain, []) + [topic.replace('_', '-')]


async def fetch_file(client, repo, file_path):
    url = f"https://api.github.com/repos/{repo}/contents/{file_path}"
    try:
        r = await client.get(url, headers=HEADERS, timeout=30)
        if r.status_code == 200:
            content = base64.b64decode(r.json()['content']).decode('utf-8', errors='ignore')
            print(f"    ✅ {file_path} ({len(content)//1000}KB)")
            return content
        elif r.status_code == 403:
            print(f"    ⚠️  Rate limited — check GITHUB_TOKEN in .env")
            await asyncio.sleep(10)
            return ""
        elif r.status_code == 404:
            print(f"    ❌ Not found: {file_path}")
            return ""
        else:
            print(f"    ❌ HTTP {r.status_code}")
            return ""
    except Exception as e:
        print(f"    ❌ Error: {e}")
        return ""


async def save_questions(questions, collection):
    if not questions:
        return 0
    saved = 0
    for q in questions:
        exists = await collection.find_one(
            {"question": {"$regex": f"^{re.escape(q['question'][:50])}"}}
        )
        if not exists:
            await collection.insert_one(q)
            saved += 1
    return saved


async def run_scraper():
    print("\n🚀 GitHub Scraper Starting...")
    print(f"📦 Total repos to scrape: {len(REPOS)}")
    print("=" * 60)

    client_mongo = AsyncIOMotorClient(MONGO_URL)
    db           = client_mongo[DB_NAME]
    col          = db[COLLECTION]

    await col.create_index([("domain", 1), ("difficulty", 1)])
    await col.create_index("topic")
    await col.create_index("tags")

    total    = 0
    by_domain = {}

    async with httpx.AsyncClient() as client:
        for cfg in REPOS:
            repo   = cfg["repo"]
            domain = cfg["domain"]
            topic  = cfg["topic"]
            hint   = cfg.get("difficulty_hint", "medium")
            files  = cfg["file_paths"]

            print(f"\n📁 {repo}")
            print(f"   [{domain}] → {topic}")

            repo_qs = []
            for fp in files:
                content = await fetch_file(client, repo, fp)
                if content:
                    parsed = parse_markdown(
                        content, domain, topic,
                        f"github.com/{repo}", hint
                    )
                    repo_qs.extend(parsed)
                    print(f"   📝 Parsed: {len(parsed)} from {fp}")
                await asyncio.sleep(0.8)

            saved = await save_questions(repo_qs, col)
            total += saved
            by_domain[domain] = by_domain.get(domain, 0) + saved
            print(f"   💾 Saved: {saved} new questions")

    print("\n" + "=" * 60)
    print(f"✅ GitHub Scraping Done!")
    print(f"📊 Total Saved: {total}\n")
    print("📈 By Domain:")
    for d, c in sorted(by_domain.items(), key=lambda x: -x[1]):
        bar = "█" * min(c // 5, 30)
        print(f"   {d:22s} {bar} {c}")

    total_db = await col.count_documents({})
    print(f"\n🗄️  Total in MongoDB: {total_db}")
    client_mongo.close()


if __name__ == "__main__":
    asyncio.run(run_scraper())
