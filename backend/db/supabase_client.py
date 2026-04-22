import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# We use the service key in backend to bypass RLS
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        # Provide a dummy client or raise error? We should probably just return None or raise.
        # But to allow import, we'll wait until execution.
        pass
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Global instance
supabase = get_supabase() if SUPABASE_URL and SUPABASE_SERVICE_KEY else None
