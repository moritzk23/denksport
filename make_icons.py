"""Erzeugt die App-Icons für die Denksport-PWA (Verlauf + stilisiertes Neuronen-Netz)."""
from PIL import Image, ImageDraw
import math

ACC  = (224, 164, 79)    # --acc (Amber, Graphit-Theme)
BG0  = (24, 24, 27)      # Graphit-Fläche

def make(size):
    img = Image.new("RGB", (size, size), BG0)   # flache Graphit-Fläche
    d = ImageDraw.Draw(img, "RGBA")

    # Stilisiertes Netz aus Knoten (Neuronen/Intelligenz)
    cx, cy = size / 2, size / 2
    r = size * 0.30
    nodes = []
    for i in range(6):
        ang = math.pi / 2 + i * (2 * math.pi / 6)
        nodes.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    nodes.append((cx, cy))  # Zentrum

    line = (ACC[0], ACC[1], ACC[2], 130)
    lw = max(2, size // 90)
    for i in range(6):
        d.line([nodes[6], nodes[i]], fill=line, width=lw)
        d.line([nodes[i], nodes[(i + 1) % 6]], fill=line, width=lw)

    dot = max(6, size // 22)
    for i, (x, y) in enumerate(nodes):
        rr = dot * (1.5 if i == 6 else 1.0)
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(ACC[0], ACC[1], ACC[2], 255))

    # Ecken abrunden (transparente Maske)
    radius = int(size * 0.22)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out

for s, name in [(512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon.png")]:
    make(s).save(f"/Users/moritzkuhn/Desktop/spiel/{name}")
    print("geschrieben:", name)
