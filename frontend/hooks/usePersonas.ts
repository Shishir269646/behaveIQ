
import { useStore } from '../store';

export const usePersonas = () => {
  const personas = useStore((state) => state.personas);
  const persona = useStore((state) => state.persona);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const fetchPersonas = useStore((state) => state.fetchPersonas);
  const discoverPersonas = useStore((state) => state.discoverPersonas);
  const fetchPersonaById = useStore((state) => state.fetchPersonaById);
  const updatePersona = useStore((state) => state.updatePersona);
  const createPersonalizationRule = useStore((state) => state.createPersonalizationRule);

  return {
    personas,
    persona,
    loading,
    error,
    fetchPersonas,
    discoverPersonas,
    fetchPersonaById,
    updatePersona,
    createPersonalizationRule,
  };
};
