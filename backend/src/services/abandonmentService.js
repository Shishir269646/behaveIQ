const mlServiceClient = require('./mlServiceClient');
const Session = require('../models/Session');
const Intervention = require('../models/Intervention');
const Website = require('../models/Website'); // Needed to get website settings for interventions

const predictAbandonmentRisk = async (sessionId, websiteId, userId) => {
    try {
        const session = await Session.findById(sessionId);
        if (!session) {
            console.warn(`[AbandonmentService] Session not found for ID: ${sessionId}`);
            return { riskScore: 0, prediction: 'low_risk', recommendedIntervention: 'none' };
        }

        // Extract relevant features for ML prediction
        const features = {
            timeOnPage: session.duration || 0,
            pageViewCount: session.behavior.pageViews.length,
            cartActionCount: session.behavior.cartActions.length,
            intentScore: session.intentScore?.current || 0,
            // Add more features from session.behavior as needed by the ML model
            // e.g., lastPageViewTime, timeSinceLastCartAction, scrollDepth
        };

        const mlResult = await mlServiceClient.callMLService('/predict/abandonment', {
            websiteId: websiteId.toString(),
            sessionId: sessionId.toString(),
            features: features
        });

        const riskScore = mlResult.riskScore || 0;
        const prediction = mlResult.prediction || 'low_risk';
        const recommendedIntervention = mlResult.recommendedIntervention || 'none'; // ML model suggests intervention

        // Update session's abandonment risk
        session.abandonmentRisk = {
            score: riskScore,
            prediction: prediction,
            timestamp: new Date()
        };
        await session.save();

        return {
            riskScore,
            prediction,
            recommendedIntervention
        };
    } catch (error) {
        console.error('[AbandonmentService] Error predicting abandonment risk:', error);
        // Fallback to default or safe values if ML service fails
        return { riskScore: 0.1, prediction: 'low_risk', recommendedIntervention: 'none' };
    }
};

const trackInterventionResponse = async (interventionId, responseStatus, sessionOutcome = null) => {
    try {
        const intervention = await Intervention.findById(interventionId);
        if (!intervention) {
            console.warn(`[AbandonmentService] Intervention not found for ID: ${interventionId}`);
            return { success: false, message: 'Intervention not found' };
        }

        intervention.response.status = responseStatus;
        intervention.response.timestamp = new Date();

        // Calculate effectiveness based on outcome (e.g., if user converted after intervention)
        if (sessionOutcome === 'purchase') {
            intervention.response.effectiveness = 1; // 100% effective
            intervention.outcome.prevented = true;
            intervention.outcome.converted = true;
            // Assuming we might also get revenue data
            // intervention.outcome.revenue = someRevenueValue;
        } else if (responseStatus === 'clicked') {
            intervention.response.effectiveness = 0.5; // Partial effectiveness
        } else {
            intervention.response.effectiveness = 0; // Not effective
        }

        await intervention.save();

        // Optionally, update the session outcome if provided
        if (sessionOutcome) {
            await Session.findByIdAndUpdate(intervention.sessionId, { outcome: sessionOutcome });
        }

        return { success: true, intervention };
    } catch (error) {
        console.error('[AbandonmentService] Error tracking intervention response:', error);
        throw error;
    }
};

module.exports = {
    predictAbandonmentRisk,
    trackInterventionResponse
};
