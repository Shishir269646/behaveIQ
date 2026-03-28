// src/services/discountService.js
const crypto = require('crypto');
const { prisma } = require('../config/database'); // Import prisma client
const AppError = require('../utils/AppError');

class DiscountService {
  // Calculate personalized discount
  async calculateDiscount(userId, productInfo) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            behavior: true, // Include UserBehavior
            personaInfo: true, // Include UserPersonaInfo
        }
      });
      
      if (!user) {
          throw new AppError('User not found for discount calculation', 404);
      }

      const factors = {
        loyalty: this.calculateLoyaltyBonus(user),
        firstTime: this.calculateFirstTimeBonus(user),
        persona: this.calculatePersonaBonus(user.personaInfo?.primary), // Access from personaInfo
        cartAbandonment: await this.calculateAbandonmentBonus(user), // Pass user object
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
      const discount = await prisma.userDiscount.create({
        data: {
          userId,
          code,
          type: 'percentage', // Assuming 'percentage' is a valid value for 'type'
          amount: totalDiscount, // Value is now 'amount' in Prisma
          reason: this.generateDiscountReasons(factors).join(','), // Convert array to string
          // applicableTo needs to be explicitly modeled if needed. Assuming it's not a direct field.
          expires: expiresAt
        }
      });

      return {
        code,
        discount: totalDiscount,
        reasons: this.generateDiscountReasons(factors),
        expiresAt,
        discountId: discount.id // Use discount.id
      };
    } catch (error) {
      console.error('Discount calculation error:', error);
      return null;
    }
  }

  calculateLoyaltyBonus(user) {
    const purchases = user?.behavior?.purchases || 0; // Access from user.behavior
    if (purchases >= 10) return 15;
    if (purchases >= 5) return 10;
    if (purchases >= 2) return 5;
    return 0;
  }

  calculateFirstTimeBonus(user) {
    return (user?.behavior?.purchases || 0) === 0 ? 15 : 0; // Access from user.behavior
  }

  calculatePersonaBonus(personaPrimary) { // Takes persona primary string directly
    const bonuses = {
      budget_buyer: 10,
      impulse_buyer: 5,
      feature_explorer: 3,
      careful_researcher: 5,
      casual_visitor: 0
    };
    return bonuses[personaPrimary] || 0;
  }

  async calculateAbandonmentBonus(user) { // Takes user object directly
    const abandons = user?.behavior?.cartAbandons || 0; // Access from user.behavior
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