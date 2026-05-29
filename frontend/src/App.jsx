import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Download,
  FileText,
  FileCheck2,
  Gauge,
  History,
  Layers3,
  MessageSquareText,
  Loader2,
  LockKeyhole,
  LogIn,
  LogOut,
  Moon,
  Radar,
  Route,
  SearchCheck,
  ShieldCheck,
  Sun,
  Target,
  Upload,
  UserRoundCheck,
  UserPlus,
  Video,
} from "lucide-react";

import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Progress } from "./components/ui/progress";
import { cn } from "./lib/utils";

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "" : "http://localhost:8000");

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "roadmap", label: "Roadmap", icon: BookOpenCheck },
  { id: "skills", label: "Skills", icon: Layers3 },
  { id: "job", label: "Job Match", icon: Target },
  { id: "history", label: "History", icon: History },
];

const TRUST_BADGES = [
  { label: "ATS Friendly", icon: ShieldCheck },
  { label: "Role Matching", icon: Target },
  { label: "Skill Gap Detection", icon: Radar },
  { label: "Personalized Roadmap", icon: Route },
];

const FEATURE_CARDS = [
  { title: "Resume Parsing", icon: FileText, text: "Extract sections, projects, skills, links, and proof signals from uploaded resumes." },
  { title: "Job Description Analysis", icon: Target, text: "Paste any job description and detect required tools, keywords, and role expectations." },
  { title: "Skill Gap Detection", icon: Radar, text: "Compare resume evidence against role and JD requirements with clear priority gaps." },
  { title: "Match Score", icon: Gauge, text: "Show resume, ATS, job description, and readiness scores in one report." },
  { title: "Missing Skills", icon: Layers3, text: "Separate matched, missing, weak, optional, and critical skills for fast decision-making." },
  { title: "Personalized Roadmap", icon: BookOpenCheck, text: "Create weekly modules with checklists, hours, resources, and portfolio tasks." },
  { title: "ATS Optimization", icon: ShieldCheck, text: "Detect missing links, metrics, sections, keywords, and resume quality issues." },
  { title: "Interview Preparation", icon: ClipboardCheck, text: "Turn weak skills into practice modules, project tasks, and interview checkpoints." },
];

const MOCK_ROADMAP = [
  { week: 1, skill: "Learn fundamentals", task: "Master missing skill basics and update notes.", priority: "high", hours: 5 },
  { week: 2, skill: "Build mini project", task: "Create a practical role-focused implementation.", priority: "high", hours: 8 },
  { week: 3, skill: "Practice interview questions", task: "Prepare answers using project evidence.", priority: "medium", hours: 4 },
  { week: 4, skill: "Add project to resume", task: "Write metrics, GitHub link, and impact bullets.", priority: "medium", hours: 3 },
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Upload & parse resume",
    text: "Upload your resume and extract sections, skills, projects, links, and measurable proof from the file.",
    tags: ["Resume file", "Section scan", "Skill extraction"],
    icon: FileText,
  },
  {
    step: "02",
    title: "Compare with target role",
    text: "Choose a job role and paste the job description. The system compares exact requirements with your current evidence.",
    tags: ["Role match", "JD keywords", "Gap score"],
    icon: SearchCheck,
    featured: true,
  },
  {
    step: "03",
    title: "Review report",
    text: "Read the match score, ATS score, critical skills, weak skills, and resume improvement suggestions in one report.",
    tags: ["Match score", "ATS score", "Suggestions"],
    icon: FileCheck2,
  },
  {
    step: "04",
    title: "Follow roadmap",
    text: "Use the weekly checklist to learn missing concepts, build proof projects, and prepare interview answers.",
    tags: ["Weekly plan", "Checklist", "Resources"],
    icon: Route,
  },
  {
    step: "05",
    title: "Track progress",
    text: "Save reports, update roadmap status, and compare your readiness across different roles over time.",
    tags: ["Saved reports", "Progress", "History"],
    icon: BarChart3,
  },
];

const TYPEWRITER_WORDS = ["Job-Ready Resume", "AI Engineer Profile", "Interview Roadmap", "ATS-Friendly Resume"];

const PARTICLES = Array.from({ length: 42 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  top: `${(index * 61) % 92}%`,
  size: `${2 + (index % 4)}px`,
  delay: `${(index % 9) * 0.35}s`,
  duration: `${5 + (index % 5)}s`,
  color: index % 3 === 0 ? "rgba(34,211,238,0.75)" : index % 3 === 1 ? "rgba(96,165,250,0.72)" : "rgba(129,140,248,0.6)",
}));

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("skillbridge_theme") || "dark");
  const [token, setToken] = useState(() => localStorage.getItem("skillbridge_token") || "");
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("skillbridge_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("skillbridge_theme", theme);
  }, [theme]);

  useEffect(() => {
    fetch(`${API_URL}/api/job-roles`)
      .then((response) => {
        if (!response.ok) throw new Error("Backend is not responding.");
        return response.json();
      })
      .then((data) => {
        setRoles(data);
        if (data.length > 0) setSelectedRoleId(String(data[0].id));
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!token) return;
    loadDashboard();
  }, [token]);

  const selectedRole = useMemo(
    () => roles.find((role) => String(role.id) === String(selectedRoleId)),
    [roles, selectedRoleId],
  );

  async function authFetch(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      signOut();
      throw new Error("Session expired. Please sign in again.");
    }

    return response;
  }

  async function loadDashboard(nextReport = null) {
    setDashboardLoading(true);
    try {
      const response = await authFetch("/api/dashboard");
      if (!response.ok) throw new Error("Could not load dashboard.");
      const data = await response.json();
      setDashboard(data);
      setReport(nextReport || data.latest_report);
      if (data.latest_report?.job_role?.id) setSelectedRoleId(String(data.latest_report.job_role.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDashboardLoading(false);
    }
  }

  function handleAuth(authData) {
    localStorage.setItem("skillbridge_token", authData.token);
    localStorage.setItem("skillbridge_user", JSON.stringify(authData.user));
    setToken(authData.token);
    setUser(authData.user);
    setError("");
  }

  function signOut() {
    localStorage.removeItem("skillbridge_token");
    localStorage.removeItem("skillbridge_user");
    setToken("");
    setUser(null);
    setDashboard(null);
    setReport(null);
    setActiveTab("overview");
  }

  async function handleAnalyze(event) {
    event.preventDefault();
    setError("");

    if (!resumeFile) {
      setError("Choose a resume file first.");
      return;
    }

    if (!selectedRoleId) {
      setError("Choose a target job role.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("role_id", selectedRoleId);
    formData.append("job_description", jobDescription);

    setLoading(true);
    try {
      const response = await authFetch("/api/analyze", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Resume analysis failed.");

      setReport(data);
      setActiveTab("overview");
      await loadDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateRoadmapStatus(itemId, status) {
    if (!report) return;

    const response = await authFetch(`/api/roadmap-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setError("Could not update roadmap progress.");
      return;
    }

    const updated = await response.json();
    const nextReport = {
      ...report,
      roadmap_items: report.roadmap_items.map((item) => (item.id === updated.id ? updated : item)),
    };
    setReport(nextReport);
    await loadDashboard(nextReport);
  }

  async function openReport(reportId) {
    const response = await authFetch(`/api/reports/${reportId}`);
    if (!response.ok) {
      setError("Could not open that report.");
      return;
    }
    const data = await response.json();
    setReport(data);
    setActiveTab("overview");
  }

  const toggleTheme = () => setTheme((value) => (value === "dark" ? "light" : "dark"));

  if (!token) {
    return <LandingPage onAuth={handleAuth} roles={roles} theme={theme} onThemeToggle={toggleTheme} />;
  }

  return (
    <AppBackground>
      <header className="sticky top-0 z-40 px-3 pt-3">
        <div className="container flex h-16 items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 px-4 shadow-soft backdrop-blur-2xl">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-2 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur-xl sm:flex">
              <LockKeyhole className="h-4 w-4 text-emerald-500" />
              {user?.name || "Student"}
            </div>
            <Button variant="secondary" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 lg:py-8">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <Badge variant="slate" className="mb-3">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Dashboard
            </Badge>
            <h1 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              Welcome back, {user?.name?.split(" ")[0] || "student"}.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Upload a resume, compare it with a job description, and track the skills still left to improve.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
            <MiniMetric label="Reports" value={dashboard?.totals?.reports ?? 0} />
            <MiniMetric label="Best score" value={Math.round(dashboard?.totals?.best_resume_score ?? 0)} />
            <MiniMetric label="Roadmap" value={`${Math.round(dashboard?.totals?.roadmap_progress ?? 0)}%`} />
          </div>
        </motion.section>

        {error && <ErrorState message={error} onDismiss={() => setError("")} />}

        <div className="grid gap-10 xl:grid-cols-[360px_minmax(0,1fr)]">
          <AnalyzerPanel
            roles={roles}
            selectedRole={selectedRole}
            selectedRoleId={selectedRoleId}
            setSelectedRoleId={setSelectedRoleId}
            resumeFile={resumeFile}
            setResumeFile={setResumeFile}
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            loading={loading}
            onAnalyze={handleAnalyze}
          />

          <section className="min-w-0">
            {dashboardLoading ? (
              <DashboardSkeleton />
            ) : report ? (
              <DashboardView
                activeTab={activeTab}
                dashboard={dashboard}
                report={report}
                setActiveTab={setActiveTab}
                onOpenReport={openReport}
                onStatusChange={updateRoadmapStatus}
              />
            ) : (
              <EmptyDashboard />
            )}
          </section>
        </div>
      </main>
    </AppBackground>
  );
}

function LandingPage({ onAuth, roles, theme, onThemeToggle }) {
  const [mode, setMode] = useState("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const authRef = useRef(null);
  const demoRef = useRef(null);

  function scrollToAuth(nextMode = "signup") {
    setMode(nextMode);
    authRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function submitAuth(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/${mode === "signup" ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || "Authentication failed.");
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppBackground>
      <LandingHeader theme={theme} onThemeToggle={onThemeToggle} onSignIn={() => scrollToAuth("login")} />

      <main className="pb-16">
        <section className="relative overflow-hidden">
          <ParticleField />
          <div className="container grid min-h-[calc(100vh-5.5rem)] items-center gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_660px]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <Badge variant="violet" className="mb-5 border-blue-300/30 bg-blue-500/10 text-blue-200">
              <FileText className="h-3.5 w-3.5" />
              Career readiness
            </Badge>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.36em] text-blue-500 dark:text-blue-300">
              SkillBridge AI
            </p>
            <h1 className="max-w-4xl text-[clamp(3rem,6vw,4.8rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              <span className="block whitespace-nowrap">We Prepare Your</span>
              <span className="block min-h-[1.15em] whitespace-nowrap bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-300 bg-clip-text text-[clamp(2rem,2.9vw,3.35rem)] text-transparent">
                <TypewriterWords words={TYPEWRITER_WORDS} />
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Analyze your resume against any job description, discover missing skills, and get a personalized roadmap
              to become job-ready.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="violet" onClick={() => scrollToAuth("signup")}>
                Analyze My Resume
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => demoRef.current?.scrollIntoView({ behavior: "smooth" })}>
                View Demo
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {TRUST_BADGES.map((badge) => {
                const Icon = badge.icon;
                return (
                  <Badge key={badge.label} variant="slate">
                    <Icon className="h-3.5 w-3.5" />
                    {badge.label}
                  </Badge>
                );
              })}
            </div>
          </motion.div>

          <HeroVisual />
          </div>
        </section>

        <TechStrip />

        <DashboardPresentation sectionRef={demoRef} onStart={() => scrollToAuth("signup")} />

        <ProcessSection />

        <section id="features" className="container py-20">
          <SectionHeader
            eyebrow="Core features"
            title="Everything needed to improve a resume."
            description="The interface is designed around actual workflows: analyze, understand, improve, and track."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_CARDS.map((feature, index) => (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.035 }}
                key={feature.title}
              >
                <Card className="h-full hover:-translate-y-1 hover:border-indigo-400/40 hover:shadow-glow">
                  <CardHeader>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-muted">
                      <feature.icon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.text}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section ref={authRef} className="container flex justify-center py-20">
          <AuthPanel
            mode={mode}
            setMode={setMode}
            form={form}
            setForm={setForm}
            loading={loading}
            error={error}
            submitAuth={submitAuth}
          />
        </section>
      </main>
    </AppBackground>
  );
}

function LandingHeader({ theme, onThemeToggle, onSignIn }) {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className="container flex h-16 items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 shadow-soft backdrop-blur-2xl">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
          <a className="transition hover:text-foreground" href="#dashboard-preview">Dashboard</a>
          <a className="transition hover:text-foreground" href="#process">Process</a>
          <a className="transition hover:text-foreground" href="#features">Features</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          <Button variant="secondary" size="sm" onClick={onSignIn}>
            <LogIn className="h-4 w-4" />
            Sign in
          </Button>
        </div>
      </div>
    </header>
  );
}

function TypewriterWords({ words }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [letterCount, setLetterCount] = useState(words[0].length);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    const complete = letterCount === currentWord.length;
    const empty = letterCount === 0;
    const delay = complete && !deleting ? 1200 : deleting ? 38 : 72;

    const timer = window.setTimeout(() => {
      if (!deleting && complete) {
        setDeleting(true);
        return;
      }

      if (deleting && empty) {
        setDeleting(false);
        setWordIndex((index) => (index + 1) % words.length);
        return;
      }

      setLetterCount((count) => count + (deleting ? -1 : 1));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [deleting, letterCount, wordIndex, words]);

  return (
    <span className="typewriter-copy inline-flex whitespace-nowrap tracking-normal">
      {words[wordIndex].slice(0, letterCount)}
      <span className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-1 bg-blue-300 animate-caret" />
    </span>
  );
}

function ParticleField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((particle, index) => (
        <span
          className="hero-particle"
          key={index}
          style={{
            "--x": particle.left,
            "--y": particle.top,
            "--size": particle.size,
            "--delay": particle.delay,
            "--duration": particle.duration,
            "--particle-color": particle.color,
          }}
        />
      ))}
    </div>
  );
}

function TechStrip() {
  const signals = ["Python", "NLP", "FastAPI", "SQL", "Docker", "Vector DB", "MLOps", "ATS Keywords", "Projects", "Metrics"];

  return (
    <section className="border-y border-border/70 bg-card/35 py-7 backdrop-blur-xl">
      <div className="container">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Signals checked</p>
          <p className="text-sm text-muted-foreground">Resume evidence, JD keywords, and project proof.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {signals.map((signal) => (
            <Badge key={signal} variant="slate" className="px-4 py-2">
              {signal}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPresentation({ sectionRef, onStart }) {
  const features = [
    {
      title: "Live report progress",
      text: "Track match score, ATS readiness, and role alignment as the report updates.",
      icon: Gauge,
    },
    {
      title: "Saved resumes & reports",
      text: "Compare older reports and see whether your profile is improving.",
      icon: FileCheck2,
    },
    {
      title: "Roadmap checklist",
      text: "Turn missing skills into weekly modules, project tasks, and learning steps.",
      icon: ClipboardCheck,
    },
    {
      title: "Interview preparation",
      text: "Practice answers based on your weak skills and project evidence.",
      icon: MessageSquareText,
    },
    {
      title: "Progress notifications",
      text: "Know what changed, what is pending, and what should be done next.",
      icon: Bell,
    },
  ];

  return (
    <section id="dashboard-preview" ref={sectionRef} className="container py-8">
      <div className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-3 shadow-glow backdrop-blur-2xl md:p-4">
        <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div className="p-1 md:p-2">
            <Badge variant="violet" className="mb-3 border-blue-400/20 bg-blue-500/10 text-blue-300">
              Student dashboard
            </Badge>
            <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-white md:text-[2.15rem]">
              Your profile, <span className="text-blue-400">your control</span>
            </h2>
            <p className="mt-2 max-w-xl text-xs leading-6 text-zinc-400">
              Every student gets a clean dashboard to track reports, missing skills, roadmap tasks, saved history,
              and interview preparation without feeling overloaded.
            </p>

            <div className="mt-5 grid gap-2">
              {features.map((feature) => (
                <DashboardFeatureRow key={feature.title} {...feature} />
              ))}
            </div>

            <Button className="mt-5 w-full shadow-lg shadow-blue-500/25" variant="violet" onClick={onStart}>
              Start Analysis
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          <DashboardBrowserPreview />
        </div>
      </div>
    </section>
  );
}

function DashboardFeatureRow({ title, text, icon: Icon }) {
  return (
    <div
      className="group grid grid-cols-[40px_minmax(0,1fr)] gap-2.5 rounded-2xl border border-transparent p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.055] hover:shadow-[0_0_42px_rgba(37,99,235,0.14)]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-400 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-blue-400 group-hover:to-cyan-300 group-hover:text-zinc-950">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="text-[13px] font-semibold text-white">{title}</h3>
        <p className="mt-1 text-[11px] leading-4 text-zinc-500">{text}</p>
      </div>
    </div>
  );
}

function DashboardBrowserPreview() {
  const statCards = [
    { label: "Status", value: "Active", detail: "On track", tone: "text-emerald-400", icon: UserRoundCheck },
    { label: "Match", value: "82%", detail: "Ready score", tone: "text-blue-400", icon: Gauge },
    { label: "Tasks", value: "18/24", detail: "75% done", tone: "text-blue-400", icon: ClipboardCheck },
    { label: "Next review", value: "Today", detail: "4:00 PM", tone: "text-pink-400", icon: CalendarClock },
  ];

  const progress = [
    ["Resume keywords", 100, "bg-emerald-400"],
    ["Project evidence", 85, "bg-blue-400"],
    ["Backend deployment", 70, "bg-sky-400"],
    ["MLOps basics", 40, "bg-amber-400"],
    ["Mock interview", 10, "bg-zinc-400"],
  ];

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#080910] shadow-2xl">
      <div className="flex items-center gap-2.5 border-b border-white/10 bg-white/[0.055] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="ml-3 flex-1 rounded-lg bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-zinc-500">
          app.skillbridge.ai/my-dashboard
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3" key={card.label}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-500">{card.label}</p>
                  <Icon className={cn("h-4 w-4", card.tone)} />
                </div>
                <p className="text-xl font-semibold text-white">{card.value}</p>
                <p className={cn("mt-2 text-xs font-semibold", card.tone)}>{card.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-300">Overall Progress</p>
            <p className="text-sm font-semibold text-emerald-400">75%</p>
          </div>
          <Progress className="mb-4" value={75} indicatorClassName="bg-emerald-400" />
          <div className="grid gap-2">
            {progress.map(([label, value, color]) => (
              <ProgressRow key={label} label={label} value={value} color={color} />
            ))}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Your roadmap</p>
            <div className="flex flex-wrap gap-2">
              <TeamPill initials="PY" name="Python" role="Strong" tone="bg-blue-500" />
              <TeamPill initials="DB" name="Vector DB" role="Learning" tone="bg-violet-500" />
              <TeamPill initials="ML" name="MLOps" role="Pending" tone="bg-emerald-500" />
            </div>
          </div>

          <div className="grid gap-2">
            <DashboardAction icon={Video} label="Mock Interview" />
            <DashboardAction icon={MessageSquareText} label="Ask Mentor" />
            <DashboardAction icon={CreditCard} label="View Score" />
            <DashboardAction icon={Download} label="Download Report" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, color }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_96px_38px] items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", color)} />
        <p className="truncate text-xs font-medium text-zinc-400">{label}</p>
      </div>
      <Progress value={value} indicatorClassName={color} />
      <p className="text-right text-xs font-semibold text-zinc-500">{value}%</p>
    </div>
  );
}

function TeamPill({ initials, name, role, tone }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/[0.055] px-2.5 py-2">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white", tone)}>
        {initials}
      </div>
      <div>
        <p className="text-xs font-semibold text-zinc-200">{name}</p>
        <p className="text-xs text-zinc-500">{role}</p>
      </div>
    </div>
  );
}

function DashboardAction({ icon: Icon, label }) {
  return (
    <button className="inline-flex h-10 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.045] px-3 text-xs font-semibold text-zinc-400 transition hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-white">
      <Icon className="h-4 w-4 text-blue-400" />
      {label}
    </button>
  );
}

function ProcessSection() {
  const [activeStep, setActiveStep] = useState("02");

  return (
    <section id="process" className="container py-24">
      <div className="mx-auto mb-14 max-w-3xl text-center">
          <Badge variant="violet" className="mb-4">
            <Route className="h-3.5 w-3.5" />
            Transparent process
          </Badge>
        <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            From resume upload to job-ready roadmap.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">
            The flow is built for final-year students: understand the gap, fix the evidence, and track completion
            without digging through crowded screens.
        </p>
      </div>

      <div className="process-timeline relative mx-auto max-w-6xl">
        {PROCESS_STEPS.map((item, index) => (
          <ProcessTimelineItem
            key={item.step}
            item={item}
            index={index}
            isActive={activeStep === item.step}
            onActivate={() => setActiveStep(item.step)}
          />
        ))}
      </div>
    </section>
  );
}

function ProcessTimelineItem({ item, index, isActive, onActivate }) {
  const Icon = item.icon;
  const alignRight = index % 2 === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45 }}
      className={cn("relative grid py-10 pl-16 lg:grid-cols-2 lg:pl-0", alignRight ? "lg:pl-16" : "lg:pr-16")}
    >
      <div className={cn("hidden lg:block", alignRight ? "lg:col-start-1" : "lg:col-start-2")} />
      <div
        className={cn(
          "relative cursor-pointer rounded-[1.4rem] border border-white/10 bg-zinc-950/65 p-6 shadow-soft backdrop-blur-xl transition-all duration-300 hover:border-blue-300/25 hover:bg-blue-950/15",
          isActive && "border-blue-400/35 bg-blue-950/25 shadow-[0_0_80px_rgba(37,99,235,0.20)]",
          alignRight ? "lg:col-start-2" : "lg:col-start-1",
        )}
        onClick={onActivate}
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Badge variant="violet">STEP {Number(item.step)}</Badge>
          <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
        </div>
        <p className="leading-7 text-muted-foreground">{item.text}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="slate">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label={`Highlight step ${Number(item.step)}: ${item.title}`}
        aria-pressed={isActive}
        onClick={onActivate}
        className={cn(
          "absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-zinc-950 text-zinc-500 shadow-soft transition-all duration-300 hover:border-cyan-300/45 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 lg:left-1/2 lg:-translate-x-1/2",
          isActive && "h-14 w-14 border-cyan-300/50 bg-cyan-400 text-zinc-950 shadow-[0_0_54px_rgba(34,211,238,0.45)]",
        )}
      >
        <Icon className="h-5 w-5" />
      </button>
    </motion.div>
  );
}

function AuthPanel({ mode, setMode, form, setForm, loading, error, submitAuth }) {
  return (
    <Card className="self-start">
      <CardHeader>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/70 bg-muted/50 p-1">
          <button
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold text-muted-foreground transition-all",
              mode === "signup" && "bg-background text-foreground shadow-sm",
            )}
            type="button"
            onClick={() => setMode("signup")}
          >
            <UserPlus className="h-4 w-4" />
            Sign up
          </button>
          <button
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold text-muted-foreground transition-all",
              mode === "login" && "bg-background text-foreground shadow-sm",
            )}
            type="button"
            onClick={() => setMode("login")}
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
        </div>
        <div className="pt-3">
          <Badge variant="violet" className="mb-3">
            <LockKeyhole className="h-3.5 w-3.5" />
            Secure account
          </Badge>
          <CardTitle className="text-2xl">
            {mode === "signup" ? "Start tracking your readiness" : "Open your dashboard"}
          </CardTitle>
          <CardDescription>
            {mode === "signup"
              ? "Create an account to save reports, scores, roadmap status, and history."
              : "Sign in to continue your saved roadmap and previous analysis."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submitAuth}>
          {mode === "signup" && (
            <FormField label="Name">
              <input
                className="h-11 rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Your name"
              />
            </FormField>
          )}
          <FormField label="Email">
            <input
              className="h-11 rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@example.com"
              required
            />
          </FormField>
          <FormField label="Password">
            <input
              className="h-11 rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Minimum 6 characters"
              required
            />
          </FormField>
          {error && <ErrorState message={error} compact />}
          <Button className="w-full" variant="emerald" size="lg" type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === "signup" ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
            {loading ? "Please wait" : mode === "signup" ? "Create Account" : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AnalyzerPanel({
  roles,
  selectedRole,
  selectedRoleId,
  setSelectedRoleId,
  resumeFile,
  setResumeFile,
  jobDescription,
  setJobDescription,
  loading,
  onAnalyze,
}) {
  return (
    <Card className="xl:sticky xl:top-24">
      <CardHeader>
        <Badge variant="emerald" className="w-fit">
          <FileText className="h-3.5 w-3.5" />
          New report
        </Badge>
        <CardTitle className="text-2xl">Report</CardTitle>
        <CardDescription>Upload your resume and paste a job description to see your score and next steps.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onAnalyze}>
          <FormField label="Target role">
            <select
              className="h-11 rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
          </FormField>

          {selectedRole && (
            <div className="rounded-lg border border-border/70 bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-indigo-500/10 p-2 text-indigo-500">
                  <BriefcaseBusiness className="h-4 w-4" />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{selectedRole.description}</p>
              </div>
            </div>
          )}

          <FormField label="Resume">
            <label className="group flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/35 p-5 text-center transition hover:border-indigo-400/60 hover:bg-indigo-500/5">
              <div className="rounded-lg border border-border/70 bg-background p-3 text-muted-foreground transition group-hover:text-indigo-500">
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                {resumeFile ? resumeFile.name : "Drop or choose PDF, DOCX, or TXT"}
              </span>
              <span className="text-xs text-muted-foreground">PDF, DOCX, or TXT supported.</span>
              <input
                className="sr-only"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
              />
            </label>
          </FormField>

          <FormField label="Job description">
            <textarea
              className="min-h-40 resize-y rounded-lg border border-input bg-background/70 px-3 py-3 text-sm leading-6 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste a job description to detect exact missing skills..."
            />
          </FormField>

          <Button variant="emerald" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
            {loading ? "Analyzing resume" : "Generate report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DashboardView({ activeTab, dashboard, report, setActiveTab, onOpenReport, onStatusChange }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
      <Card>
        <CardContent className="grid gap-6 p-5 md:grid-cols-[132px_minmax(0,1fr)]">
          <CircularScore value={report.career_readiness_score} label="Match" small />
          <div className="self-center">
            <Badge variant="violet" className="mb-3">{report.job_role.title}</Badge>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Report</h2>
            <p className="mt-2 max-w-xl leading-7 text-muted-foreground">
              Your score, skill gaps, and next steps are grouped below.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <InlineStat label="Resume" value={Math.round(report.resume_score)} />
              <InlineStat label="ATS" value={Math.round(report.ats_score)} />
              <InlineStat label="JD match" value={Math.round(report.jd_match_score)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border/70 bg-card/70 p-1 shadow-sm backdrop-blur-xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                activeTab === tab.id && "bg-foreground text-background shadow-sm hover:bg-foreground hover:text-background",
              )}
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && <AnalysisResultPage report={report} />}
      {activeTab === "roadmap" && <RoadmapPage report={report} onStatusChange={onStatusChange} />}
      {activeTab === "skills" && <SkillsPage report={report} />}
      {activeTab === "job" && <JobMatchPage report={report} />}
      {activeTab === "history" && <HistoryPage dashboard={dashboard} onOpenReport={onOpenReport} />}
    </motion.div>
  );
}

function AnalysisResultPage({ report }) {
  const weakSkills = getWeakSkills(report).slice(0, 6);
  const criticalSkills = getCriticalSkills(report).slice(0, 6);
  const ranking = getSkillRanking(report).slice(0, 8);

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Skills overview</CardTitle>
          <CardDescription>Matched skills, missing skills, and weak evidence in a single view.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <SkillBucket title="Matched" skills={report.matched_skills} variant="emerald" />
          <SkillBucket title="Missing" skills={report.missing_skills} variant="warning" />
          <SkillBucket title="Weak" skills={weakSkills.map((skill) => skill.skill)} variant="violet" />
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <PriorityCard criticalSkills={criticalSkills} ranking={ranking} />
        <SuggestionsCard suggestions={report.improvement_suggestions} />
      </div>
    </div>
  );
}

function RoadmapPage({ report, onStatusChange }) {
  const completed = report.roadmap_items.filter((item) => item.status === "completed").length;
  const progress = report.roadmap_items.length ? Math.round((completed / report.roadmap_items.length) * 100) : 0;

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="emerald" className="mb-3">
            <BookOpenCheck className="h-3.5 w-3.5" />
            Timeline roadmap
          </Badge>
          <CardTitle className="text-2xl">Personalized roadmap checklist</CardTitle>
          <CardDescription>Weekly modules with trackable status, resources, and portfolio actions.</CardDescription>
        </div>
        <div className="min-w-56 rounded-lg border border-border/70 bg-muted/40 p-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{progress}% complete</span>
            <span>{completed}/{report.roadmap_items.length}</span>
          </div>
          <Progress className="mt-3" value={progress} />
        </div>
      </CardHeader>
      <CardContent>
        <RoadmapTimeline items={report.roadmap_items} onStatusChange={onStatusChange} />
      </CardContent>
    </Card>
  );
}

function RoadmapTimeline({ items, onStatusChange }) {
  const source = items?.length ? items : MOCK_ROADMAP;

  return (
    <div className="relative grid gap-5 pl-4 before:absolute before:left-[1.15rem] before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-border sm:pl-7">
      {source.map((item, index) => (
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className="relative grid gap-4 rounded-lg border border-border/70 bg-background/70 p-5 shadow-sm backdrop-blur-xl lg:grid-cols-[1fr_160px]"
          key={item.id || `${item.week}-${item.skill}`}
        >
          <div className="absolute -left-4 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold shadow-sm sm:-left-[2.1rem]">
            {item.week}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={item.priority === "high" ? "warning" : "violet"}>Week {item.week}</Badge>
              <Badge variant="slate">{item.estimated_hours || item.hours || 4} hrs</Badge>
              <Badge variant={item.status === "completed" ? "emerald" : "default"}>{item.status || item.priority}</Badge>
            </div>
            <h3 className="mt-3 text-xl font-semibold">{item.skill}</h3>
            <p className="mt-2 leading-7 text-muted-foreground">{item.task}</p>
            {item.project_idea && <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">{item.project_idea}</p>}
            {item.checklist?.length > 0 && (
              <ul className="mt-4 grid gap-2">
                {item.checklist.map((step) => (
                  <li className="flex items-start gap-2 text-sm leading-6 text-muted-foreground" key={step}>
                    <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    {step}
                  </li>
                ))}
              </ul>
            )}
            {item.resources?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.resources.map((resource) => (
                  <a
                    className="rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-indigo-400 hover:text-foreground"
                    href={resource.url}
                    key={resource.label}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {resource.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          {item.id && (
            <select
              className="h-11 rounded-lg border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              value={item.status}
              onChange={(event) => onStatusChange(item.id, event.target.value)}
              aria-label={`Progress for ${item.skill}`}
            >
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          )}
        </motion.article>
      ))}
    </div>
  );
}

function SkillsPage({ report }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <SkillPanel title="Matched skills" skills={report.matched_skills} variant="emerald" />
        <SkillPanel title="Missing skills" skills={report.missing_skills} variant="warning" />
        <SkillPanel title="Optional matches" skills={report.optional_matches} variant="violet" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Skill evidence heatmap</CardTitle>
          <CardDescription>Evidence is stronger when a skill appears in projects, experience, metrics, and outcomes.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {report.skill_evidence.map((item) => (
            <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/35 p-4 md:grid-cols-[1fr_110px_180px_48px]" key={item.skill}>
              <div>
                <p className="font-semibold">{item.skill}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.source}</p>
              </div>
              <Badge variant={item.status === "strong" ? "emerald" : item.status === "missing" ? "warning" : "violet"}>
                {item.status}
              </Badge>
              <Progress value={item.confidence} />
              <p className="text-right font-semibold">{item.confidence}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function JobMatchPage({ report }) {
  const hasJd = report.jd_matched_skills.length > 0 || report.jd_missing_skills.length > 0;

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <CircularScore value={report.jd_match_score} label="JD match" />
          <div className="self-center">
            <Badge variant="violet" className="mb-4">
              <Target className="h-3.5 w-3.5" />
              Job description analysis
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight">
              {hasJd ? "Resume alignment against the pasted JD." : "Paste a job description to unlock JD matching."}
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
              {hasJd
                ? "Detected JD skills are compared against extracted resume evidence so you can tailor your application before applying."
                : "The dashboard will identify required skills, missing JD keywords, and recommended resume improvements."}
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkillPanel title="JD matched skills" skills={report.jd_matched_skills} variant="emerald" />
        <SkillPanel title="JD missing skills" skills={report.jd_missing_skills} variant="warning" />
      </div>
    </div>
  );
}

function HistoryPage({ dashboard, onOpenReport }) {
  const history = dashboard?.history || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent analysis</CardTitle>
        <CardDescription>Open older reports to compare your progress over time.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {history.length ? (
          history.map((item) => (
            <button
              className="grid gap-3 rounded-lg border border-border/70 bg-muted/35 p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-400/50 hover:bg-indigo-500/5 md:grid-cols-[1fr_130px_110px_110px]"
              key={item.id}
              type="button"
              onClick={() => onOpenReport(item.id)}
            >
              <div>
                <p className="font-semibold">{item.role}</p>
                <p className="mt-1 text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <InlineStat label="Resume" value={Math.round(item.resume_score)} />
              <InlineStat label="ATS" value={Math.round(item.ats_score)} />
              <InlineStat label="Ready" value={Math.round(item.career_readiness_score)} />
            </button>
          ))
        ) : (
          <EmptyMini text="No saved reports yet. Generate your first analysis to start tracking progress." />
        )}
      </CardContent>
    </Card>
  );
}

function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.08 }}
      className="hero-panel relative mx-auto w-full max-w-[580px] overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/75 p-5 shadow-glow backdrop-blur-2xl"
    >
      <div className="absolute inset-0 hero-lines" />
      <div className="relative grid gap-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xl">
          <div>
            <p className="text-sm font-semibold text-white">app.skillbridge.ai/report</p>
            <p className="mt-1 text-xs text-zinc-400">Active resume report</p>
          </div>
          <Badge variant="violet">On track</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-blue-300/20 bg-blue-500/10 p-5">
            <p className="text-sm font-semibold text-blue-100">Match score</p>
            <p className="mt-3 text-6xl font-semibold tracking-tight text-white">82%</p>
            <Progress className="mt-4" value={82} indicatorClassName="bg-blue-400" />
            <p className="mt-3 text-xs leading-5 text-blue-100/80">4 focused upgrades before applying.</p>
          </div>

          <div className="grid gap-3">
            {[
              ["ATS readiness", 88],
              ["JD alignment", 74],
              ["Roadmap done", 60],
            ].map(([label, value]) => (
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={label}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-300">{label}</p>
                  <p className="text-sm font-semibold text-blue-200">{value}%</p>
                </div>
                <Progress className="mt-3 h-2" value={value} indicatorClassName="bg-blue-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Priority roadmap</p>
              <Badge variant="slate">4 weeks</Badge>
            </div>
            <CompactRoadmapPreview />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-5">
            <p className="text-sm font-semibold text-white">Missing skills</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Docker", "Vector DB", "MLOps"].map((skill) => (
                <Badge key={skill} variant="warning">{skill}</Badge>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="mt-5 w-full border-white/10 bg-white/10 text-white hover:bg-white/15">
              View report
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CompactRoadmapPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {MOCK_ROADMAP.map((item) => (
        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3" key={item.week}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-200">Week {item.week}</span>
            <span className="text-xs text-zinc-400">{item.hours}h</span>
          </div>
          <p className="mt-3 text-sm font-semibold leading-5 text-white">{item.skill}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyDashboard() {
  return (
    <Card className="min-h-[520px]">
      <CardContent className="flex min-h-[520px] flex-col items-center justify-center p-8 text-center">
        <div className="rounded-lg border border-border/70 bg-muted/40 p-4 text-muted-foreground">
          <FileText className="h-10 w-10" />
        </div>
        <h2 className="mt-6 text-balance text-3xl font-semibold">Create your first report.</h2>
        <p className="mt-3 max-w-md leading-7 text-muted-foreground">
          Upload a resume, select a target role, and paste a job description. The saved report will appear here.
        </p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="h-32 animate-pulse rounded-lg bg-muted" key={index} />
        ))}
      </div>
      <div className="h-[560px] animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

function SkillBucket({ title, skills = [], variant = "slate" }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        <span className="text-xs font-semibold text-muted-foreground">{skills.length}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.length ? (
          skills.map((skill) => (
            <Badge key={skill} variant={variant}>
              {skill}
            </Badge>
          ))
        ) : (
          <Badge variant="slate">None</Badge>
        )}
      </div>
    </div>
  );
}

function PriorityCard({ criticalSkills = [], ranking = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Priorities</CardTitle>
        <CardDescription>Focus on these before applying to similar roles.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Critical skills</p>
          {criticalSkills.length ? (
            <div className="flex flex-wrap gap-2">
              {criticalSkills.map((skill) => (
                <Badge key={skill} variant="warning">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <EmptyMini text="No critical required skills are missing in this report." />
          )}
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-semibold text-muted-foreground">Skill ranking</p>
          {ranking.slice(0, 5).map((skill, index) => (
            <div
              className="grid items-center gap-3 rounded-lg border border-border/70 bg-muted/25 p-3 sm:grid-cols-[28px_1fr_auto]"
              key={skill.skill}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-background text-xs font-semibold">
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{skill.skill}</p>
                <p className="truncate text-sm text-muted-foreground">{skill.source}</p>
              </div>
              <Badge variant={skill.status === "missing" ? "warning" : skill.status === "strong" ? "emerald" : "violet"}>
                {skill.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SuggestionsCard({ suggestions = [] }) {
  const visibleSuggestions = suggestions.slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume suggestions</CardTitle>
        <CardDescription>Small edits that can improve the report.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {visibleSuggestions.length ? (
          visibleSuggestions.map((suggestion) => (
            <div className="rounded-lg border border-border/70 bg-muted/35 p-4" key={suggestion.title}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={suggestion.priority === "high" ? "warning" : "violet"}>{suggestion.priority}</Badge>
                <Badge variant="slate">{suggestion.category}</Badge>
              </div>
              <h4 className="mt-3 font-semibold">{suggestion.title}</h4>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{suggestion.detail}</p>
            </div>
          ))
        ) : (
          <EmptyMini text="No improvement suggestions available for this report." />
        )}
      </CardContent>
    </Card>
  );
}

function SkillPanel({ title, skills = [], variant = "slate", compact = false }) {
  return (
    <Card className={compact ? "shadow-none" : ""}>
      <CardHeader className={compact ? "p-4 pb-2" : undefined}>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn("flex flex-wrap gap-2", compact && "p-4 pt-0")}>
        {skills.length ? (
          skills.map((skill) => (
            <Badge key={skill} variant={variant}>
              {skill}
            </Badge>
          ))
        ) : (
          <Badge variant="slate">None detected</Badge>
        )}
      </CardContent>
    </Card>
  );
}

function CircularScore({ value = 0, label, small = false }) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full bg-[conic-gradient(from_180deg,#6366f1,#8b5cf6,#34d399_var(--score),hsl(var(--muted))_0)] p-2",
        small ? "h-28 w-28" : "h-52 w-52",
      )}
      style={{ "--score": `${Math.max(0, Math.min(100, value))}%` }}
    >
      <div className="grid h-full w-full place-items-center rounded-full bg-card text-center">
        <div>
          <p className={cn("font-semibold tracking-tight", small ? "text-3xl" : "text-5xl")}>{Math.round(value)}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/75 p-4 shadow-sm backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function InlineStat({ label, value }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/35 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Badge variant="violet" className="mb-4">{eyebrow}</Badge>
      <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">{title}</h2>
      <p className="mt-4 leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}

function ErrorState({ message, onDismiss, compact = false }) {
  return (
    <div className={cn("mb-6 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200", compact && "mb-0")}>
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        {onDismiss && (
          <button className="font-semibold text-red-600 dark:text-red-200" type="button" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyMini({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/25 p-5 text-sm leading-6 text-muted-foreground">
      {text}
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <Button variant="secondary" size="icon" onClick={onToggle} aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm">
        <img src="/skillbridge.png" alt="SkillBridge AI" className="h-full w-full object-cover" />
      </div>
      <div>
        <p className="text-sm font-semibold leading-none tracking-tight">SkillBridge AI</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">Resume-to-job analyzer</p>
      </div>
    </div>
  );
}

function AppBackground({ children }) {
  return (
    <div className="aurora-bg relative min-h-screen overflow-x-hidden text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-blue-500/10 to-transparent dark:from-blue-400/[0.08]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function getWeakSkills(report) {
  return (report.skill_evidence || []).filter((skill) => ["weak", "medium"].includes(skill.status));
}

function getCriticalSkills(report) {
  const jdMissing = report.jd_missing_skills || [];
  return [...new Set([...(report.missing_skills || []), ...jdMissing])];
}

function getSkillRanking(report) {
  const weight = { missing: 0, weak: 1, medium: 2, strong: 3 };
  return [...(report.skill_evidence || [])].sort((a, b) => weight[a.status] - weight[b.status] || a.confidence - b.confidence);
}

function scoreLabel(value) {
  if (value >= 80) return "strongly aligned";
  if (value >= 65) return "close to ready";
  if (value >= 45) return "partially ready";
  return "early-stage";
}

export default App;
