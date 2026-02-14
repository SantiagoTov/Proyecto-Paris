import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class DatabaseManager:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("Supabase credentials missing")
        self.client: Client = create_client(url, key)

    def log_lead(self, lead_data: dict):
        """
        Inserts or updates a lead in the 'leads' table.
        """
        try:
            # Assuming 'leads' table exists as per SOP
            data, count = self.client.table("leads").upsert(lead_data).execute()
            return data
        except Exception as e:
            print(f"[FAIL] Database Log Lead Error: {e}")
            return None

    def get_org_voice_settings(self, org_id: str):
        """
        Retrieves voice settings for an organization.
        """
        try:
            data, count = self.client.table("organizations").select("voice_settings").eq("id", org_id).execute()
            if data and len(data[1]) > 0:
                return data[1][0]['voice_settings']
            return None
        except Exception as e:
            print(f"[FAIL] Database Get Org Error: {e}")
            return None

# Singleton instance
db = DatabaseManager()
