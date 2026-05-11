"""
Generate HiveFit Play Store assets:
  - icon_512.png      (512×512 app icon)
  - feature_1024.png  (1024×500 feature graphic)
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os

# ── Brand colours ────────────────────────────────────────────────────────────
BG    = (12,  9,  0)     # #0c0900  app bg
CARD  = (28, 28, 30)     # #1C1C1E  steel grey
AMBER = (245, 158, 11)   # #F59E0B  ember amber
WHITE = (224, 224, 224)  # #E0E0E0  pale chalk
MUTED = (80,  60, 20)    # subtle amber shadow

FONT_BOLD = "/usr/share/fonts/google-noto/NotoSans-Bold.ttf"
FONT_REG  = "/usr/share/fonts/google-noto/NotoSans-Regular.ttf"

OUT = os.path.dirname(os.path.abspath(__file__))


# ── Helpers ──────────────────────────────────────────────────────────────────

def hex_pts(cx, cy, r, offset_deg=30):
    """Flat-top hexagon vertices."""
    return [
        (cx + r * math.cos(math.radians(60 * i + offset_deg)),
         cy + r * math.sin(math.radians(60 * i + offset_deg)))
        for i in range(6)
    ]


def draw_hex_ring(draw, cx, cy, r, thickness, color):
    """Draw a hexagon ring by stacking outlines."""
    for t in range(thickness):
        pts = hex_pts(cx, cy, r - t)
        draw.polygon(pts, outline=color)


def draw_H(draw, cx, cy, h_w, h_h, bar_w, cross_h, color, lean=18):
    """Draw a stylised italic-lean H using polygons."""
    lx = cx - h_w // 2
    rx = cx + h_w // 2
    ty = cy - h_h // 2
    by = cy + h_h // 2

    # Left vertical bar (parallelogram leaning right)
    draw.polygon([
        (lx + lean, ty),
        (lx + bar_w + lean, ty),
        (lx + bar_w - lean, by),
        (lx - lean, by),
    ], fill=color)

    # Right vertical bar
    draw.polygon([
        (rx - bar_w + lean, ty),
        (rx + lean, ty),
        (rx - lean, by),
        (rx - bar_w - lean, by),
    ], fill=color)

    # Horizontal crossbar
    mid_y = cy
    draw.polygon([
        (lx + bar_w + lean // 2, mid_y - cross_h // 2),
        (rx - bar_w + lean // 2, mid_y - cross_h // 2),
        (rx - bar_w - lean // 2, mid_y + cross_h // 2),
        (lx + bar_w - lean // 2, mid_y + cross_h // 2),
    ], fill=color)


# ── Icon 512×512 ─────────────────────────────────────────────────────────────

def make_icon():
    S = 512
    img = Image.new("RGB", (S, S), BG)
    draw = ImageDraw.Draw(img)

    cx, cy = S // 2, S // 2

    # Subtle glow behind hex (paint amber blur blob first)
    glow = Image.new("RGB", (S, S), BG)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([cx-180, cy-180, cx+180, cy+180], fill=(60, 40, 5))
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    img = Image.blend(img, glow, 0.6)
    draw = ImageDraw.Draw(img)

    # Hex fill (card colour)
    r_outer = 215
    draw.polygon(hex_pts(cx, cy, r_outer), fill=CARD)

    # Hex border ring (amber, 10px thick)
    draw_hex_ring(draw, cx, cy, r_outer, 10, AMBER)

    # Stylised H
    draw_H(draw, cx, cy,
           h_w=160, h_h=175, bar_w=32, cross_h=26,
           color=AMBER, lean=20)

    path = os.path.join(OUT, "icon_512.png")
    img.save(path, "PNG")
    print(f"Saved {path}")


# ── Feature graphic 1024×500 ─────────────────────────────────────────────────

def make_feature():
    W, H_px = 1024, 500
    img = Image.new("RGB", (W, H_px), BG)
    draw = ImageDraw.Draw(img)

    # Background hex grid (subtle, right side)
    for row in range(-1, 6):
        for col in range(4, 10):
            gx = col * 110 + (50 if row % 2 else 0)
            gy = row * 95 + 30
            pts = hex_pts(gx, gy, 48)
            draw.polygon(pts, outline=(30, 22, 4))

    # Amber glow left
    glow = Image.new("RGB", (W, H_px), BG)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-80, 80, 380, 440], fill=(55, 38, 4))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    img = Image.blend(img, glow, 0.7)
    draw = ImageDraw.Draw(img)

    # Left: hex logo
    lx, ly = 190, H_px // 2
    r_logo = 155
    draw.polygon(hex_pts(lx, ly, r_logo), fill=CARD)
    draw_hex_ring(draw, lx, ly, r_logo, 9, AMBER)
    draw_H(draw, lx, ly,
           h_w=115, h_h=125, bar_w=23, cross_h=19,
           color=AMBER, lean=14)

    # Divider line
    draw.line([(370, 60), (370, H_px - 60)], fill=(50, 37, 5), width=2)

    # Right: wordmark
    try:
        f_title = ImageFont.truetype(FONT_BOLD, 96)
        f_sub   = ImageFont.truetype(FONT_REG,  30)
        f_tag   = ImageFont.truetype(FONT_BOLD, 22)
    except Exception:
        f_title = f_sub = f_tag = ImageFont.load_default()

    tx = 420
    draw.text((tx, 130), "HIVEFIT", font=f_title, fill=AMBER)

    draw.text((tx + 4, 248), "Train  ·  Track  ·  Progress", font=f_sub, fill=WHITE)

    # Amber underline under tagline
    draw.rectangle([tx + 4, 290, tx + 340, 293], fill=AMBER)

    # Version / store badge line
    draw.text((tx + 4, 330), "POWERED BY OPENHIVE AI", font=f_tag, fill=(120, 88, 20))

    path = os.path.join(OUT, "feature_1024.png")
    img.save(path, "PNG")
    print(f"Saved {path}")


if __name__ == "__main__":
    make_icon()
    make_feature()
    print("Done.")
