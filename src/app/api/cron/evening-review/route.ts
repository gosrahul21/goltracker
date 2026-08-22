import { NextResponse } from 'next/server';
import { runEveningReview } from '@/lib/scheduler/eveningReview';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  await runEveningReview();
  return NextResponse.json({ message: 'Evening reviews sent' }, { status: 200 });
}
