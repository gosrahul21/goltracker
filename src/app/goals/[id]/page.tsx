import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GoalDetailClient from "./GoalDetailClient";
import Link from "next/link";

export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }
  
  const { id } = await params;

  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      phases: {
        include: {
          tasks: {
            include: {
              comments: {
                orderBy: { createdAt: 'desc' }
              }
            }
          },
        },
        orderBy: { sequence: 'asc' }
      }
    }
  });

  if (!goal) {
    return (
      <main className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <h2>Goal not found</h2>
        <Link href="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Back to Dashboard</Link>
      </main>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <Link href="/" className="back-link">
          ← Back to Dashboard
        </Link>
        <span className="navbar-brand">⚡ GoalTracker</span>
        <div style={{ width: '160px' }} />
      </nav>

      <main className="container">
        <div className="page-header" style={{ paddingTop: '2rem', paddingBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">{goal.title}</h1>
            {goal.reason && (
              <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>💡 {goal.reason}</p>
            )}
          </div>
        </div>

        <GoalDetailClient initialGoal={goal} />
      </main>
    </div>
  );
}
