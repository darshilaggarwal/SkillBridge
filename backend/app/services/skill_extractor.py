import re
from collections.abc import Iterable


SKILL_ALIASES: dict[str, list[str]] = {
    "Python": ["python", "py"],
    "JavaScript": ["javascript", "js", "ecmascript"],
    "TypeScript": ["typescript", "ts"],
    "React": ["react", "react.js", "reactjs"],
    "FastAPI": ["fastapi", "fast api"],
    "Django": ["django"],
    "Flask": ["flask"],
    "APIs": ["api", "apis", "rest", "rest api", "graphql"],
    "SQL": ["sql", "mysql", "database queries"],
    "PostgreSQL": ["postgresql", "postgres", "pgadmin"],
    "MongoDB": ["mongodb", "mongo"],
    "Machine Learning": ["machine learning", "ml", "supervised learning", "unsupervised learning"],
    "Deep Learning": ["deep learning", "neural network", "neural networks", "cnn", "rnn", "lstm"],
    "NLP": ["nlp", "natural language processing", "text classification", "sentiment analysis"],
    "Computer Vision": ["computer vision", "opencv", "image processing"],
    "TensorFlow": ["tensorflow", "keras"],
    "PyTorch": ["pytorch", "torch"],
    "scikit-learn": ["scikit-learn", "sklearn", "sci-kit learn"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Statistics": ["statistics", "probability", "hypothesis testing", "regression analysis"],
    "Data Visualization": ["data visualization", "matplotlib", "seaborn", "plotly", "charts"],
    "Exploratory Data Analysis": ["eda", "exploratory data analysis"],
    "Data Preprocessing": ["data preprocessing", "feature engineering", "data cleaning", "preprocessing"],
    "Model Evaluation": ["model evaluation", "accuracy", "precision", "recall", "f1 score", "roc"],
    "Time Series": ["time series", "forecasting", "arima"],
    "A/B Testing": ["a/b testing", "ab testing", "experimentation"],
    "Big Data": ["big data", "spark", "hadoop", "pyspark"],
    "Excel": ["excel", "spreadsheets"],
    "Tableau": ["tableau"],
    "Power BI": ["power bi", "powerbi"],
    "Dashboarding": ["dashboard", "dashboarding", "reports"],
    "Business Analytics": ["business analytics", "business intelligence"],
    "Presentation": ["presentation", "storytelling"],
    "Docker": ["docker", "container", "containers"],
    "MLOps": ["mlops", "model monitoring", "model deployment", "ml pipeline"],
    "AWS": ["aws", "amazon web services", "s3", "ec2", "lambda"],
    "Cloud Deployment": ["cloud deployment", "deployment", "render", "vercel", "railway", "heroku"],
    "CI/CD": ["ci/cd", "github actions", "continuous integration", "continuous deployment"],
    "Git": ["git", "github", "version control"],
    "Testing": ["testing", "unit testing", "pytest", "jest"],
    "Authentication": ["authentication", "jwt", "oauth", "login system"],
    "Prompt Engineering": ["prompt engineering", "prompts", "llm prompting"],
    "Vector Databases": ["vector database", "vector databases", "faiss", "pinecone", "chroma", "embeddings"],
    "LangChain": ["langchain"],
    "RAG": ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
    "Node.js": ["node.js", "nodejs", "node js"],
    "Java": ["java"],
    "C++": ["c++", "cpp"],
    "C#": ["c#", "c sharp"],
    "Kubernetes": ["kubernetes", "k8s"],
    "Linux": ["linux", "unix"],
    "Figma": ["figma"],
    "UI/UX Design": ["ui/ux", "ui ux", "user interface design", "user experience design"],
    "Graphic Design": ["graphic design", "visual design"],
    "Adobe Photoshop": ["photoshop", "adobe photoshop"],
    "Adobe Illustrator": ["illustrator", "adobe illustrator"],
    "Project Management": ["project management", "project planning", "stakeholder management"],
    "Agile": ["agile", "agile methodology"],
    "Scrum": ["scrum", "sprint planning"],
    "Jira": ["jira"],
    "Communication": ["communication", "written communication", "verbal communication"],
    "Leadership": ["leadership", "team leadership", "people management"],
    "Teamwork": ["teamwork", "collaboration", "cross-functional collaboration"],
    "Problem Solving": ["problem solving", "problem-solving", "analytical thinking"],
    "Customer Service": ["customer service", "customer support", "client support"],
    "Sales": ["sales", "business development", "lead generation"],
    "CRM": ["crm", "salesforce", "hubspot"],
    "Marketing": ["marketing", "brand marketing"],
    "Digital Marketing": ["digital marketing", "online marketing"],
    "SEO": ["seo", "search engine optimization"],
    "Content Writing": ["content writing", "copywriting", "content creation"],
    "Social Media Marketing": ["social media marketing", "social media management"],
    "Market Research": ["market research", "competitive analysis"],
    "Google Analytics": ["google analytics", "ga4"],
    "Accounting": ["accounting", "bookkeeping"],
    "Financial Analysis": ["financial analysis", "financial modeling", "financial modelling"],
    "Budgeting": ["budgeting", "budget planning"],
    "Auditing": ["auditing", "audit"],
    "Tally": ["tally", "tally erp"],
    "GST": ["gst", "goods and services tax"],
    "Recruitment": ["recruitment", "talent acquisition", "hiring"],
    "Human Resources": ["human resources", "hr management", "employee relations"],
    "Operations Management": ["operations management", "business operations"],
    "Supply Chain": ["supply chain", "supply chain management", "logistics"],
    "Inventory Management": ["inventory management", "inventory control"],
    "Procurement": ["procurement", "vendor management", "purchasing"],
    "Quality Assurance": ["quality assurance", "quality control", "qa"],
    "AutoCAD": ["autocad", "auto cad"],
    "SolidWorks": ["solidworks", "solid works"],
    "MATLAB": ["matlab"],
    "Civil Engineering": ["civil engineering", "construction management"],
    "Mechanical Engineering": ["mechanical engineering", "mechanical design"],
    "Electrical Engineering": ["electrical engineering", "circuit design"],
    "Patient Care": ["patient care", "clinical care"],
    "Clinical Research": ["clinical research", "clinical trials"],
    "Legal Research": ["legal research", "case law research"],
    "Contract Drafting": ["contract drafting", "legal drafting"],
    "Teaching": ["teaching", "instruction", "classroom management"],
    "Curriculum Design": ["curriculum design", "lesson planning"],
}

PREFERRED_CUES = (
    "preferred",
    "good to have",
    "nice to have",
    "bonus",
    "plus",
    "advantage",
    "desirable",
)

REQUIREMENT_CUES = (
    "required",
    "requirement",
    "must have",
    "must-have",
    "essential",
    "proficient",
    "proficiency",
    "experience with",
    "experience in",
    "knowledge of",
    "familiarity with",
    "skills",
    "qualification",
)

REQUIREMENT_HEADINGS = {
    "requirements",
    "required skills",
    "skills",
    "qualifications",
    "minimum qualifications",
    "preferred qualifications",
    "what you bring",
    "what we are looking for",
    "must have",
    "nice to have",
}

GENERIC_REQUIREMENT_WORDS = {
    "ability",
    "candidate",
    "company",
    "degree",
    "environment",
    "experience",
    "job",
    "knowledge",
    "minimum",
    "preferred",
    "qualification",
    "required",
    "requirement",
    "responsibility",
    "role",
    "skill",
    "strong",
    "team",
    "work",
    "year",
    "years",
}


PROJECT_KEYWORDS = [
    "project",
    "built",
    "developed",
    "implemented",
    "deployed",
    "created",
    "dashboard",
    "classifier",
    "prediction",
    "api",
]


def normalize_skill(skill: str) -> str:
    skill_lower = skill.strip().lower()
    for canonical, aliases in SKILL_ALIASES.items():
        if skill_lower == canonical.lower() or skill_lower in aliases:
            return canonical
    return skill.strip().title()


def skill_in_text(skill: str, text: str) -> bool:
    clean_text = re.sub(r"\s+", " ", text.lower())
    normalized = normalize_skill(skill)
    aliases = SKILL_ALIASES.get(normalized, [])

    for candidate in [normalized, *aliases]:
        escaped = re.escape(candidate.lower())
        if re.search(rf"(?<![a-z0-9]){escaped}(?![a-z0-9])", clean_text):
            return True

    return False


def extract_skills(text: str, extra_skills: Iterable[str] = ()) -> list[str]:
    found: set[str] = set()

    for canonical in SKILL_ALIASES:
        if skill_in_text(canonical, text):
            found.add(canonical)

    for skill in extra_skills:
        normalized = normalize_skill(skill)
        if skill_in_text(normalized, text):
            found.add(normalized)

    return sorted(found)


def extract_jd_requirements(text: str) -> dict[str, list[str]]:
    known_skills = extract_skills(text)
    fallback_skills = extract_explicit_requirement_phrases(text)
    all_skills = sorted({normalize_skill(skill) for skill in [*known_skills, *fallback_skills]})
    preferred = sorted(skill for skill in all_skills if is_preferred_skill(skill, text))
    required = sorted(skill for skill in all_skills if skill not in preferred)

    return {
        "required": required,
        "preferred": preferred,
        "all": sorted(all_skills),
    }


def extract_explicit_requirement_phrases(text: str) -> list[str]:
    phrases: set[str] = set()
    in_requirement_section = False

    for raw_line in text.splitlines():
        line = re.sub(r"^[\s•*\-–—\d.)]+", "", raw_line).strip()
        if not line:
            continue

        normalized_line = re.sub(r"[^a-zA-Z ]", " ", line).strip().lower()
        normalized_line = re.sub(r"\s+", " ", normalized_line)

        if normalized_line.rstrip(":") in REQUIREMENT_HEADINGS:
            in_requirement_section = True
            continue

        if len(line.split()) <= 5 and line.endswith(":") and normalized_line.rstrip(":") not in REQUIREMENT_HEADINGS:
            in_requirement_section = False

        has_cue = any(cue in normalized_line for cue in REQUIREMENT_CUES)
        if not in_requirement_section and not has_cue:
            continue

        for chunk in re.split(r"[,;/|]|\band\b", line, flags=re.IGNORECASE):
            candidate = clean_requirement_phrase(chunk)
            if candidate:
                phrases.add(candidate)

    return sorted(phrases)[:24]


def clean_requirement_phrase(value: str) -> str | None:
    phrase = value.lower().strip(" .:-")
    phrase = re.sub(r"\b\d+\+?\s*(?:-|to)?\s*\d*\s*years?\b", " ", phrase)
    phrase = re.sub(
        r"\b(?:required|preferred|minimum|strong|excellent|good|basic|advanced|proficiency|proficient|"
        r"experience|knowledge|understanding|familiarity|ability|skills?|qualifications?|working|hands-on|"
        r"with|in|of|to|using|is|are|a|an|the)\b",
        " ",
        phrase,
    )
    phrase = re.sub(r"[^a-z0-9+#./ -]", " ", phrase)
    phrase = re.sub(r"\s+", " ", phrase).strip(" .:-")
    words = phrase.split()

    if not words or len(words) > 4 or len(phrase) < 2 or len(phrase) > 48:
        return None
    if all(word in GENERIC_REQUIREMENT_WORDS for word in words):
        return None
    if any(skill_in_text(skill, phrase) for skill in SKILL_ALIASES):
        return None

    return phrase.title()


def is_preferred_skill(skill: str, text: str) -> bool:
    preferred_hit = False
    preferred_section = False

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        normalized_line = re.sub(r"[^a-zA-Z ]", " ", line).strip().lower()
        normalized_line = re.sub(r"\s+", " ", normalized_line).rstrip(":")

        if len(normalized_line.split()) <= 5 and any(cue in normalized_line for cue in PREFERRED_CUES):
            preferred_section = True
            continue
        if normalized_line in REQUIREMENT_HEADINGS:
            preferred_section = False
            continue

        if not skill_in_text(skill, line):
            continue
        if preferred_section or any(cue in normalized_line for cue in PREFERRED_CUES):
            preferred_hit = True
            continue

        return False

    return preferred_hit


def estimate_project_strength(text: str) -> float:
    clean_text = text.lower()
    hits = sum(1 for keyword in PROJECT_KEYWORDS if keyword in clean_text)
    return min(100.0, hits * 12.5)
