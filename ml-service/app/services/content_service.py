import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class ContentService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set.")
        self.client = OpenAI(api_key=self.api_key)

    def generate_persona_content(self, persona: str, content_type: str):
        """
        Generates content for a given persona and content type.
        """
        prompt = self._build_prompt(persona, content_type)
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert marketing copywriter."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            # In a real application, you'd want more robust logging here
            print(f"Error generating content: {e}")
            return None

    def _build_prompt(self, persona: str, content_type: str) -> str:
        """
        Builds a specific prompt based on the persona and content type.
        """
        if content_type == "headline":
            return f"Generate a catchy, persuasive headline for a marketing campaign targeting the '{persona}' persona."
        elif content_type == "product_description":
            return f"Write a compelling product description (2-3 sentences) tailored for the '{persona}' persona."
        elif content_type == "email_subject":
            return f"Create an engaging email subject line for a promotional email to the '{persona}' persona."
        else:
            return f"Generate generic marketing copy for the '{persona}' persona."

content_service = ContentService()
