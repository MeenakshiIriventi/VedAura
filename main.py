import os
import io
import json
import motor.motor_asyncio 
from pydantic import BaseModel, Field
from bson import ObjectId
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from PIL import Image
from google import genai

# 1. Connection String
# Replace <username> and <password> with your Atlas credentials
MONGO_DETAILS = "mongodb+srv://<username>:<password>@cluster0.abc.mongodb.net/"

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)
database = client.ved_aura
user_collection = database.get_collection("users")

# 2. Custom Helper for MongoDB IDs
# MongoDB uses ObjectIds, but FastAPI works best with strings
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

app = FastAPI()

# Security configurations
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Mock User Database
users_db = {}

# Enable CORS so your frontend at :5500 can talk to :8000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration using the latest SDK
GEMINI_API_KEY = "AIzaSyCSafeTmXmJJ9dxdTwIwcahgbEoAHJ0GTA" 
client = genai.Client(api_key="AIzaSyCSafeTmXmJJ9dxdTwIwcahgbEoAHJ0GTA")

# Use 'gemini-2.0-flash' or 'gemini-1.5-flash'
MODEL_ID = "gemini-2.0-flash"

class SymptomInput(BaseModel):
    symptom: str

# --- Security Helper Functions ---

def get_password_hash(password):
    return pwd_context.hash(password)

# --- Endpoints ---

@app.get("/")
def home():
    return {"message": "Ved Aura AI Backend is running successfully!"}

# Use this to register users so the get_treatment function works
@app.post("/register/")
async def register(username: str, age: int, history: str):
    user_data = {
        "username": username,
        "age": age,
        "history": history
    }
    result = await user_collection.insert_one(user_data)
    return {"message": "User saved", "id": str(result.inserted_id)}

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Add logic to verify password and return a JWT token
    return {"access_token": form_data.username, "token_type": "bearer"}

@app.post("/get_treatment/")
async def get_treatment(data: SymptomInput):
    try:
        prompt = (
            f"Provide medical suggestions for: {data.symptom}. "
            "Return ONLY a JSON object with keys: 'Allopathy', 'Ayurveda', 'Homeopathy'. "
            "Each must have 'medicine', 'healing_time', and 'side_effects'."
        )
        
        # New SDK Syntax
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )
        
        json_text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(json_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scan_image/")
async def scan_image(file: UploadFile = File(...)):
    try:
        img_content = await file.read()
        img = Image.open(io.BytesIO(img_content))
        
        prompt = "Identify this herb/medicine. Return JSON: {'Detected Item', 'Healing Properties', 'Side Effects'}"
        
        # New SDK Syntax for Multimodal
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[prompt, img]
        )
        
        json_text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(json_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))