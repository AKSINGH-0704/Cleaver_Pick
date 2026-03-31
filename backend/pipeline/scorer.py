DEFAULT_WEIGHTS = {"A": 0.35, "V": 0.30, "E": 0.25, "C": 0.10}

DOMAIN_PRESETS = {
    "medical":  {"A": 0.20, "V": 0.45, "E": 0.25, "C": 0.10},
    "legal":    {"A": 0.20, "V": 0.45, "E": 0.25, "C": 0.10},
    "research": {"A": 0.40, "V": 0.25, "E": 0.25, "C": 0.10},
    "code":     {"A": 0.25, "V": 0.15, "E": 0.40, "C": 0.20},
    "coding":   {"A": 0.25, "V": 0.15, "E": 0.40, "C": 0.20},
    "general":  {"A": 0.35, "V": 0.30, "E": 0.25, "C": 0.10},
    "creative": {"A": 0.25, "V": 0.20, "E": 0.40, "C": 0.15},
    "analytical": {"A": 0.40, "V": 0.25, "E": 0.25, "C": 0.10},
}

def compute_composite(A: float, V: float, E: float, C: float,
                       domain: str = "general", custom_weights: dict = None) -> dict:
    w = custom_weights or DOMAIN_PRESETS.get(domain, DEFAULT_WEIGHTS)

    R = round(w["A"] * A + w["V"] * V + w["E"] * E + w["C"] * C, 4)

    if R > 0.75:
        label, color = "High Reliability", "green"
    elif R >= 0.50:
        label, color = "Moderate", "amber"
    else:
        label, color = "Low — Flagged for Review", "red"

    return {
        "R": R, "label": label, "color": color,
        "components": {
            "agreement":    {"value": A, "weight": w["A"]},
            "verification": {"value": V, "weight": w["V"]},
            "evaluation":   {"value": E, "weight": w["E"]},
            "consistency":  {"value": C, "weight": w["C"]},
        },
        "domain": domain,
    }
