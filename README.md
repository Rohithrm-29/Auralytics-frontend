# Auralytics Frontend

Enterprise React + TypeScript SPA for the Auralytics workforce management platform.

## Tech Stack
- **Framework**: React 18 + TypeScript 5
- **Build Tool**: Vite 5
- **State/Data**: TanStack React Query v5
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS 3 (dark theme)
- **Charts**: Recharts
- **HTTP**: Axios (with auto token refresh)
- **Routing**: React Router v6

---

## Quick Start

### 1. Install
```bash
cd auralytics-frontend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:5000/api/v1
```
For production point this to your deployed backend URL.

### 3. Run Dev Server
```bash
npm run dev
```
Opens at `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## Features by Role

| Feature | HR | Manager | Recruiter | Sr. Designer | Designer |
|---------|----|---------|-----------|----|---------|
| Dashboard | ✅ | ✅ | ✅ | ❌ | ❌ |
| Employees CRUD | ✅ | View | View | View | View self |
| Projects CRUD | ✅ | View | View | View | View |
| Tasks Create | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tasks Update Status | ✅ | ✅ | ✅ | ✅ | ✅ |
| KRA Assign | ✅ | ✅ | ❌ | ❌ | ❌ |
| KRA Approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| Revenue | ✅ | View | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI primitives
│   └── layout/       # App shell, sidebar, notifications
├── pages/            # One file per route
├── services/         # Axios API calls
├── store/            # Auth + Theme context
├── types/            # TypeScript interfaces
└── utils/            # Formatters, constants, helpers
```

---

## Deployment (Netlify)

1. Push repo to GitHub
2. Connect to Netlify → New site from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add env variable: `VITE_API_URL=https://your-api.onrender.com/api/v1`
6. Add `_redirects` file in `public/`:
   ```
   /* /index.html 200
   ```
