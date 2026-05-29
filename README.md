# SkillBridge AI

Resume-to-job skill gap analyzer for an AIML live project.

The app lets a student upload a resume, choose a target job role, optionally paste a real job description, and receive:

- Extracted resume skills
- Matched and missing skills
- Resume fit score
- ATS readiness score
- Career readiness score
- Job description match score
- Evidence-based skill strength
- Personalized AI-style learning roadmap checklist
- Saved analysis reports and roadmap progress

## Tech Stack

- Frontend: React + Vite
- Backend: FastAPI
- Database: PostgreSQL-ready with SQLAlchemy
- ML/NLP: Python skill extraction + TF-IDF cosine similarity using scikit-learn

## Project Structure

```text
skillbridge-ai/
  backend/
    app/
      api/
      core/
      db/
      services/
      data/
    uploads/
  frontend/
    src/
```

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The backend runs at:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## PostgreSQL Setup

The app can use PostgreSQL through `DATABASE_URL`.

```bash
docker compose up -d db
```

Then set this in `backend/.env`:

```text
DATABASE_URL=postgresql+psycopg://skillbridge:skillbridge@localhost:5432/skillbridge_ai
```

For quick local testing, you can also leave `DATABASE_URL` empty and the backend will use a local SQLite database.

## Product Features

- Dashboard overview with resume, ATS, career readiness, and JD match scores
- Landing page with sign up and sign in
- User-specific dashboard, reports, and roadmap progress
- Resume section parsing for education, skills, projects, experience, certifications, links, and achievements
- Evidence-based skill heatmap showing strong, medium, weak, and missing skills
- Job description analyzer that extracts JD skills and compares them with the resume
- Automated roadmap checklist with weekly tasks, estimated hours, priority, resources, and project ideas
- Resume improvement suggestions based on ATS checks and missing skill evidence
- Analysis history with previous scores and target roles
- Roadmap status tracking: not started, in progress, completed
- PostgreSQL-ready schema with JSON fields for ML output
- Signed-token authentication with password hashing

## Demo Flow

1. Start backend.
2. Start frontend.
3. Create an account or sign in.
4. Upload a PDF, DOCX, or TXT resume.
5. Select a target role.
6. Paste a job description if available.
7. Click Generate AI Roadmap.
8. View the dashboard, skill evidence heatmap, JD match, improvement suggestions, and roadmap checklist.

## Cloud Storage Note

In local development, progress is stored in `backend/skillbridge_dev.db`.

For deployment, use the included PostgreSQL configuration and set `DATABASE_URL` to a hosted database such as Supabase, Neon, Render PostgreSQL, or Railway PostgreSQL. The user accounts, reports, roadmap progress, and analysis history will then be stored in that cloud database.

## Vercel Deployment

This repository includes Vercel Services configuration for a single deployment:

- React/Vite frontend is built from `frontend/`
- FastAPI backend is exposed through `api/index.py`
- API requests use the same domain through `/_/backend/api/...`

Vercel Services is currently configured through `experimentalServices` in `vercel.json`. In the Vercel dashboard, set the project Framework Preset to **Services**.

### Required Vercel Environment Variables

Set these in the Vercel project settings before production deployment:

```text
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE
SECRET_KEY=use-a-long-random-secret
```

Optional variables:

```text
FRONTEND_ORIGIN=https://your-vercel-domain.vercel.app
FRONTEND_ORIGINS=https://your-custom-domain.com,https://your-preview-domain.vercel.app
UPLOAD_DIR=/tmp/skillbridge_uploads
```

If `DATABASE_URL` is not set on Vercel, the backend falls back to `/tmp/skillbridge_dev.db`. That is useful only for testing because serverless `/tmp` storage is not permanent. Use hosted PostgreSQL for real saved user progress.

### Deploy Commands

```bash
npm install -g vercel
vercel
vercel --prod
```

For frontend-only deployment, set the Vercel root directory to `frontend` and set `VITE_API_URL` to the deployed backend URL.
