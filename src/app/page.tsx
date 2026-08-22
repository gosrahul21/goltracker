import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userWithGoals = await prisma.user.findUnique({
    where: { username: session.user.name as string },
    include: {
      goals: {
        include: {
          phases: {
            include: {
              tasks: true,
            },
            orderBy: { sequence: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const goals = userWithGoals?.goals || [];
  const totalTasks = goals.flatMap((g: any) => g.phases.flatMap((p: any) => p.tasks)).length;
  const doneTasks = goals.flatMap((g: any) => g.phases.flatMap((p: any) => p.tasks)).filter((t: any) => t.status === 'Done').length;
  const activeGoals = goals.filter((g: any) => g.status === 'Active').length;

  return (
    <div>
      <nav className="navbar">
        <span className="navbar-brand">⚡ GoalTracker</span>
        <div className="navbar-actions">
          <Link href="/settings" className="btn-ghost">
            ⚙ Settings
          </Link>
          <form action="/api/auth/signout" method="POST" style={{ margin: 0 }}>
            <button type="submit" className="btn-ghost">
              Sign Out
            </button>
          </form>
        </div>
      </nav>

      <main className="container">
        <div className="page-header">
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
              Welcome back
            </p>
            <h1 className="page-title">{session.user.name}</h1>
            <p className="page-subtitle">Here&apos;s what you&apos;re working on today.</p>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
            <div className="glass-panel-sm" style={{ textAlign: 'center', minWidth: '90px' }}>
              <div className="stat-value" style={{ color: 'var(--accent)' }}>{goals.length}</div>
              <div className="stat-label">Goals</div>
            </div>
            <div className="glass-panel-sm" style={{ textAlign: 'center', minWidth: '90px' }}>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{activeGoals}</div>
              <div className="stat-label">Active</div>
            </div>
            <div className="glass-panel-sm" style={{ textAlign: 'center', minWidth: '90px' }}>
              <div className="stat-value">{doneTasks}<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/{totalTasks}</span></div>
              <div className="stat-label">Tasks Done</div>
            </div>
          </div>
        </div>

        <DashboardClient initialGoals={userWithGoals?.goals || []} userId={userWithGoals?.id || ''} />
      </main>
    </div>
  );
}
