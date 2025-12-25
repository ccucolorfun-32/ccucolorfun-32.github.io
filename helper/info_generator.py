"""
Generate artwork info cards with QR codes from data/works.json.

Requires:
  pip install pillow qrcode[pil]

Output:
  PNG files in helper/output/ for each work id.
"""

import json
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import qrcode

BASE_URL = "https://ccucolorfun-32.github.io/template/index.html"
ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "works.json"
OUTPUT_DIR = Path(__file__).resolve().parent / "output"

# Basic sizing
CARD_WIDTH = 700
CARD_HEIGHT = 1500
PADDING = 70
LINE_SPACING = 8
DIVIDER_Y = 520
QR_SIZE = 220
SECTION_GAP = 18
STORY_GAP = 28

# Fonts (prefer CJK-capable fonts to render中文)
def load_font(size: int, bold: bool = False):
  regular_candidates = [
    "NotoSansTC-Regular.otf",
    "NotoSansTC-Regular.ttf",
    "NotoSansTC-Medium.otf",
    "msjh.ttc",          # Microsoft JhengHei (Windows)
    "mingliu.ttc",
    "arialuni.ttf",
    "arial.ttf",
  ]
  bold_candidates = [
    "NotoSansTC-Bold.otf",
    "NotoSansTC-Bold.ttf",
    "NotoSansTC-Medium.otf",
    "msjhbd.ttc",
    "arialbd.ttf",
  ]
  candidates = bold_candidates if bold else regular_candidates
  for name in candidates:
    try:
      return ImageFont.truetype(name, size)
    except Exception:
      continue
  return ImageFont.load_default()


def draw_multiline(draw: ImageDraw.ImageDraw, text: str, xy, font, fill, max_width):
  x, y = xy
  for line in text.split("\n"):
    # wrap manually; handle CJK (no spaces) by char length when needed
    if not line:
      y += font.size + LINE_SPACING
      continue
    words = line.split(" ")
    current = ""
    for word in words:
      test = f"{current} {word}".strip()
      bbox = draw.textbbox((0, 0), test, font=font)
      w = bbox[2] - bbox[0]
      if w <= max_width:
        current = test
      else:
        # if word itself too long (likely CJK), wrap by characters
        if not current:
          for ch in word:
            test_char = current + ch
            bbox_char = draw.textbbox((0, 0), test_char, font=font)
            w_char = bbox_char[2] - bbox_char[0]
            if w_char <= max_width:
              current = test_char
            else:
              draw.text((x, y), current, font=font, fill=fill)
              y += font.size + LINE_SPACING
              current = ch
        else:
          draw.text((x, y), current, font=font, fill=fill)
          y += font.size + LINE_SPACING
          # if very long word remains, wrap char by char
          current = ""
          for ch in word:
            test_char = current + ch
            bbox_char = draw.textbbox((0, 0), test_char, font=font)
            w_char = bbox_char[2] - bbox_char[0]
            if w_char <= max_width:
              current = test_char
            else:
              draw.text((x, y), current, font=font, fill=fill)
              y += font.size + LINE_SPACING
              current = ch
    if current:
      draw.text((x, y), current, font=font, fill=fill)
      y += font.size + LINE_SPACING
  return y


def make_card(work: dict):
  title = work.get("title", "")
  creator = work.get("creator", "")
  grade = work.get("grade", "")
  medium = work.get("medium", "")
  size = work.get("size", "")
  concept = work.get("concept", "")
  story = work.get("story", "")
  work_id = work.get("id", "")

  img = Image.new("RGB", (CARD_WIDTH, CARD_HEIGHT), color="#f5f6fa")
  draw = ImageDraw.Draw(img)
  draw.rectangle(
    [(0, 0), (CARD_WIDTH - 1, CARD_HEIGHT - 1)],
    outline="#000000",
    width=1
  )

  title_font = load_font(46, bold=True)
  subtitle_font = load_font(32, bold=True)
  body_font = load_font(28)
  small_font = load_font(22)

  y = PADDING
  draw.text((PADDING, y), creator, font=title_font, fill="#1f2937")
  y += title_font.size + LINE_SPACING
  if grade:
    draw.text((PADDING, y), grade, font=body_font, fill="#4b5563")
    y += body_font.size + 2 * LINE_SPACING

  draw.line([(PADDING, y + 20), (CARD_WIDTH - PADDING, y + 20)], fill="#cbd5e1", width=2)
  y += 60

  title_display = f"< {title} >" if title else ""
  y = draw_multiline(draw, title_display, (PADDING, y), subtitle_font, "#111827", CARD_WIDTH - 2 * PADDING)
  y += SECTION_GAP
  y = draw_multiline(draw, f"媒材：{medium}", (PADDING, y), body_font, "#111827", CARD_WIDTH - 2 * PADDING)
  y = draw_multiline(draw, f"尺寸：{size}", (PADDING, y), body_font, "#111827", CARD_WIDTH - 2 * PADDING)
  y += SECTION_GAP
  y = draw_multiline(draw, f"作品理念：{concept}", (PADDING, y), body_font, "#111827", CARD_WIDTH - 2 * PADDING)
  y += STORY_GAP
  # y = draw_multiline(draw, f"創作故事：{story}", (PADDING, y), body_font, "#111827", CARD_WIDTH - 2 * PADDING)

  link = f"{BASE_URL}?id={work_id}"
  qr_img = qrcode.make(link).resize((QR_SIZE, QR_SIZE))
  qr_x = CARD_WIDTH - PADDING - QR_SIZE
  qr_y = CARD_HEIGHT - PADDING - QR_SIZE
  img.paste(qr_img, (qr_x, qr_y))

  draw.text((qr_x, qr_y - small_font.size - 6), "作品詳情", font=small_font, fill="#1f2937")
  draw.text((PADDING, CARD_HEIGHT - PADDING - small_font.size), "32 屆 · 美術社期末成果展", font=small_font, fill="#4b5563")

  OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
  out_path = OUTPUT_DIR / f"{work_id or 'work'}.png"
  img.save(out_path)
  print(f"generated: {out_path}")


def main():
  with open(DATA_PATH, "r", encoding="utf-8") as f:
    works = json.load(f)
  for work in works:
    make_card(work)


if __name__ == "__main__":
  main()
