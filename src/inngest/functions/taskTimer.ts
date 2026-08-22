import { inngest } from "../client";
import { sendTelegramMessage } from "@/lib/telegram";

export const taskTimer = inngest.createFunction(
  {
    id: "task-timer",
    triggers: [{ event: "task/started" }],
    // Automatically cancel this function if either of these events occur for the same taskId
    cancelOn: [
      { event: "task/paused", match: "data.taskId" },
      { event: "task/completed", match: "data.taskId" },
      // We also cancel if it restarts (e.g., added 15 mins), so the new event takes over
      { event: "task/started", match: "data.taskId" },
    ],
  },
  async ({ event, step }) => {
    const { taskId, telegramId, title, estimatedMinutes } = event.data;

    // 1. Sleep for the estimated duration
    // Inngest handles turning this into exact milliseconds or dates behind the scenes
    await step.sleep("wait-for-expiry", `${estimatedMinutes}m`);

    // 2. Loop infinitely to send follow-up pings (until cancelled by a user action)
    let pingsSent = 0;
    while (true) {
      pingsSent++;
      const overage = pingsSent * 5; // roughly 5 mins per loop

      await step.run(`send-telegram-ping-${pingsSent}`, async () => {
        const text = `⚠️ <b>Task Overtime!</b>\n\nYour task <i>"${title}"</i> is over its estimated time by at least ${overage} minute(s).\n\nAre you still working on this?`;
        
        const replyMarkup = {
          inline_keyboard: [
            [{ text: '+15 Mins', callback_data: `extend_${taskId}_15` }],
            [{ text: 'Mark Done ✅', callback_data: `done_${taskId}` }]
          ]
        };

        await sendTelegramMessage(telegramId, text, replyMarkup);
      });

      // Sleep for 5 minutes before pinging again
      await step.sleep(`wait-for-next-ping-${pingsSent}`, "5m");
    }
  }
);
