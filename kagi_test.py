from kagiapi import KagiClient
from dotenv import load_dotenv
import os

load_dotenv()

kagi_client = KagiClient(api_key=os.getenv("KAGI_API_KEY"))

query = "grand canyon"
results = kagi_client.search(query, limit=10)

print(results)
