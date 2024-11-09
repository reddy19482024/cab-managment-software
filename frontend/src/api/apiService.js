import axios from 'axios';

export const apiService = (endpoint, method, data = null, headers = {}) => {
  return axios({
    url: endpoint,
    method,
    headers,
    data
  }).then(response => response.data)
    .catch(error => { throw error.response.data; });
};
