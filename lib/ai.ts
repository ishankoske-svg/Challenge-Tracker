import { Challenge } from './challenges';
import { DailyLog } from './logs';

export async function generateProgressSummary(
  challenge: Challenge,
  logs: DailyLog[]
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  // Calculate some basic stats for the prompt
  const totalTasks = challenge.tasks?.length || 0;
  let totalCompleted = 0;
  
  logs.forEach(log => {
    if (log.tasks_completed) {
      Object.keys(log.tasks_completed).forEach(taskId => {
        if (log.tasks_completed[taskId]) {
          totalCompleted++;
        }
      });
    }
  });

  if (!apiKey) {
    // Fallback/Mock response when API key is missing
    return `You've logged ${logs.length} days so far for "${challenge.title}". Keep up the momentum to reach your goals! Add an Anthropic API Key to your .env file for AI insights.`;
  }

  // Format the prompt
  const prompt = `
I am tracking a challenge called "${challenge.title}".
Category: ${challenge.category}
Duration: ${challenge.duration_days} days
Total Days Logged: ${logs.length}
Tasks Completed Overall: ${totalCompleted}

Please write a very short 1-2 sentence motivational summary of my progress. Be encouraging but concise. Do not use quotes around the response.
`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API Error:', errorText);
      return 'Keep up the great work on your challenge!';
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (err) {
    console.error('Failed to fetch from Anthropic:', err);
    return 'Keep up the great work on your challenge!';
  }
}

export interface Weakness {
  taskId: string;
  taskLabel: string;
  consecutiveMisses: number;
}

export function analyzeWeaknesses(challenge: Challenge, logs: DailyLog[]): Weakness[] {
  if (!challenge.tasks || logs.length === 0) return [];

  const sortedLogs = [...logs].sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
  const weaknesses: Weakness[] = [];

  for (const task of challenge.tasks) {
    let consecutiveMisses = 0;
    for (const log of sortedLogs) {
      const val = log.tasks_completed?.[task.id];
      const isCompleted = val === true || (val && typeof val === 'object' && val.completed);
      
      if (!isCompleted) {
        consecutiveMisses++;
      } else {
        break; // Stop counting misses once we hit a completion
      }
    }

    if (consecutiveMisses >= 3) {
      weaknesses.push({
        taskId: task.id,
        taskLabel: task.label,
        consecutiveMisses
      });
    }
  }

  return weaknesses;
}

export async function generateCoachingNudge(
  challenge: Challenge, 
  logs: DailyLog[], 
  weaknesses: Weakness[]
): Promise<{ text: string; actionItem?: string } | null> {
  if (weaknesses.length === 0) return null;

  const target = weaknesses[0]; // Focus on the most pressing weakness
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Rule-based fallback
    return {
      text: `You've missed "${target.taskLabel}" for ${target.consecutiveMisses} days in a row. Let's break the cycle today!`,
      actionItem: `Try doing "${target.taskLabel}" earlier in the day.`
    };
  }

  const prompt = `
I am tracking a challenge called "${challenge.title}".
I am currently struggling with the task: "${target.taskLabel}".
I have missed it for ${target.consecutiveMisses} consecutive days.

Please provide a highly concise, 1-2 sentence coaching nudge to help me overcome this friction. 
Provide your response in JSON format exactly like this:
{
  "text": "The motivational nudge",
  "actionItem": "A specific, tiny actionable step to take"
}
Do not include any other text.
`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    const parsed = JSON.parse(data.content[0].text);
    return { text: parsed.text, actionItem: parsed.actionItem };
  } catch (err) {
    return {
      text: `You've missed "${target.taskLabel}" for ${target.consecutiveMisses} days in a row. Let's break the cycle today!`,
      actionItem: `Try doing "${target.taskLabel}" earlier in the day.`
    };
  }
}

export function suggestDifficultyAdjustment(challenge: Challenge, logs: DailyLog[]): 'step_down' | 'step_up' | null {
  if (logs.length < 7) return null;

  const maxPen = challenge.max_penalties ?? 0;
  const usedPen = challenge.penalties_used ?? 0;
  
  if (maxPen > 0 && (usedPen / maxPen) > 0.6) {
    return 'step_down';
  }

  if (usedPen === 0 && logs.length >= 14) {
    const avgCompletion = logs.reduce((sum, l) => sum + (l.compulsory_completion_pct ?? 0), 0) / logs.length;
    if (avgCompletion > 95 && challenge.difficulty_mode !== 'hardcore') {
      return 'step_up';
    }
  }

  return null;
}

