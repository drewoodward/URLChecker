import json
import os
import re
from urllib.parse import urlparse

import lightgbm as lgb
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

MODEL_PATH = os.getenv("MODEL_PATH", "url_model.txt")
FEATURES_PATH = os.getenv("FEATURES_PATH", "feature_names.json")
LABEL_NAMES = ["benign", "defacement", "phishing", "malware"]

SUSPICIOUS_KEYWORDS = [
    "login", "signin", "verify", "secure", "account", "update",
    "banking", "confirm", "password", "paypal", "ebay", "amazon",
    "apple", "microsoft", "wallet",
]

SHORTENERS = {
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly",
    "is.gd", "buff.ly", "adf.ly", "shorte.st",
}

RISKY_TLDS = {
    "tk", "ml", "ga", "cf", "gq", "xyz", "top",
    "club", "work", "date", "racing", "review",
}

SCHEMES = ("https://", "http://", "ftp://", "ftps://")

IP_PATTERN = re.compile(
    r"^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$"
)


def normalize_url(url: str) -> str:
    url = str(url).strip()
    lower = url.lower()
    for s in SCHEMES:
        if lower.startswith(s):
            url = url[len(s):]
            break
    if "/" not in url:
        url = url + "/"
    return url


def extract_features(url: str) -> dict:
    url = normalize_url(url)
    try:
        parsed = urlparse("http://" + url)
    except Exception:
        parsed = urlparse("http://")

    netloc = parsed.netloc or ""
    path = parsed.path or ""

    domain = netloc.split(":")[0]
    tld = domain.rsplit(".", 1)[-1].lower() if "." in domain else ""
    full = url.lower()

    parts = domain.split(".")

    return {
        "url_length":               len(url),
        "domain_length":            len(domain),
        "path_depth":               path.count("/"),
        "subdomain_count":          max(len(parts) - 2, 0),
        "domain_hyphen_count":      domain.count("-"),
        "domain_digit_count":       sum(c.isdigit() for c in domain),
        "has_ip":                   int(bool(IP_PATTERN.match(domain))),
        "has_at":                   int("@" in url),
        "has_hex_chars":            int(bool(re.search(r"%[0-9a-fA-F]{2}", url))),
        "is_shortened":             int(domain in SHORTENERS),
        "risky_tld":                int(tld in RISKY_TLDS),
        "suspicious_keyword_count": sum(kw in full for kw in SUSPICIOUS_KEYWORDS),
    }


model = lgb.Booster(model_file=MODEL_PATH)
with open(FEATURES_PATH) as fh:
    feature_names = json.load(fh)


class PredictRequest(BaseModel):
    url: str


app = FastAPI(title="URLChecker ML Service")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(req: PredictRequest):
    url = (req.url or "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="url is required")

    feats = extract_features(url)
    X = pd.DataFrame([feats])[feature_names]
    probs = model.predict(X)[0]
    idx = int(probs.argmax())
    label = LABEL_NAMES[idx]

    return {
        "url": url,
        "label": label,
        "is_malicious": label != "benign",
        "confidence": float(probs[idx]),
        "scores": {n: float(p) for n, p in zip(LABEL_NAMES, probs)},
    }
