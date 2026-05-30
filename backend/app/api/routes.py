from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models import AnalysisReport, JobRole, Resume, RoadmapItem, User
from app.schemas import (
    AnalysisReportOut,
    AuthRequest,
    AuthResponse,
    DashboardHistoryItem,
    DashboardSummary,
    JobRoleOut,
    RoadmapItemOut,
    RoadmapStatusUpdate,
    UserOut,
)
from app.services.analyzer import analyze_resume
from app.services.auth import create_token, get_current_user, hash_password, verify_password
from app.services.resume_parser import extract_text, save_upload

router = APIRouter(prefix="/api")


@router.get("/health")
def health() -> dict:
    return {"status": "ok"}


@router.get("/job-roles", response_model=list[JobRoleOut])
def list_job_roles(db: Session = Depends(get_db)) -> list[JobRole]:
    return db.query(JobRole).order_by(JobRole.title).all()


@router.post("/auth/signup", response_model=AuthResponse)
def signup(payload: AuthRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = payload.email.strip().lower()
    name = (payload.name or "").strip()

    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required.")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Account already exists. Sign in instead.")

    user = User(name=name, email=email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthResponse(token=create_token(user), user=user)


@router.post("/auth/login", response_model=AuthResponse)
def login(payload: AuthRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return AuthResponse(token=create_token(user), user=user)


@router.get("/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/analyze", response_model=AnalysisReportOut)
async def analyze(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalysisReport:
    if len(job_description.strip()) < 40:
        raise HTTPException(status_code=400, detail="Paste a complete job description before generating a report.")

    job_role = db.query(JobRole).filter(JobRole.title == "JD-Based Analysis").first()
    if not job_role:
        job_role = JobRole(
            title="JD-Based Analysis",
            description="Universal analysis profile generated directly from the pasted job description.",
            skills={"must_have": [], "good_to_have": []},
        )
        db.add(job_role)
        db.flush()

    file_path = await save_upload(resume)
    resume_text = extract_text(file_path)
    analysis = analyze_resume(resume_text, job_description)

    resume_record = Resume(
        user_id=current_user.id,
        original_filename=resume.filename or file_path.name,
        file_path=str(file_path),
        extracted_text=resume_text,
        extracted_skills=analysis["extracted_skills"],
    )
    db.add(resume_record)
    db.flush()

    report = AnalysisReport(
        user_id=current_user.id,
        resume_id=resume_record.id,
        job_role_id=job_role.id,
        resume_score=analysis["resume_score"],
        semantic_score=analysis["semantic_score"],
        ats_score=analysis["ats_score"],
        career_readiness_score=analysis["career_readiness_score"],
        jd_match_score=analysis["jd_match_score"],
        target_title=analysis["target_title"],
        job_description=job_description,
        jd_requirements=analysis["jd_requirements"],
        matched_skills=analysis["matched_skills"],
        missing_skills=analysis["missing_skills"],
        optional_matches=analysis["optional_matches"],
        recommendations=analysis["recommendations"],
        score_breakdown=analysis["score_breakdown"],
        skill_evidence=analysis["skill_evidence"],
        ats_findings=analysis["ats_findings"],
        improvement_suggestions=analysis["improvement_suggestions"],
        jd_matched_skills=analysis["jd_matched_skills"],
        jd_missing_skills=analysis["jd_missing_skills"],
        sections_detected=analysis["sections_detected"],
    )
    db.add(report)
    db.flush()

    for item in analysis["recommendations"]:
        db.add(
            RoadmapItem(
                report_id=report.id,
                skill=item["skill"],
                week=item["week"],
                task=item["task"],
                project_idea=item["project_idea"],
                priority=item.get("priority", "medium"),
                estimated_hours=item.get("estimated_hours", 4),
                resources=item.get("resources", []),
                checklist=item.get("checklist", []),
            )
        )

    db.commit()

    return get_report_or_404(report.id, db)


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardSummary:
    reports = (
        db.query(AnalysisReport)
        .options(joinedload(AnalysisReport.job_role), joinedload(AnalysisReport.roadmap_items))
        .filter(AnalysisReport.user_id == current_user.id)
        .order_by(AnalysisReport.created_at.desc())
        .limit(12)
        .all()
    )
    latest = reports[0] if reports else None
    roadmap_items = latest.roadmap_items if latest else []
    completed = sum(1 for item in roadmap_items if item.status == "completed")

    totals = {
        "reports": len(reports),
        "roadmap_items": len(roadmap_items),
        "roadmap_completed": completed,
        "roadmap_progress": round(completed / len(roadmap_items) * 100, 1) if roadmap_items else 0,
        "best_resume_score": max((report.resume_score for report in reports), default=0),
        "latest_missing_skills": len(latest.missing_skills) if latest else 0,
    }

    history = [
        DashboardHistoryItem(
            id=report.id,
            role=report.target_title or report.job_role.title,
            resume_score=report.resume_score,
            ats_score=report.ats_score or 0,
            career_readiness_score=report.career_readiness_score or 0,
            created_at=report.created_at,
        )
        for report in reports
    ]

    return DashboardSummary(latest_report=latest, history=history, totals=totals)


@router.get("/reports", response_model=list[AnalysisReportOut])
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AnalysisReport]:
    return (
        db.query(AnalysisReport)
        .options(joinedload(AnalysisReport.job_role), joinedload(AnalysisReport.roadmap_items))
        .filter(AnalysisReport.user_id == current_user.id)
        .order_by(AnalysisReport.created_at.desc())
        .limit(20)
        .all()
    )


@router.get("/reports/{report_id}", response_model=AnalysisReportOut)
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalysisReport:
    return get_report_or_404(report_id, db, current_user.id)


@router.patch("/roadmap-items/{item_id}", response_model=RoadmapItemOut)
def update_roadmap_item(
    item_id: int,
    payload: RoadmapStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RoadmapItem:
    allowed_statuses = {"not_started", "in_progress", "completed"}
    if payload.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid roadmap status.")

    item = db.get(RoadmapItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Roadmap item not found.")
    report = db.get(AnalysisReport, item.report_id)
    if not report or report.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Roadmap item not found.")

    item.status = payload.status
    db.commit()
    db.refresh(item)
    return item


def get_report_or_404(report_id: int, db: Session, user_id: int | None = None) -> AnalysisReport:
    filters = [AnalysisReport.id == report_id]
    if user_id is not None:
        filters.append(AnalysisReport.user_id == user_id)

    report = (
        db.query(AnalysisReport)
        .options(joinedload(AnalysisReport.job_role), joinedload(AnalysisReport.roadmap_items))
        .filter(*filters)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Analysis report not found.")
    return report
