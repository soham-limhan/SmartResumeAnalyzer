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
| **AI Engine** | Ollama (custom `resume-analyzer` model) |
| **Text Extraction** | PyMuPDF (PDF) + python-docx (DOCX) |

## Features

- 📄 Upload PDF/DOCX resumes with drag-and-drop
- 📊 Animated ATS score visualization (circular meter)
- 🎯 Missing skill detection with severity tags
- 💡 AI-generated improvement suggestions
- 🔍 Resume keyword frequency analysis with charts
- 👨‍💼 Recruiter-perspective feedback
- ✨ AI-generated professional summary
- ❓ Tailored interview question generation
- 📈 Skill proficiency heatmap + radar chart
- 📋 Resume-job description matching
- 📥 Export analysis reports (JSON/Text)
- 🌗 Dark/Light mode toggle
- 📱 Fully responsive (mobile, tablet, desktop)
- 🎨 Glassmorphism UI with animated gradients

## Quick Start

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **Ollama** installed and running

### 1. Create the AI Model

```bash
cd backend
ollama create resume-analyzer -f Modelfile
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python run.py
```

The API will be available at `http://localhost:8000`.

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Project Structure

```
SmartResume/
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── ui/           # ShadCN components
│   │   │   ├── layout/       # Sidebar, Header
│   │   │   └── shared/       # Particles, GlassCard, etc.
│   │   ├── pages/            # Route pages
│   │   ├── context/          # Theme provider
│   │   └── lib/              # API client, utils
│   └── ...
├── backend/                   # FastAPI
│   ├── app/
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── models/           # Pydantic schemas
│   │   └── utils/            # Prompt templates
│   ├── Modelfile             # Ollama model config
│   └── requirements.txt
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload` | Upload resume + get AI analysis |
| `POST` | `/api/upload` | Upload resume + job desc for matching |
| `GET` | `/api/history` | List all past analyses |
| `GET` | `/api/history/:id` | Get specific analysis |
| `DELETE` | `/api/history/:id` | Delete analysis |
| `GET` | `/api/export/:id` | Export analysis report |
| `GET` | `/api/health` | Health check + Ollama status |
