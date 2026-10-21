"""Optimize only media referenced by the public snapshot; embed source provenance."""
import argparse
import concurrent.futures
import json
import subprocess
from pathlib import Path
p = argparse.ArgumentParser();p.add_argument('--assets-dir',type=Path,required=True);p.add_argument('--impeccable',type=Path);p.add_argument('--missing-only',action='store_true',help='convert only media absent from public/media');a=p.parse_args()
assets=json.loads(Path('src/data/source/assets.public.json').read_text())
shipping={m['src'] for m in json.loads(Path('src/data/media.json').read_text())}
assets=[m for m in assets if '/media/'+Path(m['file']).stem+'.webp' in shipping]
if a.missing_only: assets=[m for m in assets if not (Path('public/media')/(Path(m['file']).stem+'.webp')).exists()]
Path('public/media').mkdir(parents=True,exist_ok=True)
def convert(m):
    destination=Path('public/media')/(Path(m['file']).stem+'.webp')
    width,height=m['dimensions']
    command=['cwebp','-quiet','-q','88','-alpha_q','100']
    if width>1600: command+=['-resize','1600','0']
    command += [str(a.assets_dir/m['file']),'-o',str(destination)]
    subprocess.run(command,check=True,capture_output=True)
    if a.impeccable:
        provenance=f"Source publique : {m['url']} ; relevé le 2026-10-21 ; original SHA-256 {m['sha256']} ; conversion WebP qualité 88, proportions conservées."
        subprocess.run([str(a.impeccable),'embed-prompt',str(destination),'--prompt',provenance],check=True,capture_output=True)
    return destination.stat().st_size
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    sizes=list(pool.map(convert,assets))
print(f'{len(sizes)} médias référencés optimisés ; {sum(sizes)/1024/1024:.2f} MiB ; provenance embarquée={bool(a.impeccable)}.')
