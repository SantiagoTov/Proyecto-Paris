import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

def handshake_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ SUPABASE_URL or SUPABASE_KEY not found in .env")
        return False

    try:
        supabase: Client = create_client(url, key)
        # Attempt a simple operation, like listing buckets to verify connection
        res = supabase.storage.list_buckets()
        print("[OK] Supabase Handshake Successful!")
        print(f"Buckets found: {len(res)}")
        return True
    except Exception as e:
        print(f"[FAIL] Supabase Handshake Failed: {e}")
        return False


if __name__ == "__main__":
    handshake_supabase()
