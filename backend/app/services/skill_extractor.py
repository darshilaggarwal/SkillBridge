import re


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
    "Presentation": ["presentation", "communication", "storytelling"],
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


def extract_skills(text: str) -> list[str]:
    clean_text = re.sub(r"\s+", " ", text.lower())
    found: set[str] = set()

    for canonical, aliases in SKILL_ALIASES.items():
        candidates = [canonical.lower(), *aliases]
        for candidate in candidates:
            escaped = re.escape(candidate.lower())
            if re.search(rf"(?<![a-z0-9]){escaped}(?![a-z0-9])", clean_text):
                found.add(canonical)
                break

    return sorted(found)


def estimate_project_strength(text: str) -> float:
    clean_text = text.lower()
    hits = sum(1 for keyword in PROJECT_KEYWORDS if keyword in clean_text)
    return min(100.0, hits * 12.5)
