import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';
import { scheduleTaskTimer, cancelTaskTimer } from '@/lib/scheduler/memoryScheduler';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const data = callbackQuery.data;
      const chatId = callbackQuery.message.chat.id.toString();

      if (data.startsWith('extend_')) {
        const parts = data.split('_');
        const taskId = parts[1];
        const mins = parseInt(parts[2], 10);

        const task = await prisma.task.findUnique({ 
          where: { id: taskId },
          include: { phase: { include: { goal: { include: { user: true } } } } }
        });
        
        if (task && task.status === 'InProgress') {
          const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
              estimatedMinutes: task.estimatedMinutes + mins,
              startedAt: new Date(),
              lastNotifiedAt: null,
            }
          });

          // Reschedule the timer in memory
          scheduleTaskTimer(
            { id: updatedTask.id, title: updatedTask.title, estimatedMinutes: updatedTask.estimatedMinutes, startedAt: updatedTask.startedAt },
            chatId
          );

          await sendTelegramMessage(chatId, `✅ Added ${mins} minutes to "${task.title}". The timer has been reset!`);
        }
      } else if (data.startsWith('done_')) {
        const parts = data.split('_');
        const taskId = parts[1];

        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (task) {
          await prisma.task.update({
            where: { id: taskId },
            data: { status: 'Done' }
          });

          // Cancel the timer in memory
          cancelTaskTimer(taskId);

          await sendTelegramMessage(chatId, `🎉 Awesome job! "${task.title}" is marked as Done.`);
        }
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
