import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';

// Use a global variable to persist timers across HMR (Hot Module Replacement) in development
const globalForScheduler = global as unknown as { 
  activeTimers: Map<string, NodeJS.Timeout> 
};

export const activeTimers = globalForScheduler.activeTimers || new Map<string, NodeJS.Timeout>();
if (process.env.NODE_ENV !== 'production') globalForScheduler.activeTimers = activeTimers;

/**
 * Triggers the notification and sets a recurring 5-minute timer
 */
async function triggerNotificationAndRepeat(taskId: string, telegramId: string, title: string, estimatedMinutes: number, startedAt: Date) {
  try {
    const now = new Date();
    const timeElapsedMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60);
    const overage = Math.round(timeElapsedMinutes - estimatedMinutes);
    
    const text = `⚠️ <b>Task Overtime!</b>\n\nYour task <i>"${title}"</i> is over its estimated time by ${overage > 0 ? overage : 0} minute(s).\n\nAre you still working on this?`;
    
    const replyMarkup = {
      inline_keyboard: [
        [{ text: '+15 Mins', callback_data: `extend_${taskId}_15` }],
        [{ text: 'Mark Done ✅', callback_data: `done_${taskId}` }]
      ]
    };

    await sendTelegramMessage(telegramId, text, replyMarkup);
    
    await prisma.task.update({
      where: { id: taskId },
      data: { lastNotifiedAt: now }
    });
    
    console.log(`[memoryScheduler] Notified: "${title}" (${overage > 0 ? overage : 0}m over)`);

    // Set a recurring timer for 5 minutes
    const nextTimer = setTimeout(() => {
      triggerNotificationAndRepeat(taskId, telegramId, title, estimatedMinutes, startedAt);
    }, 5 * 60 * 1000); // 5 mins

    activeTimers.set(taskId, nextTimer);
  } catch (error) {
    console.error(`[memoryScheduler] Error triggering notification for task ${taskId}:`, error);
  }
}

/**
 * Schedules a precise timer for when a task will expire.
 */
export function scheduleTaskTimer(task: { id: string, title: string, estimatedMinutes: number, startedAt: Date | null }, telegramId: string | null) {
  if (!telegramId || !task.startedAt) return;

  // Clear any existing timer for this task to avoid duplicates
  cancelTaskTimer(task.id);

  const now = new Date();
  const expiresAt = new Date(task.startedAt.getTime() + task.estimatedMinutes * 60 * 1000);
  const timeUntilExpiryMs = expiresAt.getTime() - now.getTime();

  if (timeUntilExpiryMs <= 0) {
    // Already expired! Trigger immediately
    console.log(`[memoryScheduler] Task "${task.title}" already expired. Triggering immediately.`);
    triggerNotificationAndRepeat(task.id, telegramId, task.title, task.estimatedMinutes, task.startedAt);
  } else {
    // Schedule for the exact future time
    console.log(`[memoryScheduler] Scheduling task "${task.title}" to fire in ${Math.round(timeUntilExpiryMs / 1000)}s.`);
    const timer = setTimeout(() => {
      triggerNotificationAndRepeat(task.id, telegramId, task.title, task.estimatedMinutes, task.startedAt as Date);
    }, timeUntilExpiryMs);
    
    activeTimers.set(task.id, timer);
  }
}

/**
 * Instantly cancels any pending notifications for a task (e.g. when paused or marked done).
 */
export function cancelTaskTimer(taskId: string) {
  const existingTimer = activeTimers.get(taskId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    activeTimers.delete(taskId);
    console.log(`[memoryScheduler] Cancelled timer for task ${taskId}`);
  }
}
