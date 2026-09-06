#!/usr/bin/env python3
"""
Génère les pages HTML du site Braiz à partir des sources markdown de src/.

Usage :  python3 build.py

Chaque fichier src/<nom>.md produit <nom>.html à la racine, dans le gabarit
commun. index.html n'est pas généré : il est écrit à la main.

Dépendance :  pip3 install markdown
"""

import re
from pathlib import Path

import markdown

ROOT = Path(__file__).parent
SRC = ROOT / "src"

PAGES = {
    "confidentialite": "Politique de confidentialité",
    "cgu": "Conditions d'utilisation",
    "mentions-legales": "Mentions légales",
}

GABARIT = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titre} - Braiz</title>
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#08070A">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="stylesheet" href="style.css">
</head>
<body>

<header class="site-head">
  <div class="wrap">
    <a class="mark" href="/">
      <img class="mark__logo" src="braiz-wordmark.svg" alt="Braiz" width="132" height="62">
    </a>
  </div>
</header>

<main>
  <div class="wrap">
    <article class="doc">
{contenu}
    </article>
  </div>
</main>

<footer class="site-foot">
  <div class="wrap">
    <nav>
      <a href="/confidentialite">Confidentialité</a>
      <a href="/cgu">Conditions d'utilisation</a>
      <a href="/mentions-legales">Mentions légales</a>
    </nav>
    <p><a href="mailto:contact@getbraiz.com">contact@getbraiz.com</a></p>
  </div>
</footer>

</body>
</html>
"""


def convertir(nom: str, titre: str) -> None:
    source = SRC / f"{nom}.md"
    if not source.exists():
        print(f"  manquant : {source}")
        return

    texte = source.read_text(encoding="utf-8")
    corps = markdown.markdown(texte, extensions=["tables", "sane_lists"])

    # Les emails en clair deviennent cliquables. Le markdown source n'en
    # contient aucun sous forme de lien, donc pas de risque de double
    # encapsulation : on repart du markdown converti à chaque build.
    corps = re.sub(
        r"(?<!mailto:)\b([\w.+-]+@[\w-]+\.[\w.]+)\b",
        r'<a href="mailto:\1">\1</a>',
        corps,
    )

    corps = "\n".join("      " + ligne for ligne in corps.splitlines())
    page = GABARIT.format(titre=titre, contenu=corps)
    cible = ROOT / f"{nom}.html"
    cible.write_text(page, encoding="utf-8")
    print(f"  {source.name}  ->  {cible.name}")


if __name__ == "__main__":
    print("Génération des pages :")
    for nom, titre in PAGES.items():
        convertir(nom, titre)
    print("Terminé.")
