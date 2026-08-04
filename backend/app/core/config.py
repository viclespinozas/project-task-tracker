from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    database_url: Optional[str] = Field(default=None, env_var="DATABASE_URL")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()