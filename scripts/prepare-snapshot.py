"""Reduce an archived public WordPress collection to inert, reproducible JSON.
Never reads mail, cookies, or executable scripts. See docs/content-inventory.md.
"""
import argparse
import hashlib
import json
import re
from html import unescape
from html.parser import HTMLParser
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--source-dir', type=Path, required=True)
args = parser.parse_args()
source = args.source_dir
out = Path('src/data/source')
out.mkdir(parents=True, exist_ok=True)

class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []
    def handle_data(self, value): self.parts.append(value)
    def handle_endtag(self, tag):
        if tag in ('p', 'div', 'li', 'h2', 'h3', 'br'): self.parts.append('\n')

def plain(value):
    t = Text(); t.feed(value or '')
    return '\n'.join(' '.join(x.split()) for x in unescape(''.join(t.parts)).splitlines() if x.strip())

class Defaults(HTMLParser):
    def __init__(self):
        super().__init__(); self.name = None; self.values = {}
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'select': self.name = a.get('name')
        if tag == 'option' and 'selected' in a and self.name and self.name.startswith('attribute_'):
            self.values[self.name] = a.get('value', '')

def read(name): return json.loads((source / name).read_text())
def write(name, data): (out / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
products = read('site/wp-json_wc_store_v1_products_per_page-100.json')
html_index = {x['slug']: x for x in read('site/html-fetch-index.json')}
rows = []
urls = set()
for p in products:
    defaults = Defaults(); defaults.feed((source / 'site/html' / (p['slug'] + '.html')).read_text())
    row = {k: p.get(k) for k in ('id', 'name', 'slug', 'type', 'sku', 'permalink', 'prices', 'categories', 'attributes', 'is_in_stock', 'backorders_allowed', 'low_stock_remaining', 'stock_availability')}
    row['description'] = plain(p['description'])
    row['shortDescription'] = plain(p['short_description'])
    row['defaults'] = defaults.values
    row['images'] = [{k: i.get(k) for k in ('id', 'src', 'name', 'alt')} for i in p['images']]
    urls.update(i['src'] for i in row['images'])
    row['variants'] = []
    for v in html_index[p['slug']]['variants']:
        variant = {k: v.get(k) for k in ('variation_id', 'attributes', 'display_price', 'display_regular_price', 'image_id', 'sku', 'is_in_stock', 'backorders_allowed', 'variation_is_active', 'variation_is_visible')}
        variant['description'] = plain(v['variation_description'])
        variant['availability'] = plain(v['availability_html'])
        variant['imageUrl'] = v['image'].get('full_src') or v['image'].get('url') or v['image'].get('src')
        urls.add(variant['imageUrl'])
        row['variants'].append(variant)
    rows.append(row)
brands = []
for b in read('brands-inventory.json'):
    evidence = [{k: e[k] for k in ('url', 'page', 'method') if k in e} for e in b['evidence']]
    brands.append({'name': b['name'], 'evidence': evidence, 'onlineProductsSource': b['onlineProducts']})
    urls.update(e['url'] for e in evidence if '/wp-content/' in e.get('url', ''))
# Only editorial images actually displayed (S1 + S2 pages). Source originals stay outside Git.
editorial_files = ['655699e241-logo-optic-2000-quadri.jpg', '3ccedc7d0d-Readers-Landing-Page-Fashion-Favorite-Big-Card-Kini-Kini-GS849-02K.webp', '1973260a9f-IMG_0997-Copie.jpg', '8331dd1f09-IMG_1002.jpg', '9aa0950419-IMG-5315-scaled.jpg', '27a1e1e1bd-IMG-5318-scaled.jpg', '4a3600313f-image_50397185-scaled.jpg', '33895c9dce-image_6487327-scaled.jpg',
    '4fc6abc0d6-2022-05-02-OPTIC2000-POST27.jpg', '62e14c3acf-2022-05-02-OPTIC2000-POST21.jpg', '6b3c1455b1-opticiens-tahiti-scaled.jpg', 'b413c0bdf9-perl-alhena-70-700-eq1.jpg', '16bd866170-celestron-oceana-7-x-50-noire.jpg']
manifest = read('assets-manifest.json')
urls.update(m['url'] for m in manifest if m['file'] in editorial_files)
assets = [{k: m[k] for k in ('url', 'file', 'sha256', 'dimensions', 'references')} for m in manifest if m['url'] in urls and m['ok']]
missing = urls - {m['url'] for m in assets}
assert not missing, missing
write('catalogue.public.json', {'collectedAt': '2026-10-21', 'endpoint': 'https://optic2000tahiti.com/wp-json/wc/store/v1/products?per_page=100', 'products': rows})
write('brands.public.json', brands)
write('assets.public.json', assets)
pages = read('site/wp-json_wp_v2_pages_per_page-100.json')
# Pages whose wording is reused (reorganised) by the prototype keep an inert plain-text copy for
# traceability; Divi shortcodes are removed. Commerce, CGV and privacy pages keep only their identity.
reused_text = {'accueil', 'lunettes-de-vue', 'lentilles', 'jumelles-et-telescopes', 'basse-vision', 'protheses-occulaires', 'qui-sommes-nous', 'mentions-legales'}
def page_text(rendered):
    text = re.sub(r'\[/?et_pb_[^\]]*\]', '\n', plain(rendered))
    return '\n'.join(line.strip() for line in text.splitlines() if line.strip())
def page_row(p):
    row = {'id': p['id'], 'slug': p['slug'], 'url': p['link'], 'title': plain(p['title']['rendered']), 'date': p['date'], 'modified': p['modified'], 'contentSha256': hashlib.sha256(p['content']['rendered'].encode()).hexdigest()}
    if p['slug'] in reused_text: row['text'] = page_text(p['content']['rendered'])
    return row
write('pages.public.json', [page_row(p) for p in pages if p['slug'] != 'page-d-exemple'])
print(f'Public snapshot: {len(rows)} products, {sum(len(p["variants"]) for p in rows)} variants, {len(brands)} identities, {len(assets)} referenced media.')
