import json
import math
import os
import re
from collections import Counter
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
    "apple", "microsoft", "wallet", "free", "prize", "click", "alert",
]

IP_PATTERN = re.compile(
    r"(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)"
)

SCHEMES = ("https://", "http://", "ftp://", "ftps://")

SHORTENERS = [
    "bit.ly", "tinyurl", "goo.gl", "t.co", "ow.ly",
    "is.gd", "buff.ly", "adf.ly", "shorte.st",
]

RISKY_TLDS = {
    "tk", "ml", "ga", "cf", "gq", "xyz", "top",
    "club", "work", "date", "racing", "review",
}


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


def entropy(s: str) -> float:
    if not s:
        return 0.0
    counts = Counter(s)
    total = len(s)
    return -sum((c / total) * math.log2(c / total) for c in counts.values())


def extract_features(url: str) -> dict:
    url = normalize_url(url)
    try:
        parsed = urlparse("http://" + url)
    except Exception:
        parsed = urlparse("http://")

    netloc = parsed.netloc or ""
    path = parsed.path or ""
    query = parsed.query or ""

    domain = netloc.split(":")[0]
    tld = domain.rsplit(".", 1)[-1] if "." in domain else ""
    full = url.lower()

    f = {}
    f["url_length"] = len(url)
    f["domain_length"] = len(domain)
    f["path_length"] = len(path)
    f["query_length"] = len(query)

    f["dot_count"] = url.count(".")
    f["hyphen_count"] = url.count("-")
    f["underscore_count"] = url.count("_")
    f["slash_count"] = url.count("/")
    f["at_count"] = url.count("@")
    f["question_count"] = url.count("?")
    f["amp_count"] = url.count("&")
    f["eq_count"] = url.count("=")
    f["percent_count"] = url.count("%")
    f["hash_count"] = url.count("#")
    f["digit_count"] = sum(c.isdigit() for c in url)
    f["letter_count"] = sum(c.isalpha() for c in url)
    f["digit_ratio"] = f["digit_count"] / max(len(url), 1)

    parts = domain.split(".")
    f["subdomain_count"] = max(len(parts) - 2, 0)
    f["domain_entropy"] = entropy(domain)
    f["path_entropy"] = entropy(path)
    f["path_depth"] = path.count("/")
    f["query_param_count"] = len(query.split("&")) if query else 0
    f["tld_length"] = len(tld)

    f["has_ip"] = int(bool(IP_PATTERN.search(netloc)))
    f["has_port"] = int(":" in netloc)
    f["has_at"] = int("@" in url)
    f["has_double_slash"] = int("//" in path)
    f["has_hex_chars"] = int(bool(re.search(r"%[0-9a-fA-F]{2}", url)))

    f["suspicious_keyword_count"] = sum(kw in full for kw in SUSPICIOUS_KEYWORDS)
    f["is_shortened"] = int(any(s in full for s in SHORTENERS))
    f["risky_tld"] = int(tld.lower() in RISKY_TLDS)

    return f


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
