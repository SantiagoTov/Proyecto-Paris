import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

def handshake_twilio():
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    
    if not sid or not token:
        print("❌ TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not found in .env")
        return False

    try:
        client = Client(sid, token)
        # Fetch account details to verify credentials
        account = client.api.accounts(sid).fetch()
        print(f"[OK] Twilio Handshake Successful! Connected to: {account.friendly_name}")
        return True
    except Exception as e:
        print(f"[FAIL] Twilio Handshake Failed: {e}")
        return False


if __name__ == "__main__":
    handshake_twilio()
