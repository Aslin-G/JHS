#!/usr/bin/env python3
"""Empaqueta el juego en un único HTML autocontenido.

    python3 tools/build_artifact.py            -> dist/camino-de-montana.html (documento completo)
    python3 tools/build_artifact.py --artifact -> dist/artifact.html (sin <html>/<head>/<body>,
                                                  para publicarlo como Artifact de Claude)

Incrusta todos los scripts de src/ y la lámina de referencia (para la «Hoja de personajes»).
No necesita dependencias: solo la biblioteca estándar de Python.
"""
import base64
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
artifact = '--artifact' in sys.argv

html = (ROOT / 'index.html').read_text(encoding='utf-8')


def inline_script(match):
    src = match.group(1)
    code = (ROOT / src).read_text(encoding='utf-8')
    if '</script' in code.lower():
        raise SystemExit(f'{src} contiene </script>; no se puede incrustar')
    return f'<script>\n/* {src} */\n{code}\n</script>'


html = re.sub(r'<script src="(src/[^"]+)"></script>', inline_script, html)

ref = ROOT / 'docs' / 'referencias' / 'lamina_conceptual.jpg'
data = base64.b64encode(ref.read_bytes()).decode('ascii')
ref_script = f'<script>window.JHS = window.JHS || {{}}; JHS.REF_IMAGE_SRC = "data:image/jpeg;base64,{data}";</script>'
html = html.replace('<script>\n/* src/util.js */', ref_script + '\n<script>\n/* src/util.js */', 1)

if artifact:
    # El visor de Artifacts envuelve la página con su propio esqueleto (doctype, charset, viewport).
    for pat in [r'<!doctype html>\s*', r'<html[^>]*>\s*', r'</html>\s*', r'<head>\s*', r'</head>\s*',
                r'<body>\s*', r'</body>\s*', r'<meta charset="utf-8">\s*', r'<meta name="viewport"[^>]*>\s*']:
        html = re.sub(pat, '', html, flags=re.IGNORECASE)

out_dir = ROOT / 'dist'
out_dir.mkdir(exist_ok=True)
out = out_dir / ('artifact.html' if artifact else 'camino-de-montana.html')
out.write_text(html, encoding='utf-8')
print(f'{out.relative_to(ROOT)}  {out.stat().st_size / 1024:.0f} KB')
