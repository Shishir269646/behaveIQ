
import { useStore } from '../store';

export const useExperiments = () => {
  const experiments = useStore((state) => state.experiments);
  const experiment = useStore((state) => state.experiment);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const success = useStore((state) => state.success);
  const fetchExperiments = useStore((state) => state.fetchExperiments);
  const createExperiment = useStore((state) => state.createExperiment);
  const fetchExperimentById = useStore((state) => state.fetchExperimentById);
  const updateExperimentStatus = useStore((state) => state.updateExperimentStatus);
  const declareWinner = useStore((state) => state.declareWinner);
  const clearSuccess = useStore((state) => state.clearSuccess);

  return {
    experiments,
    experiment,
    loading,
    error,
    success,
    fetchExperiments,
    createExperiment,
    fetchExperimentById,
    updateExperimentStatus,
    declareWinner,
    clearSuccess,
  };
};
