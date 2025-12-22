from typing import List, Dict, Any

class ContentRecommender:
    """
    Generate personalized content recommendations
    """
    
    def __init__(self):
        # Persona-specific content strategies
        self.strategies = {
            "Budget Buyer": {
                "headlines": ["Best Value", "Save More", "Special Offer"],
                "cta": ["Get Deal Now", "See Pricing", "Compare Plans"],
                "focus": "price"
            },
            "Feature Explorer": {
                "headlines": ["Advanced Features", "Full Capabilities", "Technical Specs"],
                "cta": ["Learn More", "See Features", "View Demo"],
                "focus": "features"
            },
            "Careful Researcher": {
                "headlines": ["Complete Guide", "Detailed Analysis", "Expert Review"],
                "cta": ["Read Full Review", "Download Guide", "Schedule Demo"],
                "focus": "information"
            },
            "Impulse Buyer": {
                "headlines": ["Limited Time Offer", "Act Now", "Don't Miss Out"],
                "cta": ["Buy Now", "Get Started", "Claim Offer"],
                "focus": "urgency"
            },
            "Casual Visitor": {
                "headlines": ["Welcome", "Discover", "Explore"],
                "cta": ["Learn More", "Browse", "See Options"],
                "focus": "exploration"
            }
        }

    def generate_recommendations(
        self,
        persona_type: str,
        current_page: str,
        user_history: List[str] = []
    ) -> List[Dict[str, Any]]:
        """
        Generate personalized recommendations
        """
        strategy = self.strategies.get(persona_type, self.strategies["Casual Visitor"])
        
        recommendations = []
        
        # Homepage headline
        if "/" in current_page or "home" in current_page.lower():
            recommendations.append({
                "element": ".hero-title",
                "content": self._generate_headline(strategy, "home"),
                "reason": f"Optimized for {persona_type}",
                "priority": 1
            })
            
            recommendations.append({
                "element": ".cta-button",
                "content": strategy["cta"][0],
                "reason": f"CTA tailored for {persona_type}",
                "priority": 1
            })
        
        # Pricing page
        if "pricing" in current_page.lower():
            if strategy["focus"] == "price":
                recommendations.append({
                    "element": ".pricing-highlight",
                    "content": "💰 Best Value for Your Money",
                    "reason": "Price-conscious visitor",
                    "priority": 1
                })
            elif strategy["focus"] == "features":
                recommendations.append({
                    "element": ".pricing-highlight",
                    "content": "⚡ All Premium Features Included",
                    "reason": "Feature-focused visitor",
                    "priority": 1
                })
        
        # Product page
        if "product" in current_page.lower() or "features" in current_page.lower():
            if strategy["focus"] == "features":
                recommendations.append({
                    "element": ".product-description",
                    "content": "Explore our advanced capabilities and technical specifications",
                    "reason": "Technical detail seeker",
                    "priority": 1
                })
            elif strategy["focus"] == "urgency":
                recommendations.append({
                    "element": ".product-cta",
                    "content": "⏰ Limited Time: Get 20% Off Today!",
                    "reason": "Urgency-driven buyer",
                    "priority": 2
                })
        
        # History-based recommendations
        if len(user_history) > 3:
            recommendations.append({
                "element": ".recommendation-banner",
                "content": "Based on your interest, we recommend...",
                "reason": "Returning visitor pattern detected",
                "priority": 2
            })
        
        return recommendations

    def _generate_headline(self, strategy: Dict, page_type: str) -> str:
        """Generate contextual headline"""
        if strategy["focus"] == "price":
            return "Get More, Pay Less"
        elif strategy["focus"] == "features":
            return "Powerful Features, Unmatched Performance"
        elif strategy["focus"] == "urgency":
            return "Limited Time Offer - Act Now!"
        elif strategy["focus"] == "information":
            return "Everything You Need to Know"
        else:
            return "Welcome to Your Solution"

