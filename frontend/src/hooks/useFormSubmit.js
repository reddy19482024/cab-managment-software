import { useState } from 'react';
import { apiService } from '../api/apiService';

const useFormSubmit = (apiConfig) => {
  const [loading, setLoading] = useState(false);

  const submit = async (formData) => {
    setLoading(true);
    try {
      const data = await apiService(apiConfig.endpoint, apiConfig.method, formData);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading };
};

export default useFormSubmit;
