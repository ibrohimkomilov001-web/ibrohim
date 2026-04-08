"""
CLIP Image Embedding Microservice
Accepts an image upload and returns a 512-dim embedding vector.
Also supports text-to-embedding for text-based similarity.
"""

import io
import logging
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from PIL import Image
from sentence_transformers import SentenceTransformer

logger = logging.getLogger("clip-service")
logging.basicConfig(level=logging.INFO)

model: SentenceTransformer | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    logger.info("Loading CLIP model (clip-ViT-B-32)...")
    model = SentenceTransformer("clip-ViT-B-32")
    logger.info("CLIP model loaded successfully")
    yield
    model = None


app = FastAPI(title="CLIP Embedding Service", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/embed/image")
async def embed_image(file: UploadFile = File(...)):
    """Generate a 512-dim CLIP embedding from an uploaded image."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Limit file size to 10MB
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    embedding = model.encode(image, normalize_embeddings=True)
    return {"embedding": embedding.tolist(), "dimensions": len(embedding)}


@app.post("/embed/text")
async def embed_text(text: str = Form(...)):
    """Generate a 512-dim CLIP embedding from text."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    embedding = model.encode(text, normalize_embeddings=True)
    return {"embedding": embedding.tolist(), "dimensions": len(embedding)}


@app.post("/embed/url")
async def embed_image_url(url: str = Form(...)):
    """Generate a CLIP embedding from an image URL."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    import urllib.request
    import urllib.error

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CLIP-Service/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.length and resp.length > 10 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="Image too large")
            contents = resp.read(10 * 1024 * 1024 + 1)
            if len(contents) > 10 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="Image too large")
    except urllib.error.URLError:
        raise HTTPException(status_code=400, detail="Failed to fetch image from URL")

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image at URL")

    embedding = model.encode(image, normalize_embeddings=True)
    return {"embedding": embedding.tolist(), "dimensions": len(embedding)}


@app.post("/similarity")
async def compute_similarity(
    file: UploadFile = File(...),
    texts: str = Form(default=""),
):
    """Compute similarity between an image and a list of text descriptions."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large")

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    text_list = [t.strip() for t in texts.split("|") if t.strip()]
    if not text_list:
        raise HTTPException(status_code=400, detail="No texts provided")

    img_emb = model.encode(image, normalize_embeddings=True)
    text_embs = model.encode(text_list, normalize_embeddings=True)

    # Cosine similarity (already normalized)
    similarities = np.dot(text_embs, img_emb).tolist()

    results = [
        {"text": t, "score": round(s, 4)}
        for t, s in sorted(zip(text_list, similarities), key=lambda x: -x[1])
    ]
    return {"results": results}
