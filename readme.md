# Agile Tools - Planning Poker & Team Wheel

A containerized application providing two essential agile tools: Planning Poker for estimation and Team Wheel for decision-making.

## Features

### Planning Poker
- Create and join estimation sessions
- Real-time voting with Fibonacci sequence
- Reveal votes simultaneously
- Session persistence with SQLite
- Reset rounds for new estimations

### Team Wheel (Wheel of Decision)
- Create custom wheel configurations
- Animated spinning wheel
- Save configurations for reuse
- Track recent results
- Visual selection with canvas animation

## Tech Stack

- **Backend**: Python FastAPI with SQLAlchemy ORM
- **Frontend**: Vue.js 3 with Composition API + Tailwind CSS
- **Database**: SQLite
- **Container**: Docker & Docker Compose
- **Auth**: OAuth token via x-auth-user header

## Project Structure

```
agile-tools/
├── backend/
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── style.css
│       ├── App.vue
│       └── components/
│           ├── PlanningPoker.vue
│           └── TeamWheel.vue
└── docker-compose.yml
```

## Setup Instructions

### 1. Create Project Structure

```bash
mkdir -p agile-tools/{backend,frontend/src/components}
cd agile-tools
```

### 2. Backend Setup

Create `backend/main.py`, `backend/requirements.txt`, and `backend/Dockerfile` with the provided code.

### 3. Frontend Setup

Create the following files:
- `frontend/package.json`
- `frontend/vite.config.js`
- `frontend/tailwind.config.js`
- `frontend/nginx.conf`
- `frontend/Dockerfile`
- `frontend/index.html`
- `frontend/src/main.js`
- `frontend/src/style.css`
- `frontend/src/App.vue`
- `frontend/src/components/PlanningPoker.vue`
- `frontend/src/components/TeamWheel.vue`

### 4. Docker Compose

Create `docker-compose.yml` at the root level.

### 5. Build and Run

```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 6. Access the Application

- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## OAuth Integration

The application uses the `x-auth-user` header for authentication. To integrate with your OAuth provider:

1. Configure your OAuth provider to pass the username in the `x-auth-user` header
2. Update `frontend/src/App.vue` to retrieve the OAuth token and set the header:

```javascript
// Example: Get username from OAuth token
const token = getOAuthToken(); // Your OAuth implementation
const username = parseTokenForUsername(token);
axios.defaults.headers.common['x-auth-user'] = username;
```

3. For reverse proxy setup (nginx/traefik), forward the header:

```nginx
proxy_set_header X-Auth-User $http_x_auth_user;
```

## API Endpoints

### User Management
- `GET /api/user/me` - Get current user

### Planning Poker
- `POST /api/poker/sessions` - Create session
- `GET /api/poker/sessions/{code}` - Get session details
- `POST /api/poker/sessions/{code}/vote` - Cast vote
- `POST /api/poker/sessions/{code}/reveal` - Reveal votes
- `POST /api/poker/sessions/{code}/reset` - Reset round

### Team Wheel
- `POST /api/wheel/configs` - Create configuration
- `GET /api/wheel/configs` - List user configurations
- `GET /api/wheel/configs/{id}` - Get configuration
- `POST /api/wheel/results` - Save result
- `GET /api/wheel/configs/{id}/results` - Get recent results

## Database

The SQLite database (`agile_tools.db`) is stored in a Docker volume and persists between container restarts.

### Tables:
- `users` - User accounts
- `poker_sessions` - Planning poker sessions
- `poker_votes` - Individual votes
- `wheel_configs` - Wheel configurations
- `wheel_results` - Spin results

## Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create `.env` file for custom configuration:

```env
# Backend
BACKEND_PORT=8000
DATABASE_URL=sqlite:///./agile_tools.db

# Frontend
VITE_API_URL=http://localhost:8000
```

## Docker Commands

```bash
# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend

# Access backend shell
docker-compose exec backend sh

# Remove volumes (WARNING: deletes database)
docker-compose down -v
```

## Production Considerations

1. **Database**: Replace SQLite with PostgreSQL for production
2. **Authentication**: Implement proper OAuth2 validation
3. **HTTPS**: Use SSL certificates and enable HTTPS
4. **Environment Variables**: Use secrets management
5. **Logging**: Configure proper logging and monitoring
6. **Backup**: Implement database backup strategy
7. **Rate Limiting**: Add rate limiting to API endpoints

## License

MIT License

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.