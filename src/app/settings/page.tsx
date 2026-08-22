import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { username: session.user.name as string }
  });

  if (!user) {
    redirect("/login");
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
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Configure your Telegram notifications and schedules.</p>
          </div>
        </div>

        <SettingsClient user={user} />
      </main>
    </div>
  );
}
