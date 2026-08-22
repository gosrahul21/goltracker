import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

export const scheduleEveningBriefs = inngest.createFunction(
  { 
    id: "schedule-evening-briefs", 
    triggers: [{ event: "user/settings.updated" }],
    cancelOn: [{ event: "user/settings.updated", match: "data.username" }] 
  },
  async ({ event, step }) => {
    const username = event.data.username;
    
    // 1. Fetch user settings
    const user = await step.run("fetch-user", async () => {
      return await prisma.user.findUnique({ where: { username } });
    });

    if (!user || !user.telegramId || !user.eveningReviewTime) {
      return; // Stop function if no config
    }

    // 2. Calculate the next exact timestamp for their evening brief
    const [hours, minutes] = user.eveningReviewTime.split(':').map(Number);
    let nextBrief = new Date();
    nextBrief.setHours(hours, minutes, 0, 0);
    
    // If time has already passed today, schedule for tomorrow
    if (nextBrief.getTime() <= Date.now()) {
      nextBrief.setDate(nextBrief.getDate() + 1);
    }

    // 3. Sleep until exactly that time
    await step.sleepUntil("wait-for-evening", nextBrief);

    // 4. Send the brief
    await step.run("send-evening-brief", async () => {
      // Re-fetch fresh goals data
      const userData = await prisma.user.findUnique({
        where: { username },
        include: {
          goals: {
            where: { status: 'Active' },
            include: { phases: { orderBy: { sequence: 'asc' }, include: { tasks: { where: { status: 'Todo' } } } } }
          }
        }
      });

      if (!userData || !userData.telegramId) return;

      let text = `🌙 <b>Good Evening, ${userData.username}!</b>\n\nTime for your daily review. Here is your active goal summary:\n\n`;
      for (const goal of userData.goals) {
        text += `🎯 <b>${goal.title}</b>\n`;
        const activePhase = goal.phases.find((p: any) => p.tasks.length > 0);
        if (activePhase) {
          text += `Current Phase: <i>${activePhase.title}</i>\n`;
          text += `Pending Task: ${activePhase.tasks[0].title} (${activePhase.tasks[0].estimatedMinutes}m)\n\n`;
        } else {
          text += `All tasks seem to be done or none planned.\n\n`;
        }
      }
      text += `Rest well and prepare for tomorrow! 💤`;
      await sendTelegramMessage(userData.telegramId, text);
    });

    // 5. Trigger the function again for the next day
    // The morning brief already triggers user/settings.updated which restarts both.
    // However, to be safe and independent, we can just trigger it here too.
    await step.sendEvent("trigger-next-day-evening", {
      name: "user/settings.updated",
      data: { username }
    });
  }
);
