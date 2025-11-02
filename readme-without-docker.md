# 🚀 Running Agile Tools Without Docker

## Prerequisites

### Required Software

1. **Python 3.11+**
    - Windows: https://www.python.org/downloads/
    - Mac: `brew install python@3.11`
    - Linux: `sudo apt install python3.11 python3-pip`

2. **Node.js 18+**
    - Download: https://nodejs.org/
    - Or use nvm: `nvm install 18`

3. **Git** (optional)
    - https://git-scm.com/downloads

## 📁 Project Structure

Create this structure:

## 🐍 Backend Setup (Python/FastAPI)

### 1. . Setup Python Virtual Environment

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1

# If you get execution policy error:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Mac/Linux:**
```bash
python -m venv .venv
source .venv/bin/activate  # Windows : .venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Start Backend Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**✅ Backend should now be running on:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

Keep this terminal open!

## 🎨 Frontend Setup (Vue.js)

Open a **NEW terminal window**

### 1. Update Configuration for Local Development

**frontend/vite.config.js** - Update to:
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true
      }
    }
  }
})
```

**frontend/src/App.vue** - Update axios configuration (around line 30):
```javascript
import axios from 'axios';

export default {
  // ... other code ...
  setup() {
    const currentView = ref('poker');
    const user = ref(null);

    // Configure axios for local development
    axios.defaults.baseURL = '/api'; // Use proxy
    axios.defaults.headers.common['x-auth-user'] = 'local-user'; // Your username

    // ... rest of the code ...
  }
};
```

### 4. Install Dependencies

```bash
cd frontend
npm install
```

### 5. Start Frontend Dev Server

```bash
npm run dev
```

**✅ Frontend should now be running on:**
- http://localhost:5173

## 🎯 Access the Application

Open your browser and go to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🐛 Troubleshooting

### Backend Issues

**Error: "Module not found"**
```bash
# Make sure virtual environment is activated
# Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Error: "Port 8000 already in use"**
```bash
# Windows - Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID_number> /F