# ocr-service/main.py
import uvicorn
import tempfile
import os

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pdf_analyzer import extract_pdf_content
from field_detector import detect_fields

app = FastAPI(title="OCR Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze-pdf")
async def analyze_pdf(file: UploadFile = File(...)):
    """
    Reçoit un PDF, extrait le texte + positions,
    détecte les champs, retourne JSON pour Spring Boot.
    """
    # Validation type
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Fichier PDF requis.")

    content = await file.read()

    # Validation taille 20 Mo max
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 20 Mo).")

    # Sauvegarde temporaire sur disque
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        pages  = extract_pdf_content(tmp_path)
        fields = detect_fields(pages)

        return {
            "fieldsCount": len(fields),
            "pageCount":   len(pages),
            "fields":      fields,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'analyse : {str(e)}")

    finally:
        os.unlink(tmp_path)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
