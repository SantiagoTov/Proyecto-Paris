import os
from twilio.rest import Client
import requests
from dotenv import load_dotenv

load_dotenv()

class VoiceProvisioner:
    def __init__(self):
        self.twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.vapi_key = os.getenv("VAPI_API_KEY")
        
        if self.twilio_sid and self.twilio_token:
            self.twilio_client = Client(self.twilio_sid, self.twilio_token)
        else:
            self.twilio_client = None

    def list_available_numbers(self, country_code="CO"):
        """
        Lists available local phone numbers in the specified country.
        """
        if not self.twilio_client:
            return []
        
        try:
            local = self.twilio_client.available_phone_numbers(country_code).local.list(limit=10)
            return [{"phone_number": num.phone_number, "capabilities": num.capabilities} for num in local]
        except Exception as e:
            print(f"[FAIL] Twilio List Numbers Error: {e}")
            return []

    def buy_and_bind(self, phone_number: str, voice_url_base="https://api.vapi.ai/phone/twilio"):
        """
        Purchases a number and configures it with Vapi's webhook.
        """
        if not self.twilio_client:
            return None

        try:
            # 1. Buy Number
            incoming_phone_number = self.twilio_client.incoming_phone_numbers.create(
                phone_number=phone_number
            )
            sid = incoming_phone_number.sid
            
            # 2. Update Voice URL (Bind to Vapi)
            # Note: Vapi typically requires you to import the number into their system via API as well.
            # Here we point the Twilio number to Vapi's SIP/Webhook
            self.twilio_client.incoming_phone_numbers(sid).update(
                voice_url=voice_url_base
            )
            
            # 3. Import to Vapi (Hypothetical Vapi API call)
            # self._import_to_vapi(phone_number)

            return {"status": "success", "sid": sid, "phone": phone_number}

        except Exception as e:
            print(f"[FAIL] Provisioning Error: {e}")
            return {"status": "error", "message": str(e)}

    def _import_to_vapi(self, phone_number):
        url = "https://api.vapi.ai/phone-number"
        payload = {"number": phone_number, "provider": "twilio"}
        headers = {"Authorization": f"Bearer {self.vapi_key}", "Content-Type": "application/json"}
        requests.post(url, json=payload, headers=headers)

provisioner = VoiceProvisioner()
