import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';

export async function runMorningBrief() {
  try {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeString = `${currentHour}:${currentMinute}`;

    const users = await prisma.user.findMany({
      where: {
        telegramId: { not: null },
        morningBriefTime: currentTimeString
      },
      include: {
        goals: {
          where: { status: 'Active' },
          include: {
            phases: {
              orderBy: { sequence: 'asc' },
              include: {
                tasks: { where: { status: 'Todo' } }
              }
            }
          }
        }
      }
    });

    for (const user of users) {
      if (!user.telegramId || user.goals.length === 0) continue;

      let text = `🌅 <b>Good Morning, ${user.username}!</b>\n\nHere is your active goal summary:\n\n`;

      for (const goal of user.goals) {
        text += `🎯 <b>${goal.title}</b>\n`;
        const activePhase = goal.phases.find(p => p.tasks.length > 0);
        if (activePhase) {
          text += `Current Phase: <i>${activePhase.title}</i>\n`;
          text += `Next Task: ${activePhase.tasks[0].title} (${activePhase.tasks[0].estimatedMinutes}m)\n\n`;
        } else {
          text += `All tasks seem to be done or none planned.\n\n`;
        }
      }

      text += `Have a productive day! 🚀`;
      await sendTelegramMessage(user.telegramId, text);
      console.log(`[scheduler] Morning brief sent to ${user.username}`);
    }
  } catch (error) {
    console.error('[scheduler] morning-brief error:', error);
  }
}
