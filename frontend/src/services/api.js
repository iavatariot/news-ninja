import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://57.129.111.150:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const articlesAPI = {
  getRecent: (limit = 20, country = null) => {
    const params = { limit };
    if (country) params.country = country;
    return api.get('/articles', { params });
  },

  getById: (id) => {
    return api.get(`/articles/${id}`);
  },

  generateCustom: (trends, countryCode, countryName) => {
    return api.post('/articles/generate', {
      trends,
      countryCode,
      countryName,
    });
  },
};

export const trendsAPI = {
  getCountries: () => {
    return api.get('/trends/countries');
  },

  getByCountry: (countryCode) => {
    return api.get(`/trends/country/${countryCode}`);
  },
};

export const healthAPI = {
  check: () => {
    return api.get('/health');
  },
};

export default api;
