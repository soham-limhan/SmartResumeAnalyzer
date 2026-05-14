# SmartResume — AI Resume Analyzer

A production-grade AI-powered resume analysis platform with a futuristic dark glassmorphism UI.

![SmartResume](https://img.shields.io/badge/SmartResume-AI%20Resume%20Analyzer-6366f1?style=for-the-badge)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + Tailwind CSS v4 + ShadCN UI |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Backend** | FastAPI + Uvicorn |
| **AI Engine** | Groq Cloud (llama-3.3-70b) / Ollama Local (fallback) |
| **Text Extraction** | PyMuPDF (PDF) + python-docx (DOCX) |

## Features

- Upload PDF/DOCX resumes with drag-and-drop
- Animated ATS score visualization (circular meter)
- Missing skill detection with severity tags
- AI-generated improvement suggestions
- Resume keyword frequency analysis with charts
- Skill heatmap and radar chart visualization
- Potential interview questions
- Recruiter perspective feedback
- PDF report export
- Analysis history
- ETA timer for AI processing

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- Python 3.11+
- (Optional) [Ollama](https://ollama.com) for local AI

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

**Option A — Groq Cloud (recommended):**
```bash
# Create .env file
echo SMARTRESUME_GROQ_API_KEY=gsk_your_key_here > .env
python run.py
```

**Option B — Local Ollama:**
```bash
ollama create resume-analyzer -f Modelfile
python run.py
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — the Vite proxy routes API calls to the backend.

---

## Deployment (Free Tier)

### Frontend — Vercel

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output**: `dist`
   - **Env var**: `VITE_API_URL` = `https://your-backend.onrender.com/api`

### Backend — Render

1. Connect GitHub repo on [render.com](https://render.com)
2. Create **Web Service**:
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Instance**: Free
3. Environment variables:

   | Variable | Value |
   |---|---|
   | `SMARTRESUME_GROQ_API_KEY` | Your Groq API key |
   | `SMARTRESUME_CORS_ORIGINS` | `["https://your-app.vercel.app"]` |
   | `SMARTRESUME_DEBUG` | `false` |

### Get Groq API Key (Free)

1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key
3. Free tier: 14,400 requests/day, llama-3.3-70b

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SMARTRESUME_GROQ_API_KEY` | None | Groq API key (enables cloud AI) |
| `SMARTRESUME_GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model ID |
| `SMARTRESUME_OLLAMA_HOST` | `http://localhost:11434` | Ollama host (local fallback) |
| `SMARTRESUME_OLLAMA_MODEL` | `resume-analyzer` | Ollama model name |
| `SMARTRESUME_CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |
| `SMARTRESUME_DEBUG` | `true` | Debug mode |
| `VITE_API_URL` | `/api` | Backend URL (frontend, production only) |

---

## Project Structure

```
SmartResume/
├── frontend/               # React + Vite SPA
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── lib/            # API client, PDF generator
│   │   └── context/        # Theme context
│   └── package.json
├── backend/                # FastAPI server
│   ├── app/
│   │   ├── main.py         # App entry point
│   │   ├── config.py       # Settings (env vars)
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # AI analyzer, text extractor
│   │   ├── models/         # Pydantic schemas
│   │   └── utils/          # Prompt templates
│   ├── Dockerfile          # Container config
│   ├── Modelfile           # Ollama model definition
│   └── requirements.txt
└── .gitignore
```
