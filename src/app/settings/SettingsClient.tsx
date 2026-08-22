"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsClient({ user }: { user: any }) {
  const router = useRouter();
  
  const [telegramId, setTelegramId] = useState(user.telegramId || "");
  const [morningBriefTime, setMorningBriefTime] = useState(user.morningBriefTime || "08:00");
  const [eveningReviewTime, setEveningReviewTime] = useState(user.eveningReviewTime || "20:00");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: telegramId || null, morningBriefTime, eveningReviewTime }),
    });
    if (res.ok) {
      setSaveMessage("Settings saved!");
      router.refresh();
      setTimeout(() => setSaveMessage(""), 2500);
    }
    setIsSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '640px' }}>
      
      {/* Telegram Section */}
      <div className="glass-panel animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span className="section-title-icon">📱</span>
          <div>
            <h2 className="section-title">Telegram Integration</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Connect your Telegram to receive goal and task notifications.</p>
          </div>
        </div>

        <div style={{ background: 'rgba(108, 99, 255, 0.07)', border: '1px solid rgba(108, 99, 255, 0.2)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            To find your Telegram Chat ID, message{' '}
            <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              @userinfobot
            </a>{' '}
            on Telegram and it will reply with your ID.
          </p>
        </div>

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="label">Telegram Chat ID</label>
            <input
              type="text"
              className="input-field"
              value={telegramId}
              onChange={e => setTelegramId(e.target.value)}
              placeholder="e.g., 123456789"
            />
            {telegramId && (
              <p style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: '0.3rem' }}>✓ Telegram connected</p>
            )}
          </div>

          <hr className="divider" />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span className="section-title-icon">🕐</span>
              <div>
                <h3 className="section-title" style={{ fontSize: '1rem' }}>Notification Schedule</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Set when you receive your daily briefings.</p>
              </div>
            </div>

            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="label">🌅 Morning Brief</label>
                <input
                  type="time"
                  className="input-field"
                  value={morningBriefTime}
                  onChange={e => setMorningBriefTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">🌙 Evening Review</label>
                <input
                  type="time"
                  className="input-field"
                  value={eveningReviewTime}
                  onChange={e => setEveningReviewTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
            {saveMessage && <span className="save-message">✓ {saveMessage}</span>}
          </div>
        </form>
      </div>

      {/* Scheduler Info Card */}
      <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.1s', background: 'rgba(245, 166, 35, 0.05)', borderColor: 'rgba(245, 166, 35, 0.2)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--warning)' }}>Start the Scheduler</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '0.75rem' }}>
              To enable continuous notifications, run the scheduler script alongside your dev server in a new terminal.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.875rem', color: '#a3e635', border: '1px solid rgba(255,255,255,0.08)' }}>
              node scheduler.js
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
