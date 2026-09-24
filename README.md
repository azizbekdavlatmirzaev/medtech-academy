# MedTech Academy

AI-powered training platform for CT equipment operators and biomedical engineers.
Built at the National AI Hackathon, Namangan, 24–27 September 2026.

- **3D CT scanner** — explore the device part by part.
- **Physics-based fault simulator** — real CT artifacts generated from corrupted projection data.
- **AI trainer** — diagnose a faulty device from its images; AI grades and explains.
- **AI tutor** — answers only from course materials, with citations.

See [spec.md](spec.md) for the full specification and progress.

## Run locally

Requirements: Python 3.12+, Node.js 20+.

```bash
cp .env.example .env            # then fill in ANTHROPIC_API_KEY

# API → http://localhost:8000/health
cd api
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt   # macOS/Linux: .venv/bin/pip
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000

# Web → http://localhost:3000
cd web
npm install
npm run dev
```

## Status
Work in progress — see the Phases table in `spec.md`.

## Credits
- 3D model: "Complete CT Scanner for Unity" by HermanMyburgh, [Sketchfab](https://sketchfab.com/3d-models/complete-ct-scanner-for-unity-94093e1938e6436196c3bb5a434b0f58), licensed CC BY 4.0.
