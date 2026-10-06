#!/usr/bin/env bash
# Bundles the site into a single self-contained file at dist/index.html.
# You do NOT need this to host on GitHub Pages — index.html works as it is.
# It is only for sharing or embedding the site as one file.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
{
  sed -e '/assets\/css\/styles.css/d' -e '/assets\/js\/world.js/d' -e '/assets\/js\/land.js/d' -e '/assets\/js\/data.js/d' -e '/assets\/js\/app.js/d' \
      -e 's|</head>|<style>\n__CSS__\n</style>\n</head>|' \
      -e 's|</body>|<script>\n__JS__\n</script>\n</body>|' index.html
} > dist/.tmp.html
python3 - << 'PY'
import io
html = io.open('dist/.tmp.html', encoding='utf-8').read()
css  = io.open('assets/css/styles.css', encoding='utf-8').read()
js   = "\n".join(io.open('assets/js/'+f, encoding='utf-8').read()
                  for f in ('world.js','land.js','data.js','app.js'))
html = html.replace('__CSS__', css).replace('__JS__', js)
io.open('dist/index.html', 'w', encoding='utf-8').write(html)
PY
rm -f dist/.tmp.html
echo "built dist/index.html"
