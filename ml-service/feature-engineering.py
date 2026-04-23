"""
feature_engineering.py
URLChecker – CSCI4170
Extracts structured features from raw URLs for LightGBM training.
"""

import re
import math
import pandas as pd
from urllib.parse import urlparse
from collections import Counter

# ---------------------------------------------------------------------------
# Feature extraction
# ---------------------------------------------------------------------------

SUSPICIOUS_KEYWORDS = [
    "login", "signin", "verify", "secure", "account", "update",
    "banking", "confirm", "password", "paypal", "ebay", "amazon",
    "apple", "microsoft", "wallet", "free", "prize", "click", "alert",
]

IP_PATTERN = re.compile(
    r"(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)"
)


def entropy(s: str) -> float:
    """Shannon entropy of a string."""
    if not s:
        return 0.0
    counts = Counter(s)
    total = len(s)
    return -sum((c / total) * math.log2(c / total) for c in counts.values())


def extract_features(url: str) -> dict:
    url = str(url).strip()

    # --- Parse ---
    try:
        parsed = urlparse(url if "://" in url else "http://" + url)
    except Exception:
        parsed = urlparse("")

    scheme   = parsed.scheme or ""
    netloc   = parsed.netloc or ""
    path     = parsed.path or ""
    query    = parsed.query or ""
    fragment = parsed.fragment or ""

    # Strip port from netloc for domain analysis
    domain = netloc.split(":")[0]
    tld    = domain.rsplit(".", 1)[-1] if "." in domain else ""

    full = url.lower()

    # --- Length features ---
    f = {}
    f["url_length"]     = len(url)
    f["domain_length"]  = len(domain)
    f["path_length"]    = len(path)
    f["query_length"]   = len(query)

    # --- Count features ---
    f["dot_count"]      = url.count(".")
    f["hyphen_count"]   = url.count("-")
    f["underscore_count"] = url.count("_")
    f["slash_count"]    = url.count("/")
    f["at_count"]       = url.count("@")
    f["question_count"] = url.count("?")
    f["amp_count"]      = url.count("&")
    f["eq_count"]       = url.count("=")
    f["percent_count"]  = url.count("%")   # URL encoding (common in obfuscation)
    f["hash_count"]     = url.count("#")
    f["digit_count"]    = sum(c.isdigit() for c in url)
    f["letter_count"]   = sum(c.isalpha() for c in url)

    # Ratio of digits to total length (high = suspicious)
    f["digit_ratio"]    = f["digit_count"] / max(len(url), 1)

    # --- Subdomain depth ---
    parts = domain.split(".")
    f["subdomain_count"] = max(len(parts) - 2, 0)

    # --- Entropy (high entropy = obfuscated/random domain) ---
    f["domain_entropy"] = entropy(domain)
    f["path_entropy"]   = entropy(path)

    # --- Binary flags ---
    f["has_ip"]         = int(bool(IP_PATTERN.search(netloc)))
    f["is_https"]       = int(scheme == "https")
    f["has_port"]       = int(":" in netloc)
    f["has_at"]         = int("@" in url)
    f["has_double_slash"] = int("//" in path)   # e.g. http://evil.com//redirect
    f["has_hex_chars"]  = int(bool(re.search(r"%[0-9a-fA-F]{2}", url)))

    # Suspicious keyword count
    f["suspicious_keyword_count"] = sum(kw in full for kw in SUSPICIOUS_KEYWORDS)

    # Shortening services
    shorteners = ["bit.ly", "tinyurl", "goo.gl", "t.co", "ow.ly",
                  "is.gd", "buff.ly", "adf.ly", "shorte.st"]
    f["is_shortened"] = int(any(s in full for s in shorteners))

    # TLD risk — free/uncommon TLDs abused for phishing
    risky_tlds = {"tk", "ml", "ga", "cf", "gq", "xyz", "top",
                  "club", "work", "date", "racing", "review"}
    f["risky_tld"] = int(tld.lower() in risky_tlds)

    f["tld_length"] = len(tld)

    # Path depth (number of directories)
    f["path_depth"] = path.count("/")

    # Number of query parameters
    f["query_param_count"] = len(query.split("&")) if query else 0

    return f


# ---------------------------------------------------------------------------
# Label encoding
# ---------------------------------------------------------------------------

LABEL_MAP = {
    "benign":      0,
    "defacement":  1,
    "phishing":    2,
    "malware":     3,
}


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def build_dataset(input_csv: str, output_csv: str):
    print(f"Loading {input_csv} ...")
    df = pd.read_csv(input_csv)

    print("Extracting features ...")
    features = df["url"].apply(extract_features).apply(pd.Series)
    features["label"] = df["type"].map(LABEL_MAP)

    print(f"Feature matrix shape: {features.shape}")
    print(features.head())

    features.to_csv(output_csv, index=False)
    print(f"Saved to {output_csv}")
    return features


if __name__ == "__main__":
    build_dataset(
        input_csv="malicious_phish.csv",
        output_csv="url_features.csv",
    )
