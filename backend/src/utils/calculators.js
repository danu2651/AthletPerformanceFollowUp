/**
 * APTS — Performance Calculation Utilities
 */

/**
 * Average speed in km/h
 * @param {number} distanceKm
 * @param {number} durationSeconds
 */
const calcAvgSpeed = (distanceKm, durationSeconds) => {
  if (
    !distanceKm ||
    !durationSeconds ||
    distanceKm <= 0 ||
    durationSeconds <= 0
  )
    return null;
  return parseFloat((distanceKm / (durationSeconds / 3600)).toFixed(2));
};

/**
 * Average pace in seconds per km
 * @param {number} distanceKm
 * @param {number} durationSeconds
 */
const calcAvgPace = (distanceKm, durationSeconds) => {
  if (!distanceKm || !durationSeconds || distanceKm <= 0) return null;
  return Math.round(durationSeconds / distanceKm);
};

/**
 * Format seconds → "MM:SS" string (for pace display)
 */
const formatPace = (seconds) => {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/**
 * Format seconds → "H:MM:SS" duration string
 */
const formatDuration = (seconds) => {
  if (!seconds) return "0:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/**
 * Estimate calories burned (~60 cal/km for running, ~40 for cycling)
 */
const calcCalories = (distanceKm, trainingTypeName = "") => {
  if (!distanceKm) return null;
  const name = trainingTypeName.toLowerCase();
  const rate = name.includes("cycle") || name.includes("bike") ? 40 : 60;
  return Math.round(distanceKm * rate);
};

/**
 * Compute all derived metrics at once
 */
const computeMetrics = (distanceKm, durationSeconds, trainingTypeName) => ({
  avg_speed: calcAvgSpeed(distanceKm, durationSeconds),
  avg_pace: calcAvgPace(distanceKm, durationSeconds),
  calories_burned: calcCalories(distanceKm, trainingTypeName),
});

module.exports = {
  calcAvgSpeed,
  calcAvgPace,
  formatPace,
  formatDuration,
  calcCalories,
  computeMetrics,
};
