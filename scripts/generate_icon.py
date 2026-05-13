"""
Smart Memo icon — v2
Design: indigo-to-blue rounded square,
        large white bookmark ribbon + sparkle star + memo lines.
"""
from PIL import Image, ImageDraw, ImageFilter
import os, math

BASE    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONSET = os.path.join(BASE, "assets", "icon.iconset")
os.makedirs(ICONSET, exist_ok=True)


def lerp(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def rounded_rect_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def draw_icon(S):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    # ── gradient background ────────────────────────────────────────────
    TOP = (88, 86, 214)       # #5856D6 indigo
    BOT = (0, 122, 255)       # #007AFF blue
    R   = int(S * 0.22)

    bg = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bg)
    for y in range(S):
        bd.line([(0, y), (S - 1, y)], fill=lerp(TOP, BOT, y / (S - 1)) + (255,))
    bg.putalpha(rounded_rect_mask(S, R))
    img.paste(bg, (0, 0), bg)

    draw = ImageDraw.Draw(img)

    # ── bookmark ribbon ────────────────────────────────────────────────
    # Classic bookmark: rectangle with a V-notch cut at the bottom
    bx1 = int(S * 0.25)
    bx2 = int(S * 0.62)
    by1 = int(S * 0.14)
    by2 = int(S * 0.80)
    bw  = bx2 - bx1
    notch_depth = int(S * 0.085)
    notch_mid_x = (bx1 + bx2) // 2

    bookmark_poly = [
        (bx1, by1),
        (bx2, by1),
        (bx2, by2),
        (notch_mid_x, by2 - notch_depth),
        (bx1, by2),
    ]

    # drop shadow
    shadow_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow_layer)
    off = int(S * 0.025)
    sdraw.polygon([(x + off, y + off) for x, y in bookmark_poly], fill=(0, 0, 0, 70))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(int(S * 0.028)))
    img = Image.alpha_composite(img, shadow_layer)
    draw = ImageDraw.Draw(img)

    # white bookmark body
    draw.polygon(bookmark_poly, fill=(255, 255, 255, 255))

    # subtle inner highlight stripe (left edge)
    hl_w = max(2, int(bw * 0.12))
    draw.rectangle([bx1, by1, bx1 + hl_w, by2 - notch_depth],
                   fill=(255, 255, 255, 60))

    # thin left accent bar (brand color)
    bar_w = max(2, int(bw * 0.065))
    bar_color = lerp(TOP, BOT, 0.3) + (255,)
    draw.rectangle([bx1, by1, bx1 + bar_w, by2 - notch_depth], fill=bar_color)

    # ── horizontal memo lines on bookmark ─────────────────────────────
    line_x1  = bx1 + int(bw * 0.22)
    line_x2  = bx2 - int(bw * 0.12)
    line_y   = int(by1 + (by2 - by1) * 0.30)
    line_gap = int(S * 0.075)
    lh       = max(2, int(S * 0.028))
    lr       = lh // 2
    line_alphas = [160, 110, 70]
    line_widths = [1.0, 0.78, 0.55]

    for i in range(3):
        lx2 = line_x1 + int((line_x2 - line_x1) * line_widths[i])
        ly  = line_y + i * line_gap
        draw.rounded_rectangle(
            [line_x1, ly, lx2, ly + lh],
            radius=lr,
            fill=lerp(TOP, BOT, 0.25) + (line_alphas[i],),
        )

    # ── sparkle / star (top-right corner of icon) ─────────────────────
    sx = int(S * 0.72)
    sy = int(S * 0.24)
    sr = int(S * 0.115)   # outer radius
    sir= int(sr * 0.42)   # inner radius
    points = 4
    star_pts = []
    for i in range(points * 2):
        angle = math.pi * i / points - math.pi / 2
        r = sr if i % 2 == 0 else sir
        star_pts.append((sx + r * math.cos(angle), sy + r * math.sin(angle)))

    # star glow
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gd   = ImageDraw.Draw(glow)
    gd.polygon(star_pts, fill=(255, 255, 255, 100))
    glow = glow.filter(ImageFilter.GaussianBlur(int(S * 0.02)))
    img  = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    draw.polygon(star_pts, fill=(255, 255, 255, 245))

    # small circle center of star
    scr = max(2, int(sr * 0.18))
    draw.ellipse([sx - scr, sy - scr, sx + scr, sy + scr],
                 fill=lerp(TOP, BOT, 0.2) + (200,))

    return img


SIZES = [16, 32, 64, 128, 256, 512, 1024]
for sz in SIZES:
    icon = draw_icon(sz)
    icon.save(os.path.join(ICONSET, f"icon_{sz}x{sz}.png"))
    if sz <= 512:
        icon.save(os.path.join(ICONSET, f"icon_{sz}x{sz}@2x.png"))

print("✅ iconset generated →", ICONSET)
