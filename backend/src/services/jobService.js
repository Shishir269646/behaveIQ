const Experiment = require('../models/Experiment');
const { asyncHandler } = require('../utils/helpers');


const analyzeActiveExperiments = async () => {
  try {
    console.log('Running job: Analyzing active experiments...');

    const activeExperiments = await Experiment.find({ status: 'active' });

    for (const experiment of activeExperiments) {

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
