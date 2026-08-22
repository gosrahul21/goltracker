import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { scheduleTaskTimer, cancelTaskTimer } from '@/lib/scheduler/memoryScheduler';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { status, title, description, estimatedMinutes } = await req.json();
    const { id } = await params;

    const currentTask = await prisma.task.findUnique({ where: { id } });
    if (!currentTask) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    
    let isTimeUpdated = false;
    if (estimatedMinutes !== undefined) {
      dataToUpdate.estimatedMinutes = parseInt(estimatedMinutes);
      isTimeUpdated = dataToUpdate.estimatedMinutes !== currentTask.estimatedMinutes;
    }
    
    // Reset timer if status changes to InProgress OR if already InProgress and time is updated
    const willBeInProgress = status === 'InProgress' || (status === undefined && currentTask.status === 'InProgress');
    const statusChangedToInProgress = status === 'InProgress' && currentTask.status !== 'InProgress';

    if (statusChangedToInProgress || (willBeInProgress && isTimeUpdated)) {
      dataToUpdate.startedAt = new Date();
      dataToUpdate.lastNotifiedAt = null; // Reset notification timer too
    }

    const task = await prisma.task.update({
      where: { id },
      data: dataToUpdate,
      include: {
        phase: {
          include: {
            goal: {
              include: { user: true }
            }
          }
        }
      }
    });

    // In-memory scheduler logic
    if (task.status === 'InProgress') {
      const telegramId = task.phase.goal.user.telegramId;
      if (telegramId) {
        scheduleTaskTimer(task, telegramId);
      }
    } else if (task.status === 'Paused' || task.status === 'Done') {
      cancelTaskTimer(task.id);
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error updating task' }, { status: 500 });
  }
}
