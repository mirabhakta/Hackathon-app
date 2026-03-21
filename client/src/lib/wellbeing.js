export function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}

export function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getSetupAvailability(setup) {
  return setup === "wfh" || setup === "hybrid" ? 1 : 0;
}

export function getFriendlyStatus(burnRate) {
  if (burnRate < 0.3) {
    return { label: "You're doing great! 🌱", tone: "green" };
  }
  if (burnRate < 0.6) {
    return { label: "Let's keep an eye on things 👀", tone: "yellow" };
  }
  return { label: "Time for a Wellby break! 💛", tone: "red" };
}

export function getAlertLevel(burnRate) {
  if (burnRate > 0.7) {
    return 3;
  }
  if (burnRate > 0.5) {
    return 2;
  }
  if (burnRate >= 0.3) {
    return 1;
  }
  return 0;
}

export function getBreakMinutes(burnRate, fatigueDetected) {
  if (fatigueDetected || burnRate > 0.7) {
    return 15;
  }
  if (burnRate > 0.5) {
    return 10;
  }
  return 5;
}

export function normalizeHistory(history) {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return history.filter((item) => new Date(item.timestamp).getTime() >= oneWeekAgo);
}
