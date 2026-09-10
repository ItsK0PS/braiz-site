#!/usr/bin/env python3
"""
Sert le site en local en reproduisant la réécriture Vercel /join/:token.

    python3 serve.py

Écoute sur toutes les interfaces, pour qu'un téléphone du même Wi-Fi
puisse ouvrir la page. L'adresse à utiliser est affichée au démarrage.

⚠️ En http, navigator.clipboard n'existe pas : ce n'est pas un contexte
sécurisé. Le bouton Copier bascule alors sur son repli (il sélectionne le
code). Ce n'est pas un défaut de la page, c'est une règle du navigateur.
Pour tester la copie pour de vrai, il faut du https, donc le site déployé.
"""

import functools
import http.server
import re
import socket

ROOT = "/Users/kops/Desktop/braiz-site"
PORT = 8765
JOIN = re.compile(r"^/join/[^/]+/?$")


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # La règle de vercel.json : /join/:token sert join.html sans que
        # l'URL change, donc le script y lit toujours son jeton.
        if JOIN.match(path.split("?")[0]):
            return ROOT + "/join.html"
        return super().translate_path(path)

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
    http.server.HTTPServer(
        ("0.0.0.0", PORT), functools.partial(Handler, directory=ROOT)
    ).serve_forever()
