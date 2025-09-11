# Arabic Screenplay IDE

محرر السيناريوهات العربي - تطبيق شامل لكتابة وتنسيق السيناريوهات باللغة العربية.

End-to-end web app for Arabic screenplay writing/formatting with advanced AI integration.

## Prereqs
- Node 18+
- npm
- Google Gemini API key (env: `GEMINI_API_KEY`)

## Backend
```bash
cd backend
npm i
npm start
```

Backend runs at [http://localhost:4000](http://localhost:4000)

## Frontend

```bash
cd frontend
npm i
npm run dev
```

Frontend runs at [http://localhost:5173](http://localhost:5173)

### Env

Create `.env` files in both `backend` and `frontend` using the provided `.env.example` templates. The frontend only needs the API base URL:

```
VITE_API_BASE=http://localhost:4000/api
```

All secrets such as `GEMINI_API_KEY` are stored on the backend only.

## Notes

* Tesseract uses Arabic language pack; first run may download data.
* PDF text via `pdf.js-dist`; image-only pages fall back to OCR.
* Paste handler enforces Arabic screenplay rules and inserts structured HTML into Tiptap.
* All LLM requests are proxied through `POST /api/llm/generate` to keep API keys server-side.