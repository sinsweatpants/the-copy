# Arabic Screenplay IDE

End-to-end web app for Arabic screenplay writing/formatting.

## Prereqs
- Node 18+
- npm
- Google Gemini API key (env: `GEMINI_API_KEY`)

## Backend
```bash
cd backend
npm i
npm run seed   # creates sqlite db + seed
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

### Env (frontend)

Create `.env` in `frontend`:

```
VITE_API_BASE=http://localhost:4000/api
VITE_GEMINI_API_KEY=YOUR_KEY
```

## Notes

* Tesseract uses Arabic language pack; first run may download data.
* PDF text via `pdf.js-dist`; image-only pages fall back to OCR.
* Paste handler enforces Arabic screenplay rules and inserts structured HTML into Tiptap.