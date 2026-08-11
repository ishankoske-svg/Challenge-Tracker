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
