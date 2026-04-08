"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const AppError_1 = __importDefault(require("../utils/AppError"));
class DiscountService {
    /**
     * Calculate personalized discount
     */
    async calculateDiscount(userId, productInfo) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    behavior: true,
                    personaInfo: true,
                }
            });
            if (!user) {
                throw new AppError_1.default('User not found for discount calculation', 404);
            }
            const factors = {
                loyalty: this.calculateLoyaltyBonus(user),
                firstTime: this.calculateFirstTimeBonus(user),
                persona: this.calculatePersonaBonus(user.personaInfo?.primary),
                cartAbandonment: this.calculateAbandonmentBonus(user),
                seasonal: this.calculateSeasonalBonus(productInfo)
            };
            // Calculate total (max 30%)
            const totalDiscount = Math.min(Object.values(factors).reduce((a, b) => a + b, 0), 30);
            if (totalDiscount === 0) {
                return null; // No discount
            }
            // Generate discount code
            const code = this.generateDiscountCode();
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour
            // Create discount record
            const discount = await database_1.prisma.userDiscount.create({
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
        }
        catch (error) {
            console.error('Discount calculation error:', error);
            return null;
        }
    }
    calculateLoyaltyBonus(user) {
        const purchases = user?.behavior?.purchases || 0;
        if (purchases >= 10)
            return 15;
        if (purchases >= 5)
            return 10;
        if (purchases >= 2)
            return 5;
        return 0;
    }
    calculateFirstTimeBonus(user) {
        return (user?.behavior?.purchases || 0) === 0 ? 15 : 0;
    }
    calculatePersonaBonus(personaPrimary) {
        const bonuses = {
            budget_buyer: 10,
            impulse_buyer: 5,
            feature_explorer: 3,
            careful_researcher: 5,
            casual_visitor: 0
        };
        return personaPrimary ? (bonuses[personaPrimary] || 0) : 0;
    }
    calculateAbandonmentBonus(user) {
        const abandons = user?.behavior?.cartAbandons || 0;
        return abandons > 0 ? 10 : 0;
    }
    calculateSeasonalBonus(productInfo) {
        const month = new Date().getMonth();
        if ([10, 11].includes(month))
            return 5; // Nov-Dec holiday season
        return 0;
    }
    generateDiscountCode() {
        return 'BEHAVE' + crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
    }
    generateDiscountReasons(factors) {
        const reasons = [];
        if (factors.loyalty > 0)
            reasons.push('Loyal customer bonus');
        if (factors.firstTime > 0)
            reasons.push('First purchase welcome offer');
        if (factors.persona > 0)
            reasons.push('Personalized discount');
        if (factors.cartAbandonment > 0)
            reasons.push('Come back offer');
        if (factors.seasonal > 0)
            reasons.push('Seasonal sale');
        return reasons;
    }
}
const discountService = new DiscountService();
exports.default = discountService;
