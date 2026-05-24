# WorkGuardAI — PPE Detection System

A full-stack AI-powered workplace safety platform that detects PPE (Personal Protective Equipment) violations in real time using YOLOv8, with a supervisor/worker management dashboard built on React + Supabase.

---

## Features

- **PPE Detection** — YOLOv8 model trained to detect helmets, vests, masks, and violations
- **Supervisor Dashboard** — Manage workers, mark attendance, assign tasks, review inspections, approve leave requests
- **Worker Portal** — View assigned tasks, attendance history, submit leave requests
- **Real-time** — Powered by Supabase (PostgreSQL + Auth + RLS)

---

## Project Structure

```
WorkGuardAI-PPE-Detection/
├── api.py                  # FastAPI backend (PPE detection endpoint)
├── app_streamlit.py        # Streamlit demo app
├── data.yaml               # YOLOv8 dataset config
├── requirements.txt        # Python dependencies
├── runs/
│   └── detect/results/ppe_construction/weights/
│       ├── best.pt         # ✅ Trained YOLOv8 model (use this)
│       └── last.pt         # Last training checkpoint
├── frontend/               # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── supervisor/ # Supervisor workspace pages
│   │   │   └── worker/     # Worker portal pages
│   │   └── lib/supabase.js # Supabase client
│   └── package.json
└── dataset/                # (not included — see below)
```

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/WorkGuardAI-PPE-Detection.git
cd WorkGuardAI-PPE-Detection
```

### 2. Python backend

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy env file and fill in your Supabase credentials
copy .env.example .env

# Run the API
python api.py
```

The API will start at `http://localhost:8000`. The `/detect` endpoint accepts image uploads and returns PPE detection results.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase_schema.sql` in the Supabase SQL editor
3. Copy your project URL and anon key into `.env`

---

## Trained Model

The trained YOLOv8 model is included at:

```
runs/detect/results/ppe_construction/weights/best.pt
```

**No retraining needed.** The model detects:
- ✅ Hardhat, Mask, Safety Vest, Safety Cone, Person, Machinery, Vehicle
- ❌ NO-Hardhat, NO-Mask, NO-Safety Vest (violations)

---

## Dataset

The dataset is not included in this repo due to size. Download it from Roboflow:
- See `dataset/README.roboflow.txt` for the original source

To retrain:
```bash
python -c "from ultralytics import YOLO; model = YOLO('yolov8n.pt'); model.train(data='data.yaml', epochs=100)"
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | YOLOv8 (Ultralytics) |
| Backend API | FastAPI + Python |
| Frontend | React + Vite + TailwindCSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Demo | Streamlit |
