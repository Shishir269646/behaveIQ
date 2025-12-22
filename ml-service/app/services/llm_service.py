import os
from typing import Dict, Any, List
from openai import OpenAI

class LLMService:
    """
    LLM service for content generation using OpenAI
    """
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment")
        
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4"

    def generate_content(
        self,
        prompt: str,
        persona_context: Dict[str, Any],
        tone: str = "professional"
    ) -> Dict[str, Any]:
        """
        Generate personalized content using LLM
        """
        try:
            # Build system message with persona context
            system_message = self._build_system_message(persona_context, tone)
            
            # Generate main content
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=200,
                n=1
            )
            
            main_content = response.choices[0].message.content.strip()
            
            # Generate alternatives
            alternatives = self._generate_alternatives(prompt, system_message)
            
            return {
                "content": main_content,
                "alternatives": alternatives
            }
            
        except Exception as e:
            print(f"LLM generation error: {e}")
            return {
                "content": self._fallback_content(persona_context),
                "alternatives": []
            }

    def _build_system_message(self, persona_context: Dict, tone: str) -> str:
        """Build system message with persona context"""
        persona_name = persona_context.get("name", "General Visitor")
        behavior = persona_context.get("behaviorPattern", {})
        
        context = f"""You are a marketing copywriter specializing in personalization.

Target Persona: {persona_name}
Characteristics:
- Quick Decision: {behavior.get('quickDecision', False)}
- Price Conscious: {behavior.get('priceConscious', False)}
- Feature Focused: {behavior.get('featureFocused', False)}
- Explorer: {behavior.get('exploreMore', False)}

Tone: {tone}

Write compelling, concise copy (max 50 words) that resonates with this persona."""
        
        return context

    def _generate_alternatives(self, prompt: str, system_message: str) -> List[str]:
        """Generate alternative versions"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": f"{prompt}\n\nGenerate 2 alternative versions."}
                ],
                temperature=0.8,
                max_tokens=300,
                n=1
            )
            
            content = response.choices[0].message.content.strip()
            
            # Split into alternatives
            alternatives = [alt.strip() for alt in content.split("\n\n") if alt.strip()]
            return alternatives[:2]
            
        except Exception as e:
            print(f"Alternative generation error: {e}")
            return []

    def _fallback_content(self, persona_context: Dict) -> str:
        """Fallback content if LLM fails"""
        persona_name = persona_context.get("name", "valued customer")
        return f"Discover solutions perfect for {persona_name.lower()}s like you."

