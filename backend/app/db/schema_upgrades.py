from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


REPORT_COLUMNS = {
    "ats_score": {"sqlite": "FLOAT DEFAULT 0", "postgresql": "DOUBLE PRECISION DEFAULT 0"},
    "career_readiness_score": {"sqlite": "FLOAT DEFAULT 0", "postgresql": "DOUBLE PRECISION DEFAULT 0"},
    "jd_match_score": {"sqlite": "FLOAT DEFAULT 0", "postgresql": "DOUBLE PRECISION DEFAULT 0"},
    "skill_evidence": {"sqlite": "JSON DEFAULT '[]'", "postgresql": "JSON DEFAULT '[]'::json"},
    "ats_findings": {"sqlite": "JSON DEFAULT '{}'", "postgresql": "JSON DEFAULT '{}'::json"},
    "improvement_suggestions": {"sqlite": "JSON DEFAULT '[]'", "postgresql": "JSON DEFAULT '[]'::json"},
    "jd_matched_skills": {"sqlite": "JSON DEFAULT '[]'", "postgresql": "JSON DEFAULT '[]'::json"},
    "jd_missing_skills": {"sqlite": "JSON DEFAULT '[]'", "postgresql": "JSON DEFAULT '[]'::json"},
    "sections_detected": {"sqlite": "JSON DEFAULT '{}'", "postgresql": "JSON DEFAULT '{}'::json"},
}

USER_COLUMNS = {
    "password_hash": {"sqlite": "VARCHAR(255) DEFAULT ''", "postgresql": "VARCHAR(255) DEFAULT ''"},
}

ROADMAP_COLUMNS = {
    "priority": {"sqlite": "VARCHAR(40) DEFAULT 'medium'", "postgresql": "VARCHAR(40) DEFAULT 'medium'"},
    "estimated_hours": {"sqlite": "INTEGER DEFAULT 4", "postgresql": "INTEGER DEFAULT 4"},
    "resources": {"sqlite": "JSON DEFAULT '[]'", "postgresql": "JSON DEFAULT '[]'::json"},
    "checklist": {"sqlite": "JSON DEFAULT '[]'", "postgresql": "JSON DEFAULT '[]'::json"},
}


def ensure_schema_upgrades(engine: Engine) -> None:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    if "analysis_reports" in table_names:
        ensure_columns(engine, "analysis_reports", REPORT_COLUMNS)

    if "users" in table_names:
        ensure_columns(engine, "users", USER_COLUMNS)

    if "roadmap_items" in table_names:
        ensure_columns(engine, "roadmap_items", ROADMAP_COLUMNS)


def ensure_columns(engine: Engine, table_name: str, columns: dict[str, dict[str, str]]) -> None:
    inspector = inspect(engine)
    existing = {column["name"] for column in inspector.get_columns(table_name)}
    dialect = engine.dialect.name

    with engine.begin() as connection:
        for name, definitions in columns.items():
            if name in existing:
                continue
            definition = definitions.get(dialect, definitions["sqlite"])
            connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {name} {definition}"))
