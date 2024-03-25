import axios from "axios";
axios.defaults.withCredentials = true;

export const addFeedback = async (feedbackData) => {
  return axios.post(`${process.env.REACT_APP_BACK_END_URL}/api/summaryFeedback/add`, feedbackData);
};