"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function getTaskIndicatorClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'inprogress': return 'task-row-indicator inprogress';
    case 'done': return 'task-row-indicator done';
    case 'paused': return 'task-row-indicator paused';
    default: return 'task-row-indicator todo';
  }
}

function getStatusBadgeClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'todo': return 'badge badge-todo';
    case 'inprogress': return 'badge badge-inprogress';
    case 'done': return 'badge badge-done';
    case 'paused': return 'badge badge-todo';
    default: return 'badge badge-todo';
  }
}

export default function GoalDetailClient({ initialGoal: goal }: { initialGoal: any }) {
  const router = useRouter();

  // Goal Edit State
  const [description, setDescription] = useState(goal.description || "");
  const [reason, setReason] = useState(goal.reason || "");
  const [status, setStatus] = useState(goal.status);
  const [priority, setPriority] = useState(goal.priority);

  useEffect(() => {
    setDescription(goal.description || "");
    setReason(goal.reason || "");
    setStatus(goal.status);
    setPriority(goal.priority);
  }, [goal]);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Phase Creation State
  const [newPhaseTitle, setNewPhaseTitle] = useState("");
  const [newPhaseSequence, setNewPhaseSequence] = useState(goal.phases.length + 1);
  const [isAddingPhase, setIsAddingPhase] = useState(false);

  // Task Creation State
  const [taskPhaseId, setTaskPhaseId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskMinutes, setNewTaskMinutes] = useState("");

  // Task Edit Modal State
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskMinutes, setEditTaskMinutes] = useState("");
  const [editTaskStatus, setEditTaskStatus] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [taskSaveMessage, setTaskSaveMessage] = useState("");

  const openTaskModal = (task: any) => {
    setSelectedTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || "");
    setEditTaskMinutes(task.estimatedMinutes.toString());
    setEditTaskStatus(task.status);
    setNewComment("");
    setTaskSaveMessage("");
  };

  const closeTaskModal = () => setSelectedTask(null);

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGoal(true);
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, reason, status, priority }),
    });
    if (res.ok) {
      setSaveMessage("Saved!");
      router.refresh();
      setIsEditingGoal(false);
      setTimeout(() => setSaveMessage(""), 2500);
    }
    setIsSavingGoal(false);
  };

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseTitle) return;
    const res = await fetch("/api/phases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newPhaseTitle, sequence: newPhaseSequence, goalId: goal.id }),
    });
    if (res.ok) {
      setNewPhaseTitle("");
      setNewPhaseSequence((prev: number) => prev + 1);
      setIsAddingPhase(false);
      router.refresh();
    }
  };

  const handleCreateTask = async (e: React.FormEvent, phaseId: string) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskMinutes) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTaskTitle, estimatedMinutes: newTaskMinutes, phaseId }),
    });
    if (res.ok) {
      setNewTaskTitle("");
      setNewTaskMinutes("");
      setTaskPhaseId(null);
      router.refresh();
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setIsSavingTask(true);
    const res = await fetch(`/api/tasks/${selectedTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTaskTitle,
        description: editTaskDescription,
        estimatedMinutes: editTaskMinutes,
        status: editTaskStatus
      }),
    });
    if (res.ok) {
      router.refresh();
      const updatedTask = await res.json();
      setSelectedTask((prev: any) => ({ ...prev, ...updatedTask }));
      setTaskSaveMessage("Saved!");
      setTimeout(() => setTaskSaveMessage(""), 2500);
    }
    setIsSavingTask(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment) return;
    setIsSubmittingComment(true);
    const res = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newComment }),
    });
    if (res.ok) {
      const comment = await res.json();
      setSelectedTask((prev: any) => ({
        ...prev,
        comments: [comment, ...(prev.comments || [])]
      }));
      setNewComment("");
      router.refresh();
    }
    setIsSubmittingComment(false);
  };

  const allTasks = goal.phases.flatMap((p: any) => p.tasks);
  const doneTasks = allTasks.filter((t: any) => t.status === 'Done').length;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Goal Overview */}
      <div className="glass-panel animate-fade-in">
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: isEditingGoal ? '1.5rem' : '1rem' }}>
          <span className="section-title-icon">📋</span>
          <div style={{ flex: 1 }}>
            <h2 className="section-title">Goal Overview</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {allTasks.length > 0
                ? `${doneTasks} of ${allTasks.length} tasks done · ${progress}% complete`
                : 'No tasks yet — add phases and tasks below'
              }
            </p>
          </div>
          {allTasks.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="progress-bar-track" style={{ width: '100px' }}>
                <div className={`progress-bar-fill${progress === 100 ? ' done' : ''}`} style={{ width: `${progress}%` }} />
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: progress === 100 ? 'var(--success)' : 'var(--text-secondary)', minWidth: '36px' }}>{progress}%</span>
            </div>
          )}
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}
            onClick={() => setIsEditingGoal(v => !v)}
          >
            {isEditingGoal ? '✕ Cancel' : '✎ Edit'}
          </button>
        </div>

        {/* Read view */}
        {!isEditingGoal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
              <span className={`badge badge-${priority.toLowerCase()}`}>{priority} Priority</span>
            </div>
            {description ? (
              <div>
                <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Description</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{description}</p>
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No description — click Edit to add one.</p>
            )}
            {reason && (
              <div style={{ background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--accent)', marginBottom: '0.25rem', fontWeight: 700 }}>💡 Why this goal</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{reason}</p>
              </div>
            )}
            {saveMessage && <span className="save-message">✓ {saveMessage}</span>}
          </div>
        )}

        {/* Edit form */}
        {isEditingGoal && (
          <form onSubmit={handleUpdateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="label">Status</label>
                <select className="input-field" value={status} onChange={e => setStatus(e.target.value)} style={{ appearance: 'auto' }}>
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Priority</label>
                <select className="input-field" value={priority} onChange={e => setPriority(e.target.value)} style={{ appearance: 'auto' }}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="input-field" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="What exactly do you want to achieve?" />
            </div>
            <div className="form-group">
              <label className="label">Why this goal?</label>
              <textarea className="input-field" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Your motivation keeps you going..." />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={isSavingGoal}>
                {isSavingGoal ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setIsEditingGoal(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Phases and Tasks + Add Phase */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* Phases & Tasks */}
        <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>
            <span className="section-title-icon">🗂</span>
            Phases &amp; Tasks
          </h2>

          {goal.phases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📌</div>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No phases yet</p>
              <p className="empty-state-text">Break your goal into phases, then add tasks to each phase.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {goal.phases.map((phase: any) => {
                const phaseDone = phase.tasks.filter((t: any) => t.status === 'Done').length;
                const phaseTotal = phase.tasks.length;
                return (
                  <div key={phase.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '1.25rem' }}>
                    <div className="phase-header">
                      <span className="phase-number">{phase.sequence}</span>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{phase.title}</h3>
                      </div>
                      {phaseTotal > 0 && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{phaseDone}/{phaseTotal}</span>
                      )}
                    </div>

                    {phase.tasks.length === 0 ? (
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', padding: '0.5rem 0', marginBottom: '0.75rem' }}>No tasks yet.</p>
                    ) : (
                      <div style={{ marginBottom: '0.75rem' }}>
                        {phase.tasks.map((task: any) => (
                          <div key={task.id} className="task-row" onClick={() => openTaskModal(task)}>
                            <span className={getTaskIndicatorClass(task.status)} />
                            <span className={`task-row-title${task.status === 'Done' ? ' done' : ''}`}>{task.title}</span>
                            <div className="task-row-info">
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{task.estimatedMinutes}m</span>
                              <span className={getStatusBadgeClass(task.status)}>{task.status === 'InProgress' ? '⚡ Running' : task.status}</span>
                              <button
                                onClick={e => { e.stopPropagation(); openTaskModal(task); }}
                                className="btn-icon"
                                title="Edit task"
                              >
                                ✎
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {taskPhaseId === phase.id ? (
                      <form onSubmit={(e) => handleCreateTask(e, phase.id)} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input type="text" className="input-field" placeholder="Task name" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required style={{ fontSize: '0.875rem' }} />
                        <input type="number" className="input-field" placeholder="Min" value={newTaskMinutes} onChange={e => setNewTaskMinutes(e.target.value)} required style={{ width: '80px', fontSize: '0.875rem' }} />
                        <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Add</button>
                        <button type="button" onClick={() => setTaskPhaseId(null)} className="btn-ghost" style={{ padding: '0.5rem' }}>✕</button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setTaskPhaseId(phase.id)}
                        style={{ width: '100%', padding: '0.6rem', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                        onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.target as HTMLButtonElement).style.color = 'var(--accent)'; }}
                        onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.target as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
                      >
                        + Add Task
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add New Phase */}
        {isAddingPhase ? (
          <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 className="section-title">
                <span className="section-title-icon">➕</span>
                Add Phase
              </h2>
              <button className="btn-ghost" onClick={() => setIsAddingPhase(false)} style={{ padding: '0.4rem 0.9rem' }}>✕ Cancel</button>
            </div>
            <form onSubmit={handleCreatePhase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Phase Title</label>
                <input
                  type="text"
                  className="input-field"
                  value={newPhaseTitle}
                  onChange={e => setNewPhaseTitle(e.target.value)}
                  placeholder="e.g., Initial Research"
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Order</label>
                <input
                  type="number"
                  className="input-field"
                  value={newPhaseSequence}
                  onChange={e => setNewPhaseSequence(parseInt(e.target.value))}
                  min={1}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                Add Phase
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingPhase(true)}
            style={{ width: '100%', padding: '1.25rem', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center', fontWeight: 500 }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.target as HTMLButtonElement).style.color = 'var(--accent)'; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.target as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            + Add New Phase
          </button>
        )}
      </div>

      {/* Task Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeTaskModal(); }}>
          <div className="modal-content">
            <button className="modal-close" onClick={closeTaskModal}>✕</button>

            <div style={{ marginBottom: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Task Details</div>
            <h2 className="modal-title">{editTaskTitle || selectedTask.title}</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className={getStatusBadgeClass(editTaskStatus)}>{editTaskStatus === 'InProgress' ? '⚡ In Progress' : editTaskStatus}</span>
            </div>

            <form onSubmit={handleUpdateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Title</label>
                <input type="text" className="input-field" value={editTaskTitle} onChange={e => setEditTaskTitle(e.target.value)} required />
              </div>

              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="label">Status</label>
                  <select className="input-field" value={editTaskStatus} onChange={e => setEditTaskStatus(e.target.value)} style={{ appearance: 'auto' }}>
                    <option value="Todo">Todo</option>
                    <option value="InProgress">InProgress</option>
                    <option value="Paused">Paused</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Estimated Minutes</label>
                  <input type="number" className="input-field" value={editTaskMinutes} onChange={e => setEditTaskMinutes(e.target.value)} required min={1} />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Notes / Description</label>
                <textarea className="input-field" rows={4} value={editTaskDescription} onChange={e => setEditTaskDescription(e.target.value)} placeholder="Add notes, links, or context..." />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={isSavingTask}>
                  {isSavingTask ? "Saving..." : "Save Changes"}
                </button>
                {taskSaveMessage && <span className="save-message">✓ {taskSaveMessage}</span>}
              </div>
            </form>

            {/* Comments */}
            <div className="modal-section">
              <h3 className="section-title" style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                <span className="section-title-icon" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>💬</span>
                Comments
              </h3>

              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  className="input-field"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a note or comment..."
                  required
                />
                <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '0.65rem 1.1rem' }} disabled={isSubmittingComment}>
                  {isSubmittingComment ? "..." : "Post"}
                </button>
              </form>

              {selectedTask.comments && selectedTask.comments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedTask.comments.map((comment: any) => (
                    <div key={comment.id} className="comment-item">
                      <p className="comment-text">{comment.text}</p>
                      <p className="comment-time">{new Date(comment.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '1.5rem' }}>
                  <p className="empty-state-text">No comments yet. Add one to track your progress!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
