#!/usr/bin/env bash
# Bundles the site into a single self-contained file at dist/index.html.
# You do NOT need this to host on GitHub Pages — index.html works as it is.
# It is only for sharing or embedding the site as one file.
#
# The order below is the load order and it matters: parks.js and cities.js
# merge into data.js, and views.js and app.js use everything above them.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist

FILES=(config.js world.js visa.js profile.js climate.js local.js land.js
       data.js parks.js cities.js events.js bucket.js
       cloud.js features.js translate.js plan.js views.js app.js)

python3 - "${FILES[@]}" << 'PY'
import io, re, sys
files = sys.argv[1:]
html = io.open('index.html', encoding='utf-8').read()

# drop every tag we are about to inline, however the file is formatted
html = re.sub(r'[ \t]*<script src="assets/js/[^"]+"></script>\n?', '', html)
html = re.sub(r'[ \t]*<link rel="stylesheet" href="assets/css/styles\.css[^"]*">\n?', '', html)

css = io.open('assets/css/styles.css', encoding='utf-8').read()
js  = "\n;\n".join(io.open('assets/js/' + f, encoding='utf-8').read() for f in files)

html = html.replace('</head>', '<style>\n' + css + '\n</style>\n</head>')
html = html.replace('</body>', '<script>\n' + js + '\n</script>\n</body>')
io.open('dist/index.html', 'w', encoding='utf-8').write(html)
print('inlined %d scripts and the stylesheet' % len(files))
PY

echo "built dist/index.html ($(wc -c < dist/index.html) bytes)"
