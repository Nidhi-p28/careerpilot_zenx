# from openai import OpenAI
# from dotenv import load_dotenv
# import os

# load_dotenv()

# client = OpenAI(
#     api_key=os.getenv("FEATHERLESS_API_KEY"),
#     base_url=os.getenv("FEATHERLESS_BASE_URL")
# )

# response = client.chat.completions.create(
#     model=os.getenv("FEATHERLESS_MODEL"),
#     messages=[{"role": "user", "content": "Say hello"}]
# )

# print(response.choices[0].message.content)