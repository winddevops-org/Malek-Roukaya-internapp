# ocr-service/pdf_analyzer.py
"""
Extrait le texte et les positions (bounding boxes) de chaque
bloc de texte dans un PDF avec pdfplumber.

Retourne une liste de pages :
[
  {
    "page":   1,
    "width":  595.0,
    "height": 842.0,
    "blocks": [
      {
        "text":       "Date :",
        "x0":         48.0,
        "y0":         38.0,   ← origine HAUT-GAUCHE
        "x1":         90.0,
        "y1":         50.0,
        "x_pct":      8.1,
        "y_pct":      4.6,
        "width_pct":  7.9,
        "height_pct": 1.5,
        "font":       "Helvetica-Bold",
        "fontSize":   10.0
      },
      ...
    ]
  },
  ...
]
"""

import pdfplumber
from typing import List, Dict, Any


def extract_pdf_content(pdf_path: str) -> List[Dict[str, Any]]:
    pages_data = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            page_width  = float(page.width)
            page_height = float(page.height)

            words = page.extract_words(
                x_tolerance=3,
                y_tolerance=3,
                keep_blank_chars=False,
                use_text_flow=False,
                extra_attrs=["fontname", "size"],
            )

            blocks = _group_words_into_lines(words, page_height)

            for blk in blocks:
                blk["x_pct"]      = round(blk["x0"] / page_width  * 100, 2)
                blk["y_pct"]      = round(blk["y0"] / page_height * 100, 2)
                blk["width_pct"]  = round((blk["x1"] - blk["x0"]) / page_width  * 100, 2)
                blk["height_pct"] = round((blk["y1"] - blk["y0"]) / page_height * 100, 2)

            pages_data.append({
                "page":   page_num,
                "width":  page_width,
                "height": page_height,
                "blocks": blocks,
            })

    return pages_data


def _group_words_into_lines(
    words: List[Dict], page_height: float, y_tolerance: float = 5.0
) -> List[Dict[str, Any]]:
    if not words:
        return []

    sorted_words = sorted(words, key=lambda w: (w["top"], w["x0"]))

    lines: List[List[Dict]] = []
    current_line = [sorted_words[0]]

    for word in sorted_words[1:]:
        if abs(word["top"] - current_line[-1]["top"]) <= y_tolerance:
            current_line.append(word)
        else:
            lines.append(current_line)
            current_line = [word]
    lines.append(current_line)

    blocks = []
    for line in lines:
        text = " ".join(w["text"] for w in line).strip()
        if not text:
            continue

        x0 = min(w["x0"]     for w in line)
        y0 = min(w["top"]    for w in line)
        x1 = max(w["x1"]     for w in line)
        y1 = max(w["bottom"] for w in line)

        # Conversion origine haut-gauche
        y0_top = page_height - y1
        y1_top = page_height - y0

        font = line[0].get("fontname", "")
        size = line[0].get("size", 0)

        blocks.append({
            "text":     text,
            "x0":       round(x0, 2),
            "y0":       round(y0_top, 2),
            "x1":       round(x1, 2),
            "y1":       round(y1_top, 2),
            "font":     font,
            "fontSize": round(float(size), 1) if size else 0,
        })

    return blocks
