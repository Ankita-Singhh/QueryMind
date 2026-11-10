# QueryMind 🧠✨

A modern, full-stack Generative AI chat platform featuring real-time streaming, sliding-window memory management, and a responsive dark glassmorphism interface. Powered by Google Gemini 3.5 Flash.

---

## ⚡ Features

- **Real-Time Streaming**: Low-latency token streaming using Server-Sent Events (SSE).
- **Context Memory**: Sliding-window memory management that retains multi-turn context.
- **Custom Personas**: Switch between General, Software Engineer, Creative, and Analytical modes.
- **Zero-Setup Database**: Runs with MongoDB when available, or an automated in-memory store for instant local testing.
- **Accessible UI**: High-contrast, responsive dark glassmorphism design built with React 19 and Vanilla CSS.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Vanilla CSS3
- **Backend**: Node.js, Express.js, Server-Sent Events (SSE)
- **AI**: Google Gemini API (`gemini-3.5-flash`) via `@google/genai`
- **Auth & Storage**: JWT, bcryptjs, MongoDB (with in-memory fallback)

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Ankita-Singhh/QueryMind.git
cd QueryMind
```

### 2. Configure Backend `.env`
In `backend/.env` (or copy from `backend/.env.example`):
```env
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key_here
```
> *Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).*

### 3. Run Locally

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend (in a second terminal):**
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deployment

- **Backend**: Deploy `backend/` to [Render](https://render.com) or [Railway](https://railway.app) (Build: `npm install`, Start: `npm start`). Add your environment variables in the dashboard.
- **Frontend**: Deploy `frontend/` to [Vercel](https://vercel.com) (Framework: Vite). Set `VITE_API_URL` to your backend URL.

---

## 👩‍💻 Author

**Ankita Singh**  
GitHub: [@Ankita-Singhh](https://github.com/Ankita-Singhh)
