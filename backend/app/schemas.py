from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class JobRoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    skills: dict


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str


class AuthRequest(BaseModel):
    name: str | None = None
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class RoadmapItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill: str
    week: int
    task: str
    project_idea: str
    priority: str = "medium"
    estimated_hours: int = 4
    resources: list[dict] = Field(default_factory=list)
    checklist: list[str] = Field(default_factory=list)
    status: str


class AnalysisReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resume_score: float
    semantic_score: float
    ats_score: float = 0
    career_readiness_score: float = 0
    jd_match_score: float = 0
    target_title: str = "JD-Based Analysis"
    jd_requirements: dict = Field(default_factory=dict)
    matched_skills: list[str]
    missing_skills: list[str]
    optional_matches: list[str]
    recommendations: list[dict]
    score_breakdown: dict
    skill_evidence: list[dict] = Field(default_factory=list)
    ats_findings: dict = Field(default_factory=dict)
    improvement_suggestions: list[dict] = Field(default_factory=list)
    jd_matched_skills: list[str] = Field(default_factory=list)
    jd_missing_skills: list[str] = Field(default_factory=list)
    sections_detected: dict = Field(default_factory=dict)
    created_at: datetime
    job_role: JobRoleOut
    roadmap_items: list[RoadmapItemOut]


class RoadmapStatusUpdate(BaseModel):
    status: str


class DashboardHistoryItem(BaseModel):
    id: int
    role: str
    resume_score: float
    ats_score: float
    career_readiness_score: float
    created_at: datetime


class DashboardSummary(BaseModel):
    latest_report: AnalysisReportOut | None
    history: list[DashboardHistoryItem]
    totals: dict
