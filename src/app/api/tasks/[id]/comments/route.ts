import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text } = await req.json();
    const { id } = await params;

    if (!text) {
      return NextResponse.json({ message: 'Missing comment text' }, { status: 400 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        text,
        taskId: id,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error creating comment' }, { status: 500 });
  }
}
