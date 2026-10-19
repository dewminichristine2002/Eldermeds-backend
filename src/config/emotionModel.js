const SUPPORTED_EMOTIONS = Object.freeze([
  'happiness',
  'sadness',
  'loneliness',
  'anxiety',
  'anger',
  'cognitive_fog',
  'neutral',
]);

const CONFIDENCE_THRESHOLD = Number(process.env.EMOTION_CONFIDENCE_THRESHOLD || 0.35);

module.exports = {
  CONFIDENCE_THRESHOLD,
  SUPPORTED_EMOTIONS,
};
