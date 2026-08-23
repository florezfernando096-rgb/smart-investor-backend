"""
run.py — Script de inicio conveniente para el Financial Dashboard.
Uso: python3 run.py
"""
import subprocess
import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


def check_env():
    """Verifica que el archivo .env existe, si no, lo crea a partir del .env.example."""
    env_file = BASE_DIR / ".env"
    example_file = BASE_DIR / ".env.example"
    if not env_file.exists() and example_file.exists():
        env_file.write_text(example_file.read_text())
        print(f"[INFO] Archivo .env creado desde .env.example. Edítalo para añadir tu cookie.")


def get_python():
    """Retorna el ejecutable Python del venv local si existe, si no el del sistema."""
    venv_python = BASE_DIR / "venv" / "bin" / "python3"
    if venv_python.exists():
        return str(venv_python)
    return sys.executable


def get_uvicorn():
    """Retorna el ejecutable uvicorn del venv local si existe."""
    venv_uv = BASE_DIR / "venv" / "bin" / "uvicorn"
    if venv_uv.exists():
        return str(venv_uv)
    return "uvicorn"


def main():
    check_env()

    host = os.environ.get("HOST", "127.0.0.1")
    port = os.environ.get("PORT", "8000")
    reload_flag = "--reload"

    print(f"\n{'='*60}")
    print("  📊 Smart Investor Financial Dashboard")
    print(f"{'='*60}")
    print(f"  🌐 Servidor: http://{host}:{port}")
    print(f"  📋 API Docs: http://{host}:{port}/docs")
    print(f"  💡 DEMO:     http://{host}:{port}/?symbol=DEMO")
    print(f"{'='*60}\n")

    uvicorn_cmd = get_uvicorn()
    cmd = [uvicorn_cmd, "app:app", "--host", host, "--port", port, reload_flag]

    try:
        subprocess.run(cmd, cwd=str(BASE_DIR))
    except KeyboardInterrupt:
        print("\n\n[INFO] Servidor detenido.")


if __name__ == "__main__":
    main()
