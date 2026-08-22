import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { inngest } from '@/inngest/client';

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.name) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { telegramId, morningBriefTime, eveningReviewTime } = await req.json();

    const dataToUpdate: any = {};
    if (telegramId !== undefined) dataToUpdate.telegramId = telegramId;
    if (morningBriefTime !== undefined) dataToUpdate.morningBriefTime = morningBriefTime;
    if (eveningReviewTime !== undefined) dataToUpdate.eveningReviewTime = eveningReviewTime;

    const user = await prisma.user.update({
      where: { username: session.user.name },
      data: dataToUpdate,
    });

    // Trigger Inngest to schedule/reschedule daily briefs
    await inngest.send({
      name: "user/settings.updated",
      data: { username: session.user.name }
    });

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error updating user settings' }, { status: 500 });
  }
}
