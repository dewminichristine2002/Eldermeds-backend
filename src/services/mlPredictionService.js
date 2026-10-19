const axios = require('axios');
const { buildFdaSeriousFeaturePayload } = require('./mlFeatureBuilder');

const MEDICINE_SAFETY_ML_SERVICE_URL = (
  process.env.MEDICINE_SAFETY_ML_SERVICE_URL
  || process.env.ML_SERVICE_URL
  || 'http://localhost:8001'
).replace(/\/+$/, '');
const configuredTimeout = Number(process.env.MEDICINE_SAFETY_ML_TIMEOUT_MS || 12000);
const MEDICINE_SAFETY_ML_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout > 0
  ? configuredTimeout
  : 12000;

const clampPercent = (value) => Math.max(0, Math.min(100, value));

const mapPredictionToRisk = (parsed) => {
  const seriousProb = Number(parsed.seriousProbability ?? parsed.probability ?? 0);
  const nonSeriousProb = 1 - seriousProb;
  const mlDangerScore = clampPercent(Math.round(seriousProb * 1000) / 10);
  const mlClassConfidence = clampPercent(Math.round(Math.max(seriousProb, nonSeriousProb) * 1000) / 10);

  return {
    mlRiskScore: mlDangerScore,
    mlRiskLevel: parsed.riskLevelLabel || (parsed.prediction === 1 ? 'Dangerous' : 'Safe'),
    mlDangerProbability: seriousProb,
    mlClassProbability: seriousProb,
    mlClassConfidenceScore: mlClassConfidence,
    adrRiskProbability: seriousProb,
    probability: seriousProb,
    probabilityDangerous: seriousProb,
    probabilitySafe: nonSeriousProb,
    threshold: parsed.threshold,
    classification: parsed.classification,
  };
};

const predictMedicineRisk = async ({ analysisPayload, profile, questionnaireAnswers }) => {
  const payload = buildFdaSeriousFeaturePayload({ analysisPayload, profile, questionnaireAnswers });

  try {
    const response = await axios.post(`${MEDICINE_SAFETY_ML_SERVICE_URL}/predict/medicine-safety`, payload, {
      timeout: MEDICINE_SAFETY_ML_TIMEOUT_MS,
    });
    const parsed = response.data || {};

    return {
      available: true,
      target: 'serious',
      prediction: parsed.prediction,
      binaryPrediction: parsed.prediction,
      classification: parsed.classification,
      threshold: parsed.threshold,
      seriousProbability: parsed.seriousProbability,
      adrRiskProbability: parsed.seriousProbability,
      probability: parsed.seriousProbability,
      probabilityDangerous: parsed.seriousProbability,
      probabilitySafe: parsed.seriousProbability != null ? 1 - Number(parsed.seriousProbability) : null,
      mlRiskScore: parsed.mlRiskScore,
      riskLevelLabel: parsed.riskLevelLabel,
      featurePayload: payload,
      featureRow: parsed.featureRow || payload,
      featuresUsed: parsed.featuresUsed || Object.keys(payload),
      modelPath: parsed.modelPath,
      ...mapPredictionToRisk(parsed),
      serviceUrl: MEDICINE_SAFETY_ML_SERVICE_URL,
    };
  } catch (error) {
    const status = Number(error.response?.status) || null;
    const remoteDetail = error.response?.data?.detail || error.response?.data?.error;
    return {
      available: false,
      fallbackAvailable: true,
      safetyResultGenerated: true,
      analysisMode: 'clinical_rules_only',
      reason: remoteDetail || error.message || 'Failed to call medicine safety ML service.',
      status,
      serviceUrl: MEDICINE_SAFETY_ML_SERVICE_URL,
      featurePayload: payload,
    };
  }
};

module.exports = {
  predictMedicineRisk,
  buildFdaSeriousFeaturePayload,
  MEDICINE_SAFETY_ML_SERVICE_URL,
  MEDICINE_SAFETY_ML_TIMEOUT_MS,
};
