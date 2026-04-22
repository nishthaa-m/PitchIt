import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# OpenRouter Configuration
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OR_CLIENT = None

if OPENROUTER_API_KEY:
    OR_CLIENT = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
        default_headers={
            "HTTP-Referer": "https://github.com/nishthaa-m/PitchIt", # Optional, for OpenRouter rankings
            "X-Title": "PitchIt", # Optional, for OpenRouter rankings
        }
    )

def get_model():
    # Switch to 3.2 3B for better free tier availability
    return "meta-llama/llama-3.2-3b-instruct:free"
