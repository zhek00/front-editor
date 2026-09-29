"""
TipLabs - Servidor do Frontend
Serve os arquivos do editor (index.html, css/, js/) e garante que o backend
oficial (fabrica/api.py, porta 8080) esteja rodando. O editor fala direto
com esse backend oficial pelo navegador — este servidor não duplica nenhuma
lógica de projetos, cenas ou renderização.
"""

import argparse
import mimetypes
import subprocess
import time
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote
import urllib.error
import urllib.request

DEFAULT_FABRICA_DIR = Path("E:/fabrica-para-amigo").resolve()
FABRICA_DIR = DEFAULT_FABRICA_DIR

FASTAPI_PORT = 8080
FASTAPI_HOST = "127.0.0.1"


def is_fastapi_alive(port=FASTAPI_PORT) -> bool:
    try:
        req = urllib.request.Request(f"http://{FASTAPI_HOST}:{port}/api/projetos", method="GET")
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            return resp.status == 200
    except Exception:
        return False


def ensure_fastapi_server(fabrica_dir: Path, port=FASTAPI_PORT):
    if is_fastapi_alive(port):
        print(f"⚡ Backend FastAPI já ativo em http://localhost:{port}")
        return

    print(f"🚀 Iniciando backend oficial FastAPI (uv run fabrica servidor --porta {port})...")
    try:
        subprocess.Popen(
            ["uv", "run", "fabrica", "servidor", "--porta", str(port)],
            cwd=str(fabrica_dir),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        for _ in range(25):
            time.sleep(0.5)
            if is_fastapi_alive(port):
                print(f"✅ Backend FastAPI pronto em http://localhost:{port}!")
                return
        print("⚠️ FastAPI em processo de inicialização...")
    except Exception as e:
        print(f"⚠️ Não foi possível iniciar FastAPI automaticamente: {e}")


class StudioRequestHandler(SimpleHTTPRequestHandler):
    """Serve só os arquivos estáticos do editor. Tudo de API/mídia vai direto pro backend oficial (porta 8080)."""

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in ("", "/"):
            path = "/index.html"

        target = Path(__file__).parent / unquote(path.lstrip("/"))
        if not target.exists() or not target.is_file():
            # URL limpa (sem .html), igual o cleanUrls da Vercel: /privacidade -> privacidade.html
            com_html = target.with_name(target.name + ".html")
            target = com_html if com_html.is_file() else Path(__file__).parent / "index.html"

        mime_type, _ = mimetypes.guess_type(str(target))
        if target.suffix == ".html":
            mime_type = "text/html; charset=utf-8"
        elif target.suffix == ".css":
            mime_type = "text/css; charset=utf-8"
        elif target.suffix == ".js":
            mime_type = "application/javascript; charset=utf-8"
        else:
            mime_type = mime_type or "application/octet-stream"

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", str(target.stat().st_size))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        with open(target, "rb") as f:
            self.wfile.write(f.read())

    def log_message(self, format, *args):
        pass


def run_server(port=5173, fabrica_path="E:/fabrica-para-amigo"):
    fabrica_dir = Path(fabrica_path).resolve()
    ensure_fastapi_server(fabrica_dir, FASTAPI_PORT)
    httpd = ThreadingHTTPServer(("", port), StudioRequestHandler)
    print("==================================================")
    print("🎬 FÁBRICA STUDIO - EDITOR ONLINE LEVE")
    print(f"🌐 Servidor rodando em: http://localhost:{port}")
    print(f"📁 Diretório da fábrica: {fabrica_dir}")
    print("==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor finalizado.")
        httpd.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TipLabs - Editor Online Leve")
    parser.add_argument("--port", type=int, default=5173, help="Porta do servidor (padrão: 5173)")
    parser.add_argument("--fabrica", type=str, default="E:/fabrica-para-amigo", help="Diretório da fábrica de vídeos")
    args = parser.parse_args()
    run_server(port=args.port, fabrica_path=args.fabrica)
