from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    resumes: Mapped[list["Resume"]] = relationship(back_populates="user")
    reports: Mapped[list["AnalysisReport"]] = relationship(back_populates="user")


class JobRole(Base):
    __tablename__ = "job_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    skills: Mapped[dict] = mapped_column(JSON, nullable=False)

    reports: Mapped[list["AnalysisReport"]] = relationship(back_populates="job_role")


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    extracted_text: Mapped[str] = mapped_column(Text, nullable=False)
    extracted_skills: Mapped[list] = mapped_column(JSON, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="resumes")
    reports: Mapped[list["AnalysisReport"]] = relationship(back_populates="resume")


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id"), nullable=False)
    job_role_id: Mapped[int] = mapped_column(ForeignKey("job_roles.id"), nullable=False)
    resume_score: Mapped[float] = mapped_column(Float, nullable=False)
    semantic_score: Mapped[float] = mapped_column(Float, nullable=False)
    ats_score: Mapped[float] = mapped_column(Float, default=0)
    career_readiness_score: Mapped[float] = mapped_column(Float, default=0)
    jd_match_score: Mapped[float] = mapped_column(Float, default=0)
    matched_skills: Mapped[list] = mapped_column(JSON, nullable=False)
    missing_skills: Mapped[list] = mapped_column(JSON, nullable=False)
    optional_matches: Mapped[list] = mapped_column(JSON, nullable=False)
    recommendations: Mapped[list] = mapped_column(JSON, nullable=False)
    score_breakdown: Mapped[dict] = mapped_column(JSON, nullable=False)
    skill_evidence: Mapped[list] = mapped_column(JSON, default=list)
    ats_findings: Mapped[dict] = mapped_column(JSON, default=dict)
    improvement_suggestions: Mapped[list] = mapped_column(JSON, default=list)
    jd_matched_skills: Mapped[list] = mapped_column(JSON, default=list)
    jd_missing_skills: Mapped[list] = mapped_column(JSON, default=list)
    sections_detected: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="reports")
    resume: Mapped[Resume] = relationship(back_populates="reports")
    job_role: Mapped[JobRole] = relationship(back_populates="reports")
    roadmap_items: Mapped[list["RoadmapItem"]] = relationship(
        back_populates="report",
        order_by="RoadmapItem.week",
    )


class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("analysis_reports.id"), nullable=False)
    skill: Mapped[str] = mapped_column(String(120), nullable=False)
    week: Mapped[int] = mapped_column(Integer, nullable=False)
    task: Mapped[str] = mapped_column(Text, nullable=False)
    project_idea: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(40), default="medium")
    estimated_hours: Mapped[int] = mapped_column(Integer, default=4)
    resources: Mapped[list] = mapped_column(JSON, default=list)
    checklist: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(40), default="not_started")

    report: Mapped[AnalysisReport] = relationship(back_populates="roadmap_items")
