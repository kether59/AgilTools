# 🚀 Démarrage Rapide - Agile Tools

## Installation en 5 minutes

### 1️⃣ Backend (Terminal 1)

```bash
# Installer les dépendances
pip install fastapi uvicorn sqlalchemy pydantic websockets

# Lancer le serveur
python main.py
```

✅ Backend prêt sur http://localhost:8000

### 2️⃣ Frontend (Terminal 2)

```bash
# Créer le projet React avec Vite
npm create vite@latest frontend -- --template react
cd frontend

# Installer les dépendances
npm install
npm install lucide-react

# Installer Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Copier le code App.jsx dans src/App.jsx

# Lancer le dev server
npm run dev
```

✅ Frontend prêt sur http://localhost:5173

### 3️⃣ Configuration Tailwind

Créer `tailwind.config.js`:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Modifier `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 🎯 Test Rapide

### Planning Poker

1. Ouvrez http://localhost:5173
2. Entrez votre nom (ex: "Alice")
3. Cliquez sur "Planning Poker"
4. Créez une session: "Sprint 15 Planning"
5. Copiez le code de session (ex: "abc123xyz")
6. Ouvrez un onglet privé, connectez-vous comme "Bob"
7. Rejoignez avec le code
8. Les deux peuvent maintenant voter !

### Roue de Décision

1. Cliquez sur "Roue de Décision"
2. "Nouvelle configuration"
3. Nom: "Équipe Dev"
4. Items (un par ligne):
   ```
   Alice
   Bob
   Charlie
   Diana
   ```
5. Sauvegardez
6. Cliquez "Lancer la roue"
7. 🎉 Regardez la magie opérer !

## 🔧 Résolution de Problèmes

### ❌ Erreur CORS
**Problème**: `Access-Control-Allow-Origin error`

**Solution**: Vérifiez que le backend autorise CORS:
```python
# Dans main.py - déjà configuré
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OK pour dev, restreindre en prod
    ...
)
```

### ❌ WebSocket ne connecte pas
**Problème**: Les votes ne s'affichent pas en temps réel

**Solution**:
1. Vérifiez que le serveur backend tourne
2. Testez manuellement: `ws://localhost:8000/ws/poker/test?username=test`
3. Regardez la console du navigateur

### ❌ Base de données corrompue
**Problème**: Erreurs SQLAlchemy au démarrage

**Solution**: Supprimez et recréez la DB:
```bash
rm agile_tools.db
python main.py  # Recrée automatiquement
```

### ❌ Port déjà utilisé
**Problème**: `Address already in use`

**Solution**:
```bash
# Trouver le processus
lsof -i :8000  # ou :5173
# Tuer le processus
kill -9 <PID>
```

## 📱 Test Mobile

1. Trouvez votre IP locale:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig | grep inet
   ```

2. Modifiez les URLs dans App.jsx:
   ```javascript
   const API_URL = 'http://192.168.1.XXX:8000/api';
   const WS_URL = 'ws://192.168.1.XXX:8000/ws';
   ```

3. Accédez depuis votre téléphone: `http://192.168.1.XXX:5173`

## 🐳 Déploiement Docker (Bonus)

```dockerfile
# Dockerfile.backend
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY main.py .
CMD ["python", "main.py"]
```

```dockerfile
# Dockerfile.frontend
FROM node:18-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

Lancer avec:
```bash
docker-compose up -d
```

## 🎓 Prochaines Étapes

1. **Personnalisation**: Modifiez les couleurs dans Tailwind
2. **Features**: Ajoutez vos propres fonctionnalités
3. **Production**: Sécurisez l'authentification
4. **Deploy**: Hébergez sur Vercel (frontend) + Railway (backend)

## 💡 Astuces

- **Dev Tools**: Ouvrez la console (F12) pour voir les logs WebSocket
- **State**: React DevTools pour debug le state
- **API**: Testez avec http://localhost:8000/docs (Swagger UI)
- **Hot Reload**: Les deux serveurs ont le hot reload activé

## ⚡ Raccourcis Utiles

```bash
# Backend - tout en un
pip install -r requirements.txt && python main.py

# Frontend - tout en un
npm install && npm run dev

# Reset complet
rm -rf node_modules package-lock.json agile_tools.db
npm install && python main.py
```

---

**Bloqué?** Vérifiez que:
- [ ] Python 3.8+ installé
- [ ] Node.js 16+ installé
- [ ] Les deux serveurs tournent
- [ ] Pas de firewall bloquant les ports
- [ ] Les URLs sont correctes dans le code

**Ça marche?** 🎉 Profitez de vos cérémonies agiles !