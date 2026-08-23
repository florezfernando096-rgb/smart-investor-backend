import os
import re
from pathlib import Path
from typing import Dict, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    COOKIE_STRING: str = os.getenv(
        "COOKIE_STRING",
        "_ga=GA1.1.1213138851.1786898736; csrftoken=YrKI4H4vpaGN3F8xOOXqpmKFSBTiGTxW; sessionid=ubjgirlp4yxon2dbo3nrg1nk5558zk1o; _ga_73DSW1MR8R=GS2.1.s1787407000$o10$g1$t1787408404$j59$l0$h0"
    )
    SESSION_COOKIE_NAME: str = ""
    SESSION_COOKIE_VALUE: str = ""
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True
    BASE_URL: str = "https://thesmartinvestortool.com"
    REQUEST_TIMEOUT: int = 20
    USER_AGENT: str = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/128.0.0.0 Safari/537.36"
    )

settings = Settings()

def parse_cookie_string(cookie_str: str) -> Dict[str, str]:
    """
    Convierte una cadena de cookie 'k1=v1; k2=v2' en un diccionario Python.
    Limpia comillas y espacios adicionales.
    """
    cookies: Dict[str, str] = {}
    if not cookie_str:
        return cookies

    # Eliminar posibles prefijos 'Cookie: ' si el usuario copió la cabecera completa
    cleaned = cookie_str.strip()
    if cleaned.lower().startswith("cookie:"):
        cleaned = cleaned[7:].strip()

    pairs = cleaned.split(";")
    for pair in pairs:
        pair = pair.strip()
        if not pair:
            continue
        if "=" in pair:
            name, value = pair.split("=", 1)
            name = name.strip()
            value = value.strip().strip('"').strip("'")
            if name:
                cookies[name] = value
    return cookies

def get_effective_cookies() -> Dict[str, str]:
    """
    Retorna el diccionario de cookies consolidado.
    Prioriza COOKIE_STRING y luego SESSION_COOKIE_NAME / VALUE.
    """
    cookies = parse_cookie_string(settings.COOKIE_STRING)
    if settings.SESSION_COOKIE_NAME and settings.SESSION_COOKIE_VALUE:
        cookies[settings.SESSION_COOKIE_NAME] = settings.SESSION_COOKIE_VALUE
    return cookies

def update_cookie_setting(new_cookie_string: str) -> bool:
    """
    Actualiza la variable COOKIE_STRING en memoria y en el archivo .env.
    """
    global settings
    settings.COOKIE_STRING = new_cookie_string.strip()
    
    env_path = BASE_DIR / ".env"
    try:
        if env_path.exists():
            content = env_path.read_text(encoding="utf-8")
            if re.search(r"^COOKIE_STRING=.*$", content, flags=re.MULTILINE):
                content = re.sub(
                    r"^COOKIE_STRING=.*$",
                    f'COOKIE_STRING="{settings.COOKIE_STRING}"',
                    content,
                    flags=re.MULTILINE
                )
            else:
                content += f'\nCOOKIE_STRING="{settings.COOKIE_STRING}"\n'
            env_path.write_text(content, encoding="utf-8")
        else:
            env_path.write_text(f'COOKIE_STRING="{settings.COOKIE_STRING}"\n', encoding="utf-8")
        return True
    except Exception as e:
        print(f"Error al escribir en .env: {e}")
        return False
