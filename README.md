# Site Path Search

A web application for analyzing website links and taking screenshots.

## Running the Backend (FastAPI)

### Windows
```bash
cd python
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Unix/Linux/macOS
```bash
cd python
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at `http://localhost:8000`

## Running the Frontend (Svelte)

```bash
cd svelte
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in the terminal)

## Development Setup

### Backend Dependencies
```bash
cd python
pip install -r requirements.txt
```

### Frontend Dependencies
```bash
cd svelte
npm install
```

## API Endpoints

- `GET /links?url=<website_url>` - Analyze links on a website
- `POST /screenshot` - Take a screenshot of a website
- `GET /screenshot?url=<website_url>` - Take a screenshot (GET method)
- `GET /health` - Health check endpoint
