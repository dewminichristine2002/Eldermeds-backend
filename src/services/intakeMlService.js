const axios = require('axios');

const SERVICE_URL = (process.env.INTAKE_ML_SERVICE_URL || 'http://localhost:8002').replace(/\/+$/, '');
const TIMEOUT_MS = Number(process.env.INTAKE_ML_TIMEOUT_MS || 90000);

const post = async (path, payload, timeout = TIMEOUT_MS) => {
  try {
    const response = await axios.post(`${SERVICE_URL}${path}`, payload, { timeout });
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail;
    const message = typeof detail === 'string' ? detail : error.message;
    const wrapped = new Error(message || 'The intake ML service request failed.');
    wrapped.status = error.response?.status;
    wrapped.code = error.code;
    throw wrapped;
  }
};

const analyzePalm = (payload) => post('/analyze/palm', payload);
const analyzeTabletIdentity = (payload) => post('/analyze/tablet-identity', payload);
const analyzeMotion = (payload) => post('/analyze/motion', payload, 30000);
const analyzeMotionVideo = (payload) => post('/analyze/motion-video', payload, 120000);

module.exports = {
  analyzePalm,
  analyzeTabletIdentity,
  analyzeMotion,
  analyzeMotionVideo,
  serviceUrl: SERVICE_URL,
};
