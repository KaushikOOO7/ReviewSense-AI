import { useCallback, useEffect, useState } from 'react';
import { getHealth, getModels } from '../services/api';

export function useApiStatus({ pollInterval = 30_000 } = {}) {
  const [health, setHealth] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [selectedModel, setSelectedModel] = useState('simple_rnn');
  const [isChecking, setIsChecking] = useState(true);

  const refreshStatus = useCallback(async () => {
    setIsChecking(true);
    const [healthResult, modelsResult] = await Promise.allSettled([getHealth(), getModels()]);
    if (healthResult.status === 'fulfilled') {
      setHealth(healthResult.value);
    } else {
      setHealth(null);
    }
    if (modelsResult.status === 'fulfilled') {
      const payload = modelsResult.value;
      setModelData(payload);
      if (payload.selected_model) {
        setSelectedModel((current) => {
          const currentAvailable = payload.models?.some((item) => item.key === current && item.available);
          return currentAvailable ? current : payload.selected_model;
        });
      }
    } else {
      setModelData(null);
    }
    setIsChecking(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      if (!isMounted) return;
      await refreshStatus();
    };
    check();
    const interval = window.setInterval(check, pollInterval);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [refreshStatus, pollInterval]);

  return {
    health,
    modelData,
    selectedModel,
    setSelectedModel,
    isChecking,
    refreshStatus,
  };
}
