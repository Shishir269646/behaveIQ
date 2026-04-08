import crypto from 'crypto';
import { prisma } from '../config/database';
import AppError from '../utils/AppError';

class DiscountService {
  /**
   * Calculate personalized discount
   */
  async calculateDiscount(userId: string, productInfo: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            behavior: true,
            personaInfo: true,
        }
      });
      
      if (!user) {
          throw new AppError('User not found for discount calculation', 404);
      }

      const factors = {
        loyalty: this.calculateLoyaltyBonus(user),
        firstTime: this.calculateFirstTimeBonus(user),
        persona: this.calculatePersonaBonus(user.personaInfo?.primary),
        cartAbandonment: this.calculateAbandonmentBonus(user),
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
          amount: totalDiscount,
          reason: this.generateDiscountReasons(factors).join(','),
          expires: expiresAt
        }
      });

      return {
        code,
        discount: totalDiscount,
        reasons: this.generateDiscountReasons(factors),
        expiresAt,
        discountId: discount.id
      };
    } catch (error) {
      console.error('Discount calculation error:', error);
      return null;
    }
  }

  private calculateLoyaltyBonus(user: any): number {
    const purchases = user?.behavior?.purchases || 0;
    if (purchases >= 10) return 15;
    if (purchases >= 5) return 10;
    if (purchases >= 2) return 5;
    return 0;
  }

  private calculateFirstTimeBonus(user: any): number {
    return (user?.behavior?.purchases || 0) === 0 ? 15 : 0;
  }

  private calculatePersonaBonus(personaPrimary: string | undefined): number {
    const bonuses: Record<string, number> = {
      budget_buyer: 10,
      impulse_buyer: 5,
      feature_explorer: 3,
      careful_researcher: 5,
      casual_visitor: 0
    };
    return personaPrimary ? (bonuses[personaPrimary] || 0) : 0;
  }

  private calculateAbandonmentBonus(user: any): number {
    const abandons = user?.behavior?.cartAbandons || 0;
    return abandons > 0 ? 10 : 0;
  }

  private calculateSeasonalBonus(productInfo: any): number {
    const month = new Date().getMonth();
    if ([10, 11].includes(month)) return 5; // Nov-Dec holiday season
    return 0;
  }

  private generateDiscountCode(): string {
    return 'BEHAVE' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  private generateDiscountReasons(factors: Record<string, number>): string[] {
    const reasons = [];
    if (factors.loyalty > 0) reasons.push('Loyal customer bonus');
    if (factors.firstTime > 0) reasons.push('First purchase welcome offer');
    if (factors.persona > 0) reasons.push('Personalized discount');
    if (factors.cartAbandonment > 0) reasons.push('Come back offer');
    if (factors.seasonal > 0) reasons.push('Seasonal sale');
    return reasons;
  }
}

const discountService = new DiscountService();
export default discountService;
