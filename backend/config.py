from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./agile_tools.db"
    cors_origins: list = ["*"]

    class Config:
        env_file = ".env"

settings = Settings()