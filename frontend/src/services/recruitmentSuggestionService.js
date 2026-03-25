import apiClient from './apiClient';

export const createRecruitmentSuggestion = (payload) =>
  apiClient.post('/recruitment-suggestions', payload);

export const listMyRecruitmentSuggestions = () =>
  apiClient.get('/recruitment-suggestions/mine');

export const listHrRecruitmentSuggestions = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiClient.get(`/recruitment-suggestions/hr-inbox${q ? `?${q}` : ''}`);
};

export const acknowledgeRecruitmentSuggestion = (id, body) =>
  apiClient.patch(`/recruitment-suggestions/${id}/acknowledge`, body);
