from sqlalchemy.orm import Session

from app.models import JobRole


JOB_ROLES = [
    {
        "title": "Machine Learning Engineer",
        "description": (
            "Builds, evaluates, deploys, and monitors machine learning systems. "
            "Works with data pipelines, model APIs, experimentation, and production ML workflows."
        ),
        "skills": {
            "must_have": [
                "Python",
                "Machine Learning",
                "Deep Learning",
                "SQL",
                "Data Preprocessing",
                "Model Evaluation",
                "Git",
                "APIs",
            ],
            "good_to_have": [
                "FastAPI",
                "Docker",
                "MLOps",
                "AWS",
                "TensorFlow",
                "PyTorch",
                "CI/CD",
            ],
        },
    },
    {
        "title": "Data Scientist",
        "description": (
            "Analyzes data, builds predictive models, explains insights, and communicates "
            "business recommendations using statistics, visualization, and machine learning."
        ),
        "skills": {
            "must_have": [
                "Python",
                "Statistics",
                "Machine Learning",
                "SQL",
                "Pandas",
                "Data Visualization",
                "Exploratory Data Analysis",
            ],
            "good_to_have": [
                "A/B Testing",
                "Tableau",
                "Power BI",
                "Big Data",
                "NLP",
                "Time Series",
            ],
        },
    },
    {
        "title": "AI Engineer",
        "description": (
            "Creates AI-powered applications using NLP, embeddings, model APIs, vector search, "
            "automation workflows, and reliable backend services."
        ),
        "skills": {
            "must_have": [
                "Python",
                "NLP",
                "Machine Learning",
                "APIs",
                "Vector Databases",
                "Prompt Engineering",
                "FastAPI",
                "Git",
            ],
            "good_to_have": [
                "LangChain",
                "RAG",
                "Docker",
                "Cloud Deployment",
                "PostgreSQL",
                "Model Evaluation",
            ],
        },
    },
    {
        "title": "Data Analyst",
        "description": (
            "Collects, cleans, queries, visualizes, and explains data to help teams make "
            "clear decisions through reports and dashboards."
        ),
        "skills": {
            "must_have": [
                "SQL",
                "Excel",
                "Python",
                "Pandas",
                "Data Visualization",
                "Statistics",
                "Dashboarding",
            ],
            "good_to_have": [
                "Power BI",
                "Tableau",
                "Business Analytics",
                "Data Cleaning",
                "Presentation",
            ],
        },
    },
    {
        "title": "Full Stack Developer",
        "description": (
            "Builds complete web applications with frontend interfaces, backend APIs, databases, "
            "authentication, testing, and deployment."
        ),
        "skills": {
            "must_have": [
                "JavaScript",
                "React",
                "Python",
                "APIs",
                "SQL",
                "PostgreSQL",
                "Git",
                "Authentication",
            ],
            "good_to_have": [
                "FastAPI",
                "Docker",
                "Testing",
                "Cloud Deployment",
                "TypeScript",
                "CI/CD",
            ],
        },
    },
]


def seed_job_roles(db: Session) -> None:
    for role_data in JOB_ROLES:
        existing = db.query(JobRole).filter(JobRole.title == role_data["title"]).first()
        if existing:
            existing.description = role_data["description"]
            existing.skills = role_data["skills"]
            continue

        db.add(JobRole(**role_data))

    db.commit()

