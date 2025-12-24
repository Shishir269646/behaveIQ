const Experiment = require('../models/Experiment');
const { asyncHandler } = require('../utils/helpers');

/**
 * @desc A service function to analyze all active experiments,
 * check for a statistically significant winner, and update the
 * experiment status if a winner is found.
 */
const analyzeActiveExperiments = async () => {
  try {
    console.log('Running job: Analyzing active experiments...');

    const activeExperiments = await Experiment.find({ status: 'active' });

    for (const experiment of activeExperiments) {
        // The results are calculated on-the-fly when fetching an experiment
        // To trigger the new logic, we can re-fetch or call the method directly.
        // We also need to update the session-based stats first.
        
        // Note: The session calculation logic is in the controller.
        // For a background job, this logic should be centralized in a service or on the model itself.
        // For now, we'll assume the stats are reasonbly up-to-date and focus on the winner declaration.

        const winnerData = experiment.calculateWinner();

        if (winnerData) {
            console.log(`Winner found for experiment: ${experiment.name}. Winner: ${winnerData.winner}`);

            experiment.results = {
                ...winnerData,
                declaredAt: new Date()
            };
            experiment.status = 'completed';
            experiment.endDate = new Date();

            await experiment.save();
            
            console.log(`Experiment ${experiment.name} has been automatically completed.`);
        }
    }
    console.log('Finished job: Analyzing active experiments.');
  } catch (error) {
    console.error('Error analyzing active experiments:', error);
  }
};

module.exports = {
    analyzeActiveExperiments
};
