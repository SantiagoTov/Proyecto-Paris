import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

def handshake_groq():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found in .env")
        return False

    try:
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": "Hello, is this connection working?",
                }
            ],
            model="llama-3.1-8b-instant",
        )
        print("[OK] Groq Handshake Successful!")
        print(f"Response: {chat_completion.choices[0].message.content}")
        return True
    except Exception as e:
        print(f"[FAIL] Groq Handshake Failed: {e}")
        return False

if __name__ == "__main__":
    handshake_groq()
