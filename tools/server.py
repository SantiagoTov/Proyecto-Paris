from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv

# Import Tools
from tools.database_manager import db
from tools.voice_provisioning import provisioner
from tools.leads_enrichment import hunter

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(title="Geo-Insight AI Navigation Layer")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models (based on gemini.md) ---
from typing import List, Optional
import uuid

# --- Data Models ---

class TargetConfig(BaseModel):
    lat: float
    lng: float
    radius_km: float
    keyword: str

class Agent(BaseModel):
    id: Optional[str] = None
    name: str
    role: str
    phone_number: str
    gender: str
    accent: str
    instructions: str
    company_info: str
    target_config: TargetConfig
    status: str = "active"

# In-memory store (Replace with DB in production)
agents_db = []

# --- Navigation Routes ---

@app.get("/")
def health_check():
    return {"status": "activo", "capa": "Navegación"}

@app.get("/agents", response_model=List[Agent])
def list_agents():
    return agents_db

@app.post("/agents", response_model=Agent)
def create_agent(agent: Agent):
    agent.id = str(uuid.uuid4())
    agents_db.append(agent)
    return agent

@app.get("/agents/{agent_id}", response_model=Agent)
def get_agent(agent_id: str):
    for a in agents_db:
        if a.id == agent_id:
            return a
    raise HTTPException(status_code=404, detail="Agente no encontrado")

@app.post("/agents/{agent_id}/start")
def start_agent_campaign(agent_id: str):
    """
    Triggers the 'Hunter' process for a specific agent.
    """
    agent = next((a for a in agents_db if a.id == agent_id), None)
    if not agent:
        raise HTTPException(status_code=404, detail="Agente no encontrado")
        
    target = agent.target_config
    
    # 1. Grid Search
    raw_leads = hunter.grid_search(target.lat, target.lng, target.radius_km, target.keyword)
    
    # 2. Log Initial Leads (Placeholder)
    # db.log_leads(agent_id, raw_leads)
    
    return {
        "status": "procesando", 
        "message": f"Campaña iniciada para agente {agent.name}",
        "leads_encontrados": len(raw_leads)
    }

@app.get("/telephony/numbers")
def list_available_numbers(country_code: str = "CO"):
    """
    Lists available phone numbers from Twilio.
    """
    numbers = provisioner.list_available_numbers(country_code)
    return {"numeros": numbers}

@app.post("/telephony/provision")
def provision_number(phone_number: str):
    """
    Purchases a number and binds it to the Vapi agent.
    """
    result = provisioner.buy_and_bind(phone_number)
    if result and result.get("status") == "success":
         return result
    else:
         raise HTTPException(status_code=500, detail=result.get("message", "Falló el aprovisionamiento"))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
