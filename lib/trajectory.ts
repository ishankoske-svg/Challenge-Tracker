import { Challenge } from './challenges';
import { DailyLog } from './logs';

export interface TrajectoryProjection {
  currentDay: number;
  totalDays: number;
  daysRemaining: number;
  currentAvgCompletionPct: number;
  projectedFinalCompletionPct: number;
  currentPenaltiesUsed: number;
  maxPenalties: number;
  projectedFinalPenalties: number;
  projectedHeartsRemaining: number;
  survivalStatus: 'thriving' | 'on_track' | 'at_risk' | 'critical';
  confidenceScore: number; // 0..100 based on data points
  curvePoints: { day: number; actual?: number; projected: number }[];
  milestoneForecasts: {
    halfwayAchieved: boolean;
    projectedFinishDate: string;
    consistencyTrend: 'improving' | 'stable' | 'declining';
  };
}

/**
 * Fits an exponential momentum curve: y = a - b * exp(-c * day)
 * where habit consistency grows or decays towards a steady state.
 */
export function calculateTrajectory(
  challenge: Challenge,
  logs: DailyLog[],
  simulatedConsistency?: number, // 0..100 user slider override for remaining days
): TrajectoryProjection {
  const totalDays = challenge.duration_days || 30;
  const maxPenalties = challenge.max_penalties ?? 5;
  const penaltiesUsed = challenge.penalties_used ?? 0;

  // Chronologically sorted logs
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime(),
  );

  const loggedCount = sortedLogs.length;
  const currentDay = Math.min(Math.max(loggedCount, 1), totalDays);
  const daysRemaining = Math.max(0, totalDays - currentDay);

  // 1. Calculate historical average completion %
  let totalCompulsoryScore = 0;
  sortedLogs.forEach((log) => {
    totalCompulsoryScore += log.compulsory_completion_pct ?? 100;
  });
  const currentAvg = loggedCount > 0 ? Math.round(totalCompulsoryScore / loggedCount) : 100;

  // 2. Trend analysis (comparing recent 3 days vs overall)
  let consistencyTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (loggedCount >= 4) {
    const recent3 = sortedLogs.slice(-3);
    const recentAvg =
      recent3.reduce((acc, l) => acc + (l.compulsory_completion_pct ?? 100), 0) / 3;
    const earlierAvg =
      sortedLogs
        .slice(0, -3)
        .reduce((acc, l) => acc + (l.compulsory_completion_pct ?? 100), 0) /
      (loggedCount - 3);

    if (recentAvg > earlierAvg + 5) consistencyTrend = 'improving';
    else if (recentAvg < earlierAvg - 5) consistencyTrend = 'declining';
  }

  // 3. Trajectory Curve calculation
  const curvePoints: { day: number; actual?: number; projected: number }[] = [];

  // Effective baseline for future days
  const futureConsistency =
    simulatedConsistency !== undefined ? simulatedConsistency : currentAvg;

  // Exponential decay / growth parameters
  const a = Math.min(100, Math.max(0, futureConsistency));
  const b = Math.max(-30, Math.min(30, 100 - currentAvg));
  const c = 0.08; // habit stabilization rate

  for (let d = 1; d <= totalDays; d++) {
    const matchingLog = sortedLogs[d - 1];
    const projectedVal = Math.round(
      Math.min(100, Math.max(0, a - b * Math.exp(-c * d))),
    );

    if (d <= loggedCount && matchingLog) {
      curvePoints.push({
        day: d,
        actual: matchingLog.compulsory_completion_pct ?? 100,
        projected: projectedVal,
      });
    } else {
      curvePoints.push({
        day: d,
        projected: projectedVal,
      });
    }
  }

  // 4. Projected Final Completion %
  const projectedFutureSum = daysRemaining * futureConsistency;
  const projectedFinalCompletionPct =
    totalDays > 0
      ? Math.round((totalCompulsoryScore + projectedFutureSum) / totalDays)
      : 100;

  // 5. Penalty & Heart Survival Estimation
  // Expected missed days based on future failure probability
  const failureRate = Math.max(0, (100 - futureConsistency) / 100);
  const estimatedFuturePenalties = Math.round(daysRemaining * failureRate * 0.7);
  const projectedFinalPenalties = penaltiesUsed + estimatedFuturePenalties;
  const projectedHeartsRemaining = Math.max(0, maxPenalties - projectedFinalPenalties);

  // 6. Survival Status
  let survivalStatus: 'thriving' | 'on_track' | 'at_risk' | 'critical' = 'on_track';
  if (challenge.difficulty_mode === 'relaxed') {
    survivalStatus = 'thriving';
  } else if (projectedFinalPenalties > maxPenalties) {
    survivalStatus = 'critical';
  } else if (maxPenalties - projectedFinalPenalties <= 1 && maxPenalties > 1) {
    survivalStatus = 'at_risk';
  } else if (projectedFinalCompletionPct >= 85) {
    survivalStatus = 'thriving';
  } else {
    survivalStatus = 'on_track';
  }

  const confidenceScore = Math.min(100, Math.round((loggedCount / Math.max(totalDays * 0.3, 5)) * 100));

  // Finish date
  const start = new Date(challenge.start_date);
  const finish = new Date(start);
  finish.setDate(finish.getDate() + totalDays);

  return {
    currentDay,
    totalDays,
    daysRemaining,
    currentAvgCompletionPct: currentAvg,
    projectedFinalCompletionPct,
    currentPenaltiesUsed: penaltiesUsed,
    maxPenalties,
    projectedFinalPenalties,
    projectedHeartsRemaining,
    survivalStatus,
    confidenceScore,
    curvePoints,
    milestoneForecasts: {
      halfwayAchieved: currentDay >= Math.ceil(totalDays / 2),
      projectedFinishDate: finish.toISOString().split('T')[0],
      consistencyTrend,
    },
  };
}
