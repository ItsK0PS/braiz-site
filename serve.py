#!/usr/bin/env python3
"""
Sert le site construit (dist/) en local en reproduisant vercel.json : la
réécriture /join/:token et les URLs sans extension (cleanUrls).

    npm run build && python3 serve.py

Le serveur de développement d'Astro (npm run dev) ne connaît pas la
réécriture de vercel.json : /join/<token> y renvoie une 404. Pour tester une
invitation, passer par ce script.

Compression gzip des fichiers texte (HTML, CSS, JavaScript, SVG, JSON),
comme Vercel en production (qui sert en brotli ou en gzip) : les mesures
Lighthouse faites ici se rapprochent de celles du site en ligne.

Écoute sur toutes les interfaces, pour qu'un téléphone du même Wi-Fi
puisse ouvrir la page. L'adresse à utiliser est affichée au démarrage.

⚠️ En http, navigator.clipboard n'existe pas : ce n'est pas un contexte
sécurisé. Le bouton Copier bascule alors sur son repli (il sélectionne le
code). Ce n'est pas un défaut de la page, c'est une règle du navigateur.
Pour tester la copie pour de vrai, il faut du https, donc le site déployé.
"""

import functools
import gzip
import http.server
import os
import re
import socket

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")
PORT = 8765
JOIN = re.compile(r"^/join/[^/]+/?$")
# Types compressés. Les images (PNG, WebP, AVIF) et les polices woff2 sont
# déjà compressées : gzip n'y gagnerait rien.
COMPRESSIBLE = {".html", ".css", ".js", ".mjs", ".svg", ".json", ".txt", ".xml", ".webmanifest"}


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # La règle de vercel.json : /join/:token sert join.html sans que
        # l'URL change, donc le script y lit toujours son jeton.
        if JOIN.match(path.split("?")[0]):
            return ROOT + "/join.html"
        # cleanUrls de vercel.json : /beta sert beta.html.
        local = super().translate_path(path)
        if not os.path.exists(local) and os.path.exists(local + ".html"):
            return local + ".html"
        return local

    def do_GET(self):
        path = self.translate_path(self.path)
        # « / » désigne le dossier : c'est son index.html qui est servi.
        if os.path.isdir(path) and os.path.isfile(os.path.join(path, "index.html")):
            path = os.path.join(path, "index.html")
        accepts_gzip = "gzip" in self.headers.get("Accept-Encoding", "")
        ext = os.path.splitext(path)[1].lower()
        if not (accepts_gzip and ext in COMPRESSIBLE and os.path.isfile(path)):
            return super().do_GET()
        with open(path, "rb") as f:
            body = gzip.compress(f.read(), compresslevel=6)
        self.send_response(200)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Encoding", "gzip")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Vary", "Accept-Encoding")
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        # Pas de cache : sinon une correction de style ne se voit pas.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("192.168.1.1", 1))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


if __name__ == "__main__":
    ip = lan_ip()
    print(f"Site servi sur  http://{ip}:{PORT}")
    print(f"Invitation      http://{ip}:{PORT}/join/<token>")
    print("Ctrl+C pour arrêter.")
    # Un fil par requête : un navigateur ouvre plusieurs connexions à la
    # fois (et plusieurs téléphones peuvent tester en même temps).
    http.server.ThreadingHTTPServer(
        ("0.0.0.0", PORT), functools.partial(Handler, directory=ROOT)
    ).serve_forever()
