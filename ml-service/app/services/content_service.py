import os
import re # Added for regex matching in error handling
from openai import OpenAI
import google.generativeai as genai
from dotenv import load_dotenv
from google.api_core.exceptions import ResourceExhausted
# Import new types for safety settings
from google.generativeai.types import HarmCategory, HarmBlockThreshold

load_dotenv()

# Define safety settings to be less restrictive than defaults
# This helps prevent blocks for reasons other than RECITATION
SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}

class ContentService:
    def __init__(self):
        self.llm_provider = os.getenv("LLM_PROVIDER", "openai").lower()

        if self.llm_provider == "openai":
            self.api_key = os.getenv("OPENAI_API_KEY")
            if not self.api_key:
                raise ValueError("OPENAI_API_KEY environment variable not set.")
            self.client = OpenAI(api_key=self.api_key)
            self.model_name = "gpt-4"
            print("Initialized OpenAI client.")
        elif self.llm_provider == "gemini":
            self.api_key = os.getenv("GEMINI_API_KEY")
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY environment variable not set.")
            genai.configure(api_key=self.api_key)
            self.client = genai
            self.model_name = "models/gemini-2.5-flash-lite"

        else:
            raise ValueError(f"Unsupported LLM_PROVIDER: {self.llm_provider}. Use 'openai' or 'gemini'.")

    def list_gemini_models(self):
        """Lists available Gemini models and their capabilities."""
        if self.llm_provider == "gemini" and self.client:
            print("\n--- Listing available Gemini models ---")
            for m in self.client.list_models():
                if "generateContent" in m.supported_generation_methods:
                    print(f"Model: {m.name}, Supported methods: {m.supported_generation_methods}")
            print("--- End of Gemini models list ---\n")

    def generate_persona_content(self, persona: str, content_type: str):
        """Generates content using the selected LLM with improved error handling."""
        prompt = self._build_prompt(persona, content_type)
        try:
            if self.llm_provider == "openai":
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": "You are a world-class marketing copywriter."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=10000000000000000000,
                    temperature=0.7,
                )
                return response.choices[0].message.content.strip()
            elif self.llm_provider == "gemini":
                token_map = {
                    "headline": 100, "email_subject": 100, "cta_text": 50,
                    "product_description": 500, "social_media_post": 400,
                }
                max_tokens = token_map.get(content_type, 350)

                model = self.client.GenerativeModel(self.model_name)
                response = model.generate_content(
                    f"You are a world-class marketing copywriter. {prompt}",
                    generation_config={
                        "max_output_tokens": max_tokens,
                        "temperature": 0.75,
                    },
                    safety_settings=SAFETY_SETTINGS
                )

                if not response.candidates:
                    print(f"Gemini generation failed: No candidates returned. Prompt: '{prompt}'")
                    raise ValueError("Content generation failed: No candidates returned from the model, possibly due to severe safety filters.")

                try:
                    return response.text.strip()
                except ValueError:
                    finish_reason_name = response.candidates[0].finish_reason.name if response.candidates[0].finish_reason else "UNKNOWN"
                    error_detail = f"Content generation blocked by the model. Finish Reason: {finish_reason_name}."
                    print(error_detail)
                    raise ValueError(error_detail)

        except ResourceExhausted:
            error_message = "Gemini API quota exceeded. Please check your plan and billing details."
            print(error_message)
            raise ValueError(error_message)
        except Exception as e:
            print(f"An unexpected error occurred during content generation: {e}")
            raise e

    def _build_prompt(self, persona_description: str, content_type: str) -> str:
        """Builds a more creative and specific prompt to avoid recitation."""
        if content_type == "headline":
            return f"Generate three unique and creative headlines for a digital marketing campaign. Avoid generic or common phrases. The target persona is: '{persona_description}'."
        elif content_type == "product_description":
            return f"Write a compelling and unique product description (2-3 sentences), highlighting novel benefits for a persona described as: '{persona_description}'."
        elif content_type == "email_subject":
            return f"Generate three highly engaging and unique email subject lines for a promotional email to a persona described as: '{persona_description}'."
        elif content_type == "cta_text":
            return f"Generate three short, creative, and compelling call-to-action (CTA) phrases (max 5 words) for a button, targeting a persona described as: '{persona_description}'."
        elif content_type == "social_media_post":
            return f"Write two unique and engaging social media posts (1-2 sentences) for Twitter or LinkedIn, tailored to a persona described as: '{persona_description}'."
        else:
            return f"Generate creative and unique marketing copy for a persona described as: '{persona_description}'."

content_service = ContentService()
