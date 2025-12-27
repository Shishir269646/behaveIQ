// src/services/discountService.js
const crypto = require('crypto');
const Discount = require('../models/Discount');
const User = require('../models/User');

class DiscountService {
  // Calculate personalized discount
  async calculateDiscount(userId, productInfo) {
    try {
      const user = await User.findById(userId);
      
      const factors = {
        loyalty: this.calculateLoyaltyBonus(user),
        firstTime: this.calculateFirstTimeBonus(user),
        persona: this.calculatePersonaBonus(user.persona.primary),
        cartAbandonment: await this.calculateAbandonmentBonus(userId),
        seasonal: this.calculateSeasonalBonus(productInfo)
      };

      // Calculate total (max 30%)
      const totalDiscount = Math.min(
        Object.values(factors).reduce((a, b) => a + b, 0),
        30
      );

      if (totalDiscount === 0) {
        return null; // No discount
      }

      // Generate discount code
      const code = this.generateDiscountCode();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      // Create discount record
      const discount = await Discount.create({
        userId,
        code,
        type: 'percentage',
        value: totalDiscount,
        reasons: Object.entries(factors)
          .filter(([_, value]) => value > 0)
          .map(([factor, value]) => ({ factor, value })),
        applicableTo: {
          products: productInfo.productIds || [],
          minAmount: 0
        },
        expiresAt
      });

      return {
        code,
        discount: totalDiscount,
        reasons: this.generateDiscountReasons(factors),
        expiresAt,
        discountId: discount._id
      };
    } catch (error) {
      console.error('Discount calculation error:', error);
      return null;
    }
  }

  calculateLoyaltyBonus(user) {
    const purchases = user?.behavior?.purchases || 0;
    if (purchases >= 10) return 15;
    if (purchases >= 5) return 10;
    if (purchases >= 2) return 5;
    return 0;
  }

  calculateFirstTimeBonus(user) {
    return (user?.behavior?.purchases || 0) === 0 ? 15 : 0;
  }

  calculatePersonaBonus(persona) {
    const bonuses = {
      budget_buyer: 10,
      impulse_buyer: 5,
      feature_explorer: 3,
      careful_researcher: 5,
      casual_visitor: 0
    };
    return bonuses[persona] || 0;
  }

  async calculateAbandonmentBonus(userId) {
    const user = await User.findById(userId);
    const abandons = user?.behavior?.cartAbandons || 0;
    return abandons > 0 ? 10 : 0;
  }

  calculateSeasonalBonus(productInfo) {
    // Simple seasonal logic (can be enhanced)
    const month = new Date().getMonth();
    if ([10, 11].includes(month)) return 5; // Nov-Dec holiday season
    return 0;
  }

  generateDiscountCode() {
    return 'BEHAVE' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  generateDiscountReasons(factors) {
    const reasons = [];
    if (factors.loyalty > 0) reasons.push('Loyal customer bonus');
    if (factors.firstTime > 0) reasons.push('First purchase welcome offer');
    if (factors.persona > 0) reasons.push('Personalized discount');
    if (factors.cartAbandonment > 0) reasons.push('Come back offer');
    if (factors.seasonal > 0) reasons.push('Seasonal sale');
    return reasons;
  }
}

module.exports = new DiscountService();