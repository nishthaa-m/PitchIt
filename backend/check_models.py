import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
gemini_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=gemini_key)

print("Listing available flash models...")
try:
    for model in client.models.list():
        if "flash" in model.name.lower():
            print(f"Name: {model.name}")
except Exception as e:
    print(f"Error: {e}")
