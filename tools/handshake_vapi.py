import os
import requests
from dotenv import load_dotenv

load_dotenv()

def handshake_vapi():
    api_key = os.getenv("VAPI_API_KEY")
    if not api_key:
        print("❌ VAPI_API_KEY not found in .env")
        return False

    url = "https://api.vapi.ai/assistant"
    headers = {
        "Authorization": f"Bearer {api_key}"
    }

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            print("[OK] Vapi Handshake Successful!")
            assistants = response.json()
            print(f"Found {len(assistants)} assistants.")
            return True
        else:
            print(f"[FAIL] Vapi Handshake Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"[FAIL] Vapi Handshake Failed: {e}")
        return False


if __name__ == "__main__":
    handshake_vapi()
