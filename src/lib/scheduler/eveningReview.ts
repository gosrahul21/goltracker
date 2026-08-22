import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';

export async function runEveningReview() {
  try {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeString = `${currentHour}:${currentMinute}`;

    const users = await prisma.user.findMany({
      where: {
        telegramId: { not: null },
        eveningReviewTime: currentTimeString
      },
      include: {
        goals: {
          where: { status: 'Active' },
          include: {
            phases: {
              include: {
                tasks: {
                  where: { status: { in: ['InProgress', 'Done'] } }
                }
              }
            }
          }
        }
      }
    });

    for (const user of users) {
      if (!user.telegramId) continue;

      const inProgressTasks: any[] = [];
      for (const goal of user.goals) {
        for (const phase of goal.phases) {
          inProgressTasks.push(...phase.tasks.filter((t: any) => t.status === 'InProgress'));
        }
      }

      if (inProgressTasks.length > 0) {
        let text = `🌙 <b>Evening Review, ${user.username}</b>\n\nYou have ${inProgressTasks.length} task(s) still in progress:\n\n`;
        inProgressTasks.forEach(t => text += `• ${t.title}\n`);
        text += `\nPlease update the status of each task before you wrap up!`;

        await sendTelegramMessage(user.telegramId, text);
        console.log(`[scheduler] Evening review sent to ${user.username}`);
      }
    }
  } catch (error) {
    console.error('[scheduler] evening-review error:', error);
  }
}
