"""Build a labelled contact sheet per site from its screenshots.
Usage: python -I sheet.py <outDir> [id ...]"""
import sys, os, glob
from PIL import Image, ImageDraw

root = sys.argv[1]
ids = sys.argv[2:] or sorted(d for d in os.listdir(root) if os.path.isdir(os.path.join(root, d)))
for sid in ids:
    d = os.path.join(root, sid)
    desk = sorted(f for f in glob.glob(os.path.join(d, "*.jpg")) if not os.path.basename(f).startswith("m-"))
    mob = sorted(glob.glob(os.path.join(d, "m-*.jpg")))
    tw, th = 640, 360
    cols = 3
    rows = (len(desk) + cols - 1) // cols
    mw, mh = 166, 360
    W = cols * tw + max(1, len(mob)) * mw + 10
    H = max(rows * (th + 18), mh + 18)
    sheet = Image.new("RGB", (W, H), (30, 30, 30))
    dr = ImageDraw.Draw(sheet)
    for i, f in enumerate(desk):
        im = Image.open(f).convert("RGB").resize((tw, th), Image.LANCZOS)
        x, y = (i % cols) * tw, (i // cols) * (th + 18)
        sheet.paste(im, (x, y + 18))
        dr.text((x + 4, y + 3), os.path.basename(f)[:-4], fill=(255, 220, 120))
    for j, f in enumerate(mob):
        im = Image.open(f).convert("RGB").resize((mw, mh), Image.LANCZOS)
        x = cols * tw + 10 + j * mw
        sheet.paste(im, (x, 18))
        dr.text((x + 2, 3), os.path.basename(f)[2:-4][:22], fill=(120, 220, 255))
    sheet.save(os.path.join(root, f"_sheet_{sid}.jpg"), quality=80)
    print("sheet", sid, len(desk), len(mob))
