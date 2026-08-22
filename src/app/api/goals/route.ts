import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, userId } = await req.json();

    const goal = await prisma.goal.create({
      data: {
        title,
        userId,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating goal' }, { status: 500 });
  }
}
