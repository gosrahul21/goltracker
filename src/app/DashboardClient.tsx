"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function getBadgeClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'planning': return 'badge badge-planning';
    case 'active': return 'badge badge-active';
    case 'paused': return 'badge badge-paused';
    case 'completed': return 'badge badge-completed';
    default: return 'badge badge-planning';
  }
}

function getPriorityClass(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'high': return 'badge badge-high';
    case 'medium': return 'badge badge-medium';
    case 'low': return 'badge badge-low';
    default: return 'badge badge-medium';
  }
}

function getTaskBadgeClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'todo': return 'badge badge-todo';
    case 'inprogress': return 'badge badge-inprogress';
    case 'done': return 'badge badge-done';
    case 'paused': return 'badge badge-todo';
    default: return 'badge badge-todo';
  }
}

function GoalCard({ goal, onTaskStatusChange }: { goal: any; onTaskStatusChange: (taskId: string, status: string) => void }) {
  const allTasks = goal.phases.flatMap((p: any) => p.tasks);
  const doneTasks = allTasks.filter((t: any) => t.status === 'Done').length;
  const inProgressTasks = allTasks.filter((t: any) => t.status === 'InProgress');
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  return (
    <div className="goal-card animate-fade-in">
      <div className="goal-card-header">
        <h3 className="goal-card-title">{goal.title}</h3>
        <div className="goal-card-meta">
          <span className={getPriorityClass(goal.priority)}>{goal.priority}</span>
          <span className={getBadgeClass(goal.status)}>{goal.status}</span>
        </div>
      </div>

      {goal.description && (
        <p className="goal-card-description">{goal.description}</p>
      )}

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progress</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: progress === 100 ? 'var(--success)' : 'var(--text-secondary)' }}>{doneTasks}/{allTasks.length} tasks</span>
        </div>
        <div className="progress-bar-track">
          <div className={`progress-bar-fill${progress === 100 ? ' done' : ''}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* In-Progress Tasks */}
      {inProgressTasks.length > 0 && (
        <div style={{ background: 'rgba(245, 166, 35, 0.07)', border: '1px solid rgba(245, 166, 35, 0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--warning)', fontWeight: 700, marginBottom: '0.5rem' }}>
            🔥 In Progress
          </div>
          {inProgressTasks.slice(0, 2).map((task: any) => (
            <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', gap: '0.5rem' }}>
              <span style={{ flex: 1, fontWeight: 500 }}>{task.title}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{task.estimatedMinutes}m</span>
              <button className="btn-success" onClick={() => onTaskStatusChange(task.id, 'Done')}>Done</button>
            </div>
          ))}
        </div>
      )}

      {/* Phases compact view */}
      {goal.phases.length > 0 && inProgressTasks.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {goal.phases.slice(0, 2).map((phase: any) => {
            const nextTask = phase.tasks.find((t: any) => t.status !== 'Done');
            return (
              <div key={phase.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span className="phase-number" style={{ width: '20px', height: '20px', fontSize: '0.7rem' }}>{phase.sequence}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{phase.title}</span>
                {nextTask && <span style={{ flexShrink: 0, color: 'var(--text-muted)' }}>→ {nextTask.title}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
        <Link href={`/goals/${goal.id}`} className="btn-primary" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Manage →
        </Link>
      </div>
    </div>
  );
}

export default function DashboardClient({ initialGoals: goals, userId }: { initialGoals: any[]; userId: string }) {
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle) return;
    setIsCreating(true);

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newGoalTitle, userId }),
    });

    if (res.ok) {
      setNewGoalTitle("");
      router.refresh();
    }
    setIsCreating(false);
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Create Goal */}
      <div className="glass-panel animate-fade-in">
        <div className="section-title" style={{ marginBottom: '1rem' }}>
          <span className="section-title-icon">🎯</span>
          Create New Goal
        </div>
        <form onSubmit={handleCreateGoal} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="What is your next big goal? (e.g., Launch my side project)"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }} disabled={isCreating}>
            {isCreating ? 'Adding...' : '+ Add Goal'}
          </button>
        </form>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="glass-panel">
          <div className="empty-state">
            <div className="empty-state-icon">🚀</div>
            <p style={{ fontWeight: 600, marginBottom: '0.35rem', fontSize: '1rem' }}>No goals yet</p>
            <p className="empty-state-text">Create your first goal above and start building momentum!</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onTaskStatusChange={handleTaskStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
