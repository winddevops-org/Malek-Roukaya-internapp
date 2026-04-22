# ocr-service/field_detector.py
"""
Détecteur de champs basé sur des règles regex.

Types retournés → correspondance ModelField.type en BDD :
  "texte"         → "text"
  "texte_long"    → "textarea"
  "date"          → "date"
  "case_a_cocher" → "checkbox"

Positions retournées en % (0-100).
Spring Boot (ModelFromOcrService) les convertit en pixels canvas A4.
"""

import re
from typing import List, Dict, Any, Optional


# ── Règles label → type ───────────────────────────────────────────────────

LABEL_RULES: List[tuple] = [
    (re.compile(r"\b(date|le\b|du\b|échéance|expir|validité|livraison|émission)\b", re.I), "date"),
    (re.compile(r"\b(description|d[eé]signation|objet|libell[eé]|commentaire|remarque|note|observation|motif)\b", re.I), "texte_long"),
    (re.compile(r"\b(oui|non|accord|cocher|s[eé]lectionner)\b", re.I), "case_a_cocher"),
    (re.compile(r"\b(n°|num[eé]ro|r[eé]f[eé]rence|ref\.?|facture|bon\s*n|commande|devis|\bid\b)\b", re.I), "texte"),
    (re.compile(r"\b(e-?mail|courriel|mail|t[eé]l[eé]?phone?|tél\.?|fax|mobile|gsm)\b", re.I), "texte"),
    (re.compile(r"\b(montant|total|prix|ht\b|ttc\b|tva|remise|acompte|solde|net\s*à\s*payer)\b", re.I), "texte"),
    (re.compile(r"\b(nom|pr[eé]nom|raison\s*sociale|soci[eé]t[eé]|client|fournisseur|destinataire|exp[eé]diteur|acheteur|vendeur|contact)\b", re.I), "texte"),
    (re.compile(r"\b(adresse|rue|avenue|boulevard|ville|code[\s-]?postal|cp\b|pays|r[eé]gion|wilaya|commune)\b", re.I), "texte"),
    (re.compile(r"\b(signature|sign[eé]|cachet|tampon|visa|approuv[eé])\b", re.I), "texte"),
    (re.compile(r"\b(qté|quantit[eé]|unit[eé]|qte|nbre|nombre)\b", re.I), "texte"),
    (re.compile(r"\b(siret|siren|tva\s*intra|rcs|naf|ape|rc\b|if\b|tp\b|ice\b)\b", re.I), "texte"),
    (re.compile(r"\b(iban|bic|rib|compte\s*bancaire|banque)\b", re.I), "texte"),
]

# Valeurs déjà remplies à ignorer
VALUE_REGEXES = [
    re.compile(r"^\d{1,2}[/\-\.]\d{1,2}[/\-\.](\d{2}|\d{4})$"),
    re.compile(r"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$", re.I),
    re.compile(r"^\d{1,3}([.,\s]\d{3})*([.,]\d{2})?\s*[€$£]?$"),
    re.compile(r"^\d{14}$"),
    re.compile(r"^\d{9}$"),
    re.compile(r"^0[67][\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}$"),
]

IGNORE_RE = re.compile(
    r"^\s*(page\s*\d+|©|\d+\s*/\s*\d+|www\.|https?://|"
    r"tous\s*droits|confidentiel|généré|^\d+$|^[A-Z]{1,2}$)\s*$",
    re.I,
)

MAX_LABEL_WORDS = 6


# ── Détection principale ───────────────────────────────────────────────────

def detect_fields(pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    fields = []
    seen: set = set()

    for page_data in pages:
        page_num    = page_data["page"]
        page_width  = page_data["width"]
        page_height = page_data["height"]

        for block in page_data["blocks"]:
            text = block["text"].strip()

            if not text or IGNORE_RE.match(text):
                continue
            if _is_pure_value(text):
                continue
            if len(text.split()) > MAX_LABEL_WORDS:
                continue

            field_type = _classify(text)
            if field_type is None:
                continue

            clean = _clean_label(text)
            key   = clean.lower()
            if key in seen:
                continue
            seen.add(key)

            fx, fy, fw, fh = _field_zone(block, page_width, page_height)

            if field_type == "texte_long":
                fh = min(fh * 3, 12.0)
            elif field_type == "case_a_cocher":
                fw, fh = 3.0, 3.0

            fields.append({
                "label":      clean,
                "type":       field_type,
                "xPct":       fx,
                "yPct":       fy,
                "widthPct":   fw,
                "heightPct":  fh,
                "page":       page_num,
                "required":   _is_required(clean),
            })

    return fields


# ── Helpers ────────────────────────────────────────────────────────────────

def _classify(text: str) -> Optional[str]:
    for pattern, ftype in LABEL_RULES:
        if pattern.search(text):
            return ftype
    return None


def _is_pure_value(text: str) -> bool:
    for rx in VALUE_REGEXES:
        if rx.match(text.strip()):
            return True
    return False


def _clean_label(text: str) -> str:
    cleaned = re.sub(r"[\s:*\.\-]+$", "", text).strip()
    return cleaned[0].upper() + cleaned[1:] if cleaned else cleaned


def _field_zone(block: Dict, pw: float, ph: float) -> tuple:
    lx0, ly0, lx1, ly1 = block["x0"], block["y0"], block["x1"], block["y1"]
    lh = max(ly1 - ly0, 1.0)

    if (lx1 / pw * 100) < 45:
        # Champ à droite du label
        fx = lx1 + 4
        fy = ly0
        fw = max(pw * 0.35, 80)
        fh = lh
    else:
        # Champ sous le label
        fx = lx0
        fy = ly1 + 3
        fw = pw * 0.55
        fh = lh * 1.2

    x_pct = round(min(fx / pw * 100, 95.0), 2)
    y_pct = round(min(fy / ph * 100, 95.0), 2)
    w_pct = round(min(fw / pw * 100, 100.0 - x_pct), 2)
    h_pct = round(max(fh / ph * 100, 2.5), 2)

    return x_pct, y_pct, w_pct, h_pct


def _is_required(label: str) -> bool:
    rx = re.compile(
        r"\b(date|nom|raison\s*sociale|total|ttc|n°|r[eé]f[eé]rence|client|fournisseur)\b",
        re.I,
    )
    return bool(rx.search(label))
