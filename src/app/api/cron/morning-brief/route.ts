import { NextResponse } from 'next/server';
import { runMorningBrief } from '@/lib/scheduler/morningBrief';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  await runMorningBrief();
  return NextResponse.json({ message: 'Morning briefs sent' }, { status: 200 });
}
