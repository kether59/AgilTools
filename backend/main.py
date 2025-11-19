import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import poker, wheel, websocket


logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Agile Tools API", version="2.0")
logger = logging.getLogger(__name__)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Créer les tables
Base.metadata.create_all(bind=engine)

# Inclure les routers
app.include_router(poker.router)
app.include_router(wheel.router)
app.include_router(websocket.router)

@app.get("/")
def root():
    return {"message": "Agile Tools API", "version": "2.0"}

if __name__ == "__main__":
    import uvicorn

    host = "0.0.0.0"
    port = 8000

    logger.info(f"🚀 Starting FastAPI server on {host}:{port}")
    logger.info(f"✅ Backend available at: http://{host}:{port}")
    logger.info(f"🔌 WebSocket server available at: ws://{host}:{port}")

    uvicorn.run(app, host=host, port=port)

