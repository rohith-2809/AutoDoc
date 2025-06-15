# uml-agent.py
import os
import re
import time
import zlib
import logging
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# ── Config ──
DOCBUILDER_URL  = os.getenv("DOCBUILDER_URL", "http://localhost:5002")
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY")
PLANTUML_SERVER = "http://www.plantuml.com/plantuml/png"
EXPORT_STATIC   = os.getenv("STATIC_DIR", "static")

os.makedirs(EXPORT_STATIC, exist_ok=True)

# ── Logging ──
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
log = logging.getLogger(__name__)

# ── Flask & CORS ──
app = Flask(__name__)
CORS(app)

# ── Gemini setup ──
if not GEMINI_API_KEY:
    log.critical("GEMINI_API_KEY not set")
    raise RuntimeError("GEMINI_API_KEY not set")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("models/gemini-1.5-flash")


def plantuml_encode(text: str) -> str:
    data = zlib.compress(text.encode("utf-8"))[2:-4]
    alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"
    out = ""
    for i in range(0, len(data), 3):
        chunk = data[i:i+3].ljust(3, b'\x00')
        b1,b2,b3 = chunk
        out += alphabet[b1>>2]
        out += alphabet[((b1&0x3)<<4)|(b2>>4)]
        out += alphabet[((b2&0xF)<<2)|(b3>>6)]
        out += alphabet[b3&0x3F]
    return out


@app.route("/generate-uml-image", methods=["POST"])
def generate_uml_image():
    start = time.time()
    payload      = request.get_json(force=True) or {}
    abstract     = payload.get("abstract", "").strip()
    instructions = payload.get("instructions", "").strip()

    log.info("UML request: abstract len=%d, instr len=%d",
             len(abstract), len(instructions))

    # Phase 1: list diagram types
    prompt_list = (
        "You are a UML expert. From this description, list ALL useful UML "
        "diagram types and a one-line description each, in format:\n"
        "- Type: desc\n\n"
        f"System description:\n{abstract}"
    )
    try:
        resp = model.generate_content(prompt_list)
        list_text = resp.text.strip()
    except Exception as e:
        log.error("Phase 1 error: %s", e)
        return jsonify({"error": "diagram-list-failed"}), 500

    specs = []
    for line in list_text.splitlines():
        m = re.match(r"[-*]\s*(.+?):\s*(.+)$", line)
        if m:
            specs.append((m.group(1).strip(), m.group(2).strip()))
    if not specs:
        log.warning("No diagram specs parsed")
        return jsonify({"error": "no-diagrams"}), 400

    diagrams = []

    # Phase 2: generate each diagram
    for idx, (dtype, desc) in enumerate(specs, start=1):
        # clean dtype for filenames
        dtype_clean = re.sub(r"[^0-9A-Za-z _-]", "", dtype).strip().replace(" ", "_")
        log.info("Generating diagram [%d/%d]: %s", idx, len(specs), dtype_clean)

        prompt_uml = (
            f"You are a PlantUML syntax expert. Output a fenced ```plantuml``` block "
            f"for a {dtype} diagram:\n{desc}\nOnly the fenced block."
        )
        try:
            uml_resp = model.generate_content(prompt_uml).text or ""
        except Exception as e:
            log.error("Phase 2 error for %s: %s", dtype_clean, e)
            continue

        for j, uml in enumerate(re.findall(r"```plantuml\s*(.*?)```", uml_resp, re.DOTALL), start=1):
            encoded = plantuml_encode(uml)
            url     = f"{PLANTUML_SERVER}/{encoded}"
            try:
                img_r = requests.get(url, timeout=15)
                if img_r.status_code!=200 or "image" not in img_r.headers.get("Content-Type",""):
                    log.warning("Bad image for %s #%d", dtype_clean, j)
                    continue
            except Exception as e:
                log.warning("Fetch error for %s #%d: %s", dtype_clean, j, e)
                continue

            # save file
            filename = f"{dtype_clean}_{j}.png"
            filepath = os.path.join(EXPORT_STATIC, filename)
            try:
                with open(filepath,'wb') as f:
                    f.write(img_r.content)
                log.info("Saved image: %s", filepath)
            except Exception as e:
                log.error("Save failed %s: %s", filepath, e)
                continue

            # ingest to DocBuilder
            try:
                r = requests.post(
                    f"{DOCBUILDER_URL}/ingest-diagram",
                    files={"image": (filename, img_r.content, "image/png")},
                    data={
                        "build_id":    payload.get("build_id","default"),
                        "diagramType": dtype_clean,
                        "description": desc,
                        "index":       j
                    }, timeout=10
                )
                log.info("Ingest %s #%d → %s", dtype_clean, j, r.status_code)
            except Exception as e:
                log.error("Push error for %s #%d: %s", dtype_clean, j, e)

            diagrams.append({
                "diagramType": dtype_clean,
                "description": desc,
                "index":       j,
                "path_local":  filepath
            })

    duration = time.time()-start
    log.info("UML complete: %d diagrams in %.2fs", len(diagrams), duration)
    return jsonify({
        "status":   "completed",
        "diagrams": diagrams,
        "duration": round(duration,2)
    }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
