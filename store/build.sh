#!/bin/sh
# Empaqueta la extensión para la Chrome Web Store.
# Uso: ./store/build.sh  (desde la raíz del repo)
set -e
cd "$(dirname "$0")/.."
VERSION=$(python3 -c "import json; print(json.load(open('receptor-extension/manifest.json'))['version'])")
OUT="store/facturito-$VERSION.zip"
rm -f "$OUT"
cd receptor-extension
zip -r "../$OUT" . -x '.*' -x '*/.*' -x '*.DS_Store'
cd ..
echo "\nPaquete listo: $OUT"
unzip -l "$OUT"
