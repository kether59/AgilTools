import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants/env';

export const useAPI = () => {
  const { username } = useAuth();

  const call = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-User': username,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'An error occurred');
    }

    return response.json();
  };

  return call;
};
