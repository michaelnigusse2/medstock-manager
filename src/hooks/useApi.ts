import { useCallback } from 'react';

const API_URL = 'http://localhost:3000/api';

export function useApi() {
  const getAuthToken = () => localStorage.getItem('pharmacy_token');

  const getHeaders = useCallback(() => {
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const handleResponse = async (response: Response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  const get = useCallback(async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  }, [getHeaders]);

  const post = useCallback(async (endpoint: string, body: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  }, [getHeaders]);

  // You can add put, delete, etc. methods here as needed

  return { get, post };
}
