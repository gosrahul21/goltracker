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
    const { title, sequence, goalId } = await req.json();

    if (!title || sequence === undefined || !goalId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const phase = await prisma.phase.create({
      data: {
        title,
        sequence: parseInt(sequence),
        goalId,
      },
    });

    return NextResponse.json(phase, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error creating phase' }, { status: 500 });
  }
}
