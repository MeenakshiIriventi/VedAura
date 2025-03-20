from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware  # Import CORS Middleware
from pydantic import BaseModel
import random
import io
from PIL import Image
import numpy as np

app = FastAPI()

# ✅ Allow frontend (port 5500) to access backend (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change "*" to ["http://127.0.0.1:5500"] for better security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Ved Aura API is running!"}

# Sample treatment database
TREATMENT_DATABASE = {
    "fever": {
        "Allopathy": {"medicine": "Paracetamol", "healing_time": "1-2 days", "side_effects": "Mild nausea"},
        "Ayurveda": {"medicine": "Tulsi + Ginger Tea", "healing_time": "2-3 days", "side_effects": "None"},
        "Homeopathy": {"medicine": "Aconite 30C", "healing_time": "2-4 days", "side_effects": "Rare headache"}
    },
    "cough": {
        "Allopathy": {"medicine": "Cough Syrup", "healing_time": "2-3 days", "side_effects": "Drowsiness"},
        "Ayurveda": {"medicine": "Honey + Turmeric", "healing_time": "3-5 days", "side_effects": "None"},
        "Homeopathy": {"medicine": "Drosera 30C", "healing_time": "3-6 days", "side_effects": "Rare allergy"}
    }
}

class SymptomInput(BaseModel):
    symptom: str

@app.post("/get_treatment/")
async def get_treatment(data: SymptomInput):
    symptom = data.symptom.lower()
    if symptom in TREATMENT_DATABASE:
        return {"Treatment Options": TREATMENT_DATABASE[symptom]}
    else:
        return {"message": "No data available for this symptom"}

# Image processing endpoint
@app.post("/scan_image/")
async def scan_image(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    image = np.array(image)

    detected_items = ["Aloe Vera", "Ginger", "Paracetamol"]
    identified = random.choice(detected_items)

    return {
        "Detected Item": identified,
        "Healing Properties": f"Useful for {random.choice(['inflammation', 'pain relief', 'immunity boost'])}",
        "Side Effects": "Minimal"
    }
