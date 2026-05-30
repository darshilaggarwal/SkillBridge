import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.services.skill_extractor import (
    estimate_project_strength,
    extract_jd_requirements,
    extract_skills,
    normalize_skill,
)


SECTION_ALIASES = {
    "summary": {"summary", "profile", "objective", "career objective", "about"},
    "education": {"education", "academic background", "qualification", "qualifications"},
    "skills": {"skills", "technical skills", "key skills", "technologies", "tools"},
    "projects": {"projects", "academic projects", "personal projects", "project work"},
    "experience": {"experience", "work experience", "internship", "internships"},
    "certifications": {"certification", "certifications", "courses", "training"},
    "achievements": {"achievements", "awards", "positions of responsibility"},
    "links": {"links", "profiles", "portfolio"},
}

ACTION_VERBS = [
    "built",
    "created",
    "developed",
    "implemented",
    "deployed",
    "designed",
    "optimized",
    "trained",
    "evaluated",
    "integrated",
]


def analyze_resume(text: str, job_description: str) -> dict:
    sections = parse_resume_sections(text)
    jd_requirements = extract_jd_requirements(job_description)
    must_have = jd_requirements["required"]
    good_to_have = jd_requirements["preferred"]
    jd_skills = jd_requirements["all"]
    extracted_skills = extract_skills(text, extra_skills=jd_skills)
    extracted_set = {normalize_skill(skill) for skill in extracted_skills}
    jd_skill_set = {normalize_skill(skill) for skill in jd_skills}
    target_skill_set = set(jd_skill_set)
    target_title = infer_job_title(job_description)

    matched_required = sorted(skill for skill in must_have if skill in extracted_set)
    missing_required = sorted(skill for skill in must_have if skill not in extracted_set)
    optional_matches = sorted(skill for skill in good_to_have if skill in extracted_set)
    jd_matched = sorted(skill for skill in jd_skill_set if skill in extracted_set)
    jd_missing = sorted(skill for skill in jd_skill_set if skill not in extracted_set)

    required_score = ratio_score(len(matched_required), len(must_have))
    optional_score = ratio_score(len(optional_matches), len(good_to_have))
    semantic_score = semantic_similarity_score(text, job_description)
    project_score = estimate_project_strength(text)
    profile_score = profile_quality_score(sections)
    jd_match_score = ratio_score(len(jd_matched), len(jd_skill_set)) if jd_skill_set else 0.0
    skill_evidence = build_skill_evidence(target_skill_set, sections)
    evidence_score = average([item["confidence"] for item in skill_evidence if item["status"] != "missing"])
    ats_score, ats_findings = calculate_ats_score(text, sections, must_have, matched_required)

    score_breakdown = {
        "required_skills": round(required_score, 1),
        "optional_skills": round(optional_score, 1),
        "semantic_match": round(semantic_score, 1),
        "project_strength": round(project_score, 1),
        "profile_completeness": round(profile_score, 1),
        "skill_evidence": round(evidence_score, 1),
        "ats_readiness": round(ats_score, 1),
        "job_description_match": round(jd_match_score, 1),
    }

    resume_score = (
        required_score * 0.32
        + optional_score * 0.10
        + semantic_score * 0.14
        + project_score * 0.14
        + profile_score * 0.10
        + evidence_score * 0.10
        + ats_score * 0.10
    )

    career_readiness_score = (
        resume_score * 0.45
        + ats_score * 0.20
        + required_score * 0.20
        + evidence_score * 0.10
        + (jd_match_score if jd_skill_set else semantic_score) * 0.05
    )

    improvement_suggestions = build_improvement_suggestions(
        ats_findings=ats_findings,
        missing_skills=missing_required,
        jd_missing_skills=jd_missing,
        project_score=project_score,
        sections=sections,
    )
    recommendations = build_detailed_roadmap(
        missing_required=missing_required,
        jd_missing=jd_missing,
        weak_evidence=[item for item in skill_evidence if item["status"] in {"weak", "medium"}],
        role_title=target_title,
        ats_findings=ats_findings,
    )

    return {
        "target_title": target_title,
        "jd_requirements": jd_requirements,
        "extracted_skills": extracted_skills,
        "matched_skills": matched_required,
        "missing_skills": missing_required,
        "optional_matches": optional_matches,
        "semantic_score": round(semantic_score, 1),
        "ats_score": round(ats_score, 1),
        "career_readiness_score": round(min(career_readiness_score, 100.0), 1),
        "jd_match_score": round(jd_match_score, 1),
        "resume_score": round(min(resume_score, 100.0), 1),
        "score_breakdown": score_breakdown,
        "skill_evidence": skill_evidence,
        "ats_findings": ats_findings,
        "improvement_suggestions": improvement_suggestions,
        "jd_matched_skills": jd_matched,
        "jd_missing_skills": jd_missing,
        "sections_detected": {name: bool(value.strip()) for name, value in sections.items()},
        "recommendations": recommendations,
    }


def parse_resume_sections(text: str) -> dict[str, str]:
    sections = {name: "" for name in SECTION_ALIASES}
    sections["summary"] = ""
    current = "summary"

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        normalized = re.sub(r"[^a-zA-Z ]", "", line).strip().lower()
        matched_heading = heading_for(normalized)
        if matched_heading:
            current = matched_heading
            continue

        sections[current] = f"{sections[current]}\n{line}".strip()

    if not any(value.strip() for value in sections.values()):
        sections["summary"] = text

    return sections


def heading_for(line: str) -> str | None:
    if len(line.split()) > 4:
        return None

    for section, aliases in SECTION_ALIASES.items():
        if line in aliases:
            return section
    return None


def build_skill_evidence(target_skills: set[str], sections: dict[str, str]) -> list[dict]:
    evidence = []
    section_skills = {section: set(extract_skills(content)) for section, content in sections.items()}

    for skill in sorted(target_skills):
        sources = [section for section, skills in section_skills.items() if skill in skills]
        confidence = confidence_for_sources(sources, sections, skill)
        status = evidence_status(confidence)

        evidence.append(
            {
                "skill": skill,
                "status": status,
                "confidence": confidence,
                "source": ", ".join(format_section_name(source) for source in sources) if sources else "Not found",
                "evidence": evidence_line(skill, sources, sections),
            }
        )

    return evidence


def confidence_for_sources(sources: list[str], sections: dict[str, str], skill: str) -> int:
    if not sources:
        return 0

    score = 35
    if "skills" in sources:
        score = max(score, 55)
    if "projects" in sources:
        score = max(score, 78)
    if "experience" in sources:
        score = max(score, 88)
    if "projects" in sources and "experience" in sources:
        score = 94

    evidence_text = " ".join(sections.get(source, "") for source in sources).lower()
    if has_metric(evidence_text):
        score += 6
    if any(verb in evidence_text for verb in ACTION_VERBS):
        score += 4
    if skill.lower() in evidence_text and len(evidence_text.split()) > 18:
        score += 3

    return min(score, 100)


def evidence_status(confidence: int) -> str:
    if confidence >= 80:
        return "strong"
    if confidence >= 55:
        return "medium"
    if confidence > 0:
        return "weak"
    return "missing"


def evidence_line(skill: str, sources: list[str], sections: dict[str, str]) -> str:
    if not sources:
        return f"No strong resume evidence found for {skill}."

    strongest = "experience" if "experience" in sources else "projects" if "projects" in sources else sources[0]
    snippet = sections.get(strongest, "").replace("\n", " ")
    snippet = re.sub(r"\s+", " ", snippet).strip()
    if len(snippet) > 150:
        snippet = f"{snippet[:147]}..."
    return snippet or f"{skill} appears in {format_section_name(strongest)}."


def calculate_ats_score(
    text: str,
    sections: dict[str, str],
    required_skills: list[str],
    matched_required: list[str],
) -> tuple[float, dict]:
    email_found = bool(re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text))
    phone_found = bool(re.search(r"(\+?\d[\d\s-]{8,}\d)", text))
    github_found = "github" in text.lower()
    linkedin_found = "linkedin" in text.lower()
    contact_score = sum([email_found, phone_found, github_found or linkedin_found]) / 3 * 100

    important_sections = ["education", "skills", "projects", "experience"]
    section_score = sum(bool(sections.get(section, "").strip()) for section in important_sections) / len(
        important_sections
    ) * 100

    keyword_score = ratio_score(len(matched_required), len(required_skills))
    bullet_action_score = min(100, sum(text.lower().count(verb) for verb in ACTION_VERBS) * 11)
    metric_score = 100 if has_metric(text) else 35
    impact_score = bullet_action_score * 0.55 + metric_score * 0.45
    word_count = len(text.split())
    length_score = 100 if 250 <= word_count <= 850 else 70 if 150 <= word_count <= 1000 else 45

    ats_score = (
        contact_score * 0.18
        + section_score * 0.24
        + keyword_score * 0.28
        + impact_score * 0.18
        + length_score * 0.12
    )

    findings = {
        "contact": round(contact_score, 1),
        "sections": round(section_score, 1),
        "role_keywords": round(keyword_score, 1),
        "impact_language": round(impact_score, 1),
        "resume_length": round(length_score, 1),
        "checks": {
            "email_found": email_found,
            "phone_found": phone_found,
            "github_or_linkedin_found": github_found or linkedin_found,
            "metrics_found": has_metric(text),
            "project_section_found": bool(sections.get("projects", "").strip()),
            "skills_section_found": bool(sections.get("skills", "").strip()),
        },
        "word_count": word_count,
    }
    return min(ats_score, 100.0), findings


def build_improvement_suggestions(
    ats_findings: dict,
    missing_skills: list[str],
    jd_missing_skills: list[str],
    project_score: float,
    sections: dict[str, str],
) -> list[dict]:
    suggestions = []
    checks = ats_findings.get("checks", {})

    if not checks.get("github_or_linkedin_found"):
        suggestions.append(
            suggestion("Add portfolio links", "Add GitHub and LinkedIn links near your contact details.", "high", "ATS")
        )
    if not checks.get("metrics_found"):
        suggestions.append(
            suggestion(
                "Add measurable impact",
                "Add numbers like accuracy, latency, users, dataset size, or percentage improvement in projects.",
                "high",
                "Resume",
            )
        )
    if not sections.get("projects", "").strip() or project_score < 55:
        suggestions.append(
            suggestion(
                "Strengthen project proof",
                "Write at least two role-specific projects with problem, tech stack, model/API, result, and GitHub link.",
                "high",
                "Portfolio",
            )
        )
    if missing_skills:
        suggestions.append(
            suggestion(
                "Close priority skill gaps",
                f"Focus first on {', '.join(missing_skills[:3])}. These are required by the job description.",
                "high",
                "Skills",
            )
        )
    if jd_missing_skills:
        suggestions.append(
            suggestion(
                "Tailor resume to job description",
                f"The pasted JD also expects {', '.join(jd_missing_skills[:4])}. Add real evidence before applying.",
                "medium",
                "Job Match",
            )
        )
    if not sections.get("certifications", "").strip():
        suggestions.append(
            suggestion(
                "Add certification or course proof",
                "Add one credible course, certification, or lab project for the weakest missing skill.",
                "medium",
                "Learning",
            )
        )

    return suggestions[:6]


def build_detailed_roadmap(
    missing_required: list[str],
    jd_missing: list[str],
    weak_evidence: list[dict],
    role_title: str,
    ats_findings: dict,
) -> list[dict]:
    roadmap = []
    queued: set[str] = set()

    for skill in missing_required:
        roadmap.append(roadmap_item(skill, role_title, len(roadmap) + 1, "high"))
        queued.add(skill)

    for skill in jd_missing:
        if skill not in queued:
            roadmap.append(roadmap_item(skill, role_title, len(roadmap) + 1, "high"))
            queued.add(skill)

    for item in weak_evidence:
        skill = item["skill"]
        if skill not in queued and len(roadmap) < 8:
            roadmap.append(roadmap_item(skill, role_title, len(roadmap) + 1, "medium", improve_existing=True))
            queued.add(skill)

    checks = ats_findings.get("checks", {})
    if len(roadmap) < 8 and not checks.get("metrics_found"):
        roadmap.append(
            {
                "skill": "Resume Impact Writing",
                "week": len(roadmap) + 1,
                "task": "Rewrite project bullets with measurable outcomes, action verbs, and role keywords.",
                "project_idea": "Convert one existing project into a case-study resume bullet set.",
                "priority": "medium",
                "estimated_hours": 3,
                "resources": [
                    {"label": "STAR bullet practice", "type": "exercise", "url": "https://www.themuse.com/advice/star-interview-method"},
                ],
                "checklist": [
                    "Choose your strongest project",
                    "Write problem, action, result bullets",
                    "Add at least one number or metric",
                    "Add GitHub or demo link",
                ],
            }
        )

    if not roadmap:
        roadmap.append(
            {
                "skill": "Portfolio Polish",
                "week": 1,
                "task": f"Create a polished {role_title} portfolio project with screenshots, README, metrics, and deployment notes.",
                "project_idea": "Turn your best academic project into a professional case study.",
                "priority": "medium",
                "estimated_hours": 6,
                "resources": resource_pack("Git"),
                "checklist": [
                    "Clean the repository structure",
                    "Write a strong README",
                    "Add screenshots and result metrics",
                    "Add the project to your resume",
                ],
            }
        )

    return roadmap[:10]


def roadmap_item(
    skill: str,
    role_title: str,
    week: int,
    priority: str,
    improve_existing: bool = False,
) -> dict:
    if improve_existing:
        task = f"Upgrade your resume evidence for {skill} by using it in a project or measurable implementation."
    else:
        task = f"Learn {skill} fundamentals, practice one mini task, and add proof to your resume."

    return {
        "skill": skill,
        "week": week,
        "task": task,
        "project_idea": project_idea_for_skill(skill, role_title),
        "priority": priority,
        "estimated_hours": estimated_hours_for(skill),
        "resources": resource_pack(skill),
        "checklist": checklist_for(skill, improve_existing),
    }


def checklist_for(skill: str, improve_existing: bool) -> list[str]:
    if improve_existing:
        return [
            f"Find where {skill} appears in your resume",
            "Add project context and outcome",
            "Add metric, tool name, or deployment detail",
            "Update GitHub README or portfolio proof",
        ]

    return [
        f"Understand core concepts of {skill}",
        "Complete one guided practice task",
        "Build a mini implementation",
        "Add one resume bullet with evidence",
        "Push proof to GitHub or portfolio",
    ]


def resource_pack(skill: str) -> list[dict]:
    resources = {
        "FastAPI": [{"label": "FastAPI docs", "type": "docs", "url": "https://fastapi.tiangolo.com/"}],
        "Docker": [{"label": "Docker getting started", "type": "docs", "url": "https://docs.docker.com/get-started/"}],
        "PostgreSQL": [{"label": "PostgreSQL docs", "type": "docs", "url": "https://www.postgresql.org/docs/"}],
        "Machine Learning": [{"label": "scikit-learn user guide", "type": "docs", "url": "https://scikit-learn.org/stable/user_guide.html"}],
        "NLP": [{"label": "spaCy usage guide", "type": "docs", "url": "https://spacy.io/usage"}],
        "Vector Databases": [{"label": "pgvector", "type": "docs", "url": "https://github.com/pgvector/pgvector"}],
        "React": [{"label": "React docs", "type": "docs", "url": "https://react.dev/"}],
        "SQL": [{"label": "SQL tutorial", "type": "practice", "url": "https://www.postgresql.org/docs/current/tutorial-sql.html"}],
        "Git": [{"label": "Git book", "type": "docs", "url": "https://git-scm.com/book/en/v2"}],
    }
    return resources.get(
        skill,
        [{"label": f"{skill} practice task", "type": "practice", "url": "https://www.freecodecamp.org/news/"}],
    )


def estimated_hours_for(skill: str) -> int:
    higher = {"MLOps", "Deep Learning", "Vector Databases", "RAG", "Machine Learning"}
    medium = {"FastAPI", "Docker", "NLP", "PostgreSQL", "React", "SQL"}
    if skill in higher:
        return 10
    if skill in medium:
        return 6
    return 4


def suggestion(title: str, detail: str, priority: str, category: str) -> dict:
    return {"title": title, "detail": detail, "priority": priority, "category": category}


def ratio_score(matches: int, total: int) -> float:
    if total == 0:
        return 100.0
    return (matches / total) * 100


def average(values: list[int | float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def semantic_similarity_score(text: str, job_description: str) -> float:
    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 3),
            sublinear_tf=True,
            max_features=5000,
        )
        matrix = vectorizer.fit_transform([text, job_description])
        similarity = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
        return float(similarity * 100)
    except ValueError:
        return 0.0


def profile_quality_score(sections: dict[str, str]) -> float:
    important_sections = ["education", "skills", "projects", "experience", "certifications", "links"]
    hits = sum(1 for section in important_sections if sections.get(section, "").strip())
    return min(100.0, hits / len(important_sections) * 100)


def has_metric(text: str) -> bool:
    return bool(re.search(r"\b\d+(\.\d+)?%?\b", text))


def format_section_name(section: str) -> str:
    return section.replace("_", " ").title()


def infer_job_title(job_description: str) -> str:
    lines = [line.strip(" •*-\t") for line in job_description.splitlines() if line.strip()]

    for line in lines[:12]:
        match = re.match(r"(?i)(?:job\s*title|position|role)\s*:\s*(.+)", line)
        if match:
            return match.group(1).strip()[:120]

    for line in lines[:4]:
        clean_line = re.sub(r"\s+", " ", line).strip(" :")
        if 1 < len(clean_line.split()) <= 8 and not any(
            word in clean_line.lower()
            for word in ["description", "requirement", "qualification", "responsibilit", "about us"]
        ):
            return clean_line[:120]

    return "JD-Based Analysis"


def project_idea_for_skill(skill: str, role_title: str) -> str:
    ideas = {
        "FastAPI": "Deploy a trained ML model behind a FastAPI prediction endpoint.",
        "Docker": "Containerize the backend and database using Docker Compose.",
        "MLOps": "Add experiment tracking and model version notes to an ML workflow.",
        "SQL": "Create analytical queries over a job-skills dataset and visualize the results.",
        "PostgreSQL": "Store resume analysis reports and query them by user, role, and score.",
        "NLP": "Build a resume keyword extractor that identifies skills and project domains.",
        "Vector Databases": "Create semantic resume search using embeddings and vector similarity.",
        "React": "Build an interactive dashboard for analysis history and roadmap progress.",
        "Git": "Publish a clean GitHub repo with branches, issues, and a proper README.",
        "Machine Learning": "Train and evaluate a classifier for predicting best-fit job roles.",
        "Deep Learning": "Compare a neural model with a classical ML baseline on text data.",
        "Data Visualization": "Design a dashboard that shows score trends and skill coverage.",
        "Prompt Engineering": "Build and evaluate prompt templates for a resume feedback assistant.",
        "RAG": "Create a resume Q&A assistant that retrieves relevant project and skill evidence.",
    }
    return ideas.get(skill, f"Build a small {role_title} mini-project that clearly uses {skill}.")
