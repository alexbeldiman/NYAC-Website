'use client';

import Image from 'next/image';

interface Tab {
  id: string;
  label: string;
}

interface StaffLayoutProps {
  role: string;
  userName: string;
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
}

const ROLE_DISPLAY: Record<string, string> = {
  director: 'Director',
  creator: 'Director',
  coach: 'Coach',
  tennis_house: 'Tennis House',
};

export default function StaffLayout({
  role,
  userName,
  tabs,
  activeTab,
  onTabChange,
  children,
}: StaffLayoutProps) {
  return (
    <>
      <style suppressHydrationWarning>{`
        .staff-shell {
          display: flex;
          min-height: 100vh;
          background: var(--staff-bg);
          color: var(--staff-text);
          font-family: var(--font-ui);
          overflow: hidden;
        }

        /* ─── SIDEBAR ───────────────────────────────────────────── */
        .staff-sidebar {
          width: var(--staff-sidebar-w);
          min-height: 100vh;
          background: var(--staff-sidebar);
          position: fixed;
          top: 0; left: 0;
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--staff-border);
          z-index: 40;
        }

        .sidebar-top {
          padding: 28px 24px 20px;
          border-bottom: 1px solid var(--staff-border);
        }

        .sidebar-logo {
          height: 32px;
          width: auto;
          filter: brightness(0) invert(1);
          opacity: 0.9;
          margin-bottom: 16px;
        }

        .sidebar-role-badge {
          display: inline-block;
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--white);
          background: var(--crimson);
          padding: 4px 10px;
          margin-bottom: 8px;
        }

        .sidebar-username {
          font-family: var(--font-ui);
          font-size: 12px;
          color: var(--staff-muted);
          letter-spacing: 0.04em;
          display: block;
        }

        /* ─── NAV ───────────────────────────────────────────────── */
        .sidebar-nav {
          flex: 1;
          padding: 16px 0;
          overflow-y: auto;
        }

        .sidebar-nav-item {
          display: block;
          width: 100%;
          text-align: left;
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--staff-muted);
          padding: 11px 24px;
          background: none;
          border: none;
          border-left: 3px solid transparent;
          cursor: pointer;
          transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
        }

        .sidebar-nav-item:hover {
          color: var(--staff-text);
          background: rgba(255,255,255,0.04);
        }

        .sidebar-nav-item.active {
          color: var(--crimson);
          border-left-color: var(--crimson);
          background: rgba(200,16,46,0.07);
        }

        /* ─── BOTTOM ────────────────────────────────────────────── */
        .sidebar-bottom {
          padding: 20px 24px;
          border-top: 1px solid var(--staff-border);
        }

        .sidebar-logout {
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--staff-dim);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sidebar-logout:hover { color: var(--staff-muted); }

        /* ─── MAIN ──────────────────────────────────────────────── */
        .staff-main {
          margin-left: var(--staff-sidebar-w);
          flex: 1;
          min-height: 100vh;
          min-width: 0;
          background: var(--staff-bg);
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* ─── SHARED CONTENT CLASSES ────────────────────────────── */
        .staff-content { padding: 36px 40px; max-width: 1200px; }

        .staff-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--staff-border);
          gap: 24px;
          flex-wrap: wrap;
        }

        .staff-page-title {
          font-family: var(--font-label);
          font-size: 28px;
          font-weight: 400;
          color: var(--staff-text);
          line-height: 1.2;
        }

        .staff-section-label {
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--staff-dim);
          display: block;
          margin-bottom: 6px;
        }

        /* ─── CARDS ─────────────────────────────────────────────── */
        .staff-card {
          background: var(--staff-card);
          border: 1px solid var(--staff-border);
          padding: 24px;
          margin-bottom: 16px;
        }

        .staff-card-title {
          font-family: var(--font-label);
          font-size: 16px;
          font-weight: 600;
          color: var(--staff-text);
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--staff-border);
        }

        /* ─── STAT CARDS ────────────────────────────────────────── */
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .stat-card {
          background: var(--staff-card);
          border: 1px solid var(--staff-border);
          border-top: 3px solid var(--crimson);
          padding: 20px 24px;
        }
        .stat-label {
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--staff-dim);
          margin-bottom: 8px;
          display: block;
        }
        .stat-value {
          font-family: var(--font-label);
          font-size: 32px;
          font-weight: 600;
          color: var(--staff-text);
          line-height: 1;
        }

        /* ─── TABLES ────────────────────────────────────────────── */
        .staff-table {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--font-ui);
          font-size: 13px;
        }
        .staff-table th {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--staff-dim);
          text-align: left;
          padding: 10px 16px;
          border-bottom: 1px solid var(--staff-border);
          white-space: nowrap;
        }
        .staff-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--staff-border);
          color: var(--staff-muted);
          vertical-align: middle;
        }
        .staff-table tr:hover td { background: rgba(255,255,255,0.025); }
        .staff-table .td-primary { color: var(--staff-text); font-weight: 500; }

        /* ─── BADGES ────────────────────────────────────────────── */
        .badge {
          display: inline-block;
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 9px;
        }
        .badge-confirmed  { background: rgba(34,197,94,0.12);   color: #4ade80; }
        .badge-pending    { background: rgba(245,158,11,0.12);  color: #fbbf24; }
        .badge-cancelled  { background: rgba(200,16,46,0.15);   color: #f87171; }
        .badge-completed  { background: rgba(148,163,184,0.12); color: #94a3b8; }
        .badge-approved   { background: rgba(34,197,94,0.12);   color: #4ade80; }
        .badge-rejected   { background: rgba(200,16,46,0.15);   color: #f87171; }
        .badge-available  { background: rgba(34,197,94,0.12);   color: #4ade80; }
        .badge-blocked    { background: rgba(200,16,46,0.15);   color: #f87171; }
        .badge-maintenance { background: rgba(245,158,11,0.12); color: #fbbf24; }

        /* ─── STATUS DOT ────────────────────────────────────────── */
        .status-dot {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          margin-right: 7px;
          flex-shrink: 0;
        }
        .dot-available  { background: #4ade80; }
        .dot-blocked    { background: #f87171; }
        .dot-maintenance { background: #fbbf24; }

        /* ─── INPUTS ────────────────────────────────────────────── */
        .staff-input {
          background: var(--staff-surface);
          border: 1px solid var(--staff-border);
          color: var(--staff-text);
          font-family: var(--font-ui);
          font-size: 13px;
          padding: 9px 12px;
          outline: none;
          transition: border-color 0.15s ease;
          width: 100%;
        }
        .staff-input:focus { border-color: var(--crimson); }
        .staff-input::placeholder { color: var(--staff-dim); }

        select.staff-input option { background: var(--staff-surface); color: var(--staff-text); }

        .staff-label-text {
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--staff-dim);
          display: block;
          margin-bottom: 6px;
        }

        .form-group { margin-bottom: 16px; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        /* ─── BUTTONS ───────────────────────────────────────────── */
        .btn-staff-primary {
          background: var(--crimson);
          color: white;
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 10px 22px;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .btn-staff-primary:hover { background: var(--crimson-dk); }
        .btn-staff-primary:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-staff-ghost {
          background: rgba(255,255,255,0.06);
          color: var(--staff-muted);
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 10px 22px;
          border: 1px solid var(--staff-border);
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .btn-staff-ghost:hover { background: rgba(255,255,255,0.1); color: var(--staff-text); }
        .btn-staff-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-staff-danger {
          background: rgba(200,16,46,0.12);
          color: #f87171;
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 8px 16px;
          border: 1px solid rgba(200,16,46,0.3);
          cursor: pointer;
          transition: background 0.15s ease;
          white-space: nowrap;
        }
        .btn-staff-danger:hover { background: rgba(200,16,46,0.22); }

        .btn-staff-approve {
          background: rgba(34,197,94,0.12);
          color: #4ade80;
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 8px 16px;
          border: 1px solid rgba(34,197,94,0.3);
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .btn-staff-approve:hover { background: rgba(34,197,94,0.22); }

        /* ─── MISC ──────────────────────────────────────────────── */
        .staff-divider {
          border: none;
          border-top: 1px solid var(--staff-border);
          margin: 24px 0;
        }

        .staff-empty {
          text-align: center;
          padding: 48px 24px;
          color: var(--staff-dim);
          font-family: var(--font-ui);
          font-size: 12px;
          letter-spacing: 0.08em;
        }

        .staff-error {
          background: rgba(200,16,46,0.1);
          border: 1px solid rgba(200,16,46,0.3);
          color: #f87171;
          font-family: var(--font-ui);
          font-size: 12px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }

        .staff-success {
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.3);
          color: #4ade80;
          font-family: var(--font-ui);
          font-size: 12px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }

        .date-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .date-controls button {
          background: var(--staff-card);
          border: 1px solid var(--staff-border);
          color: var(--staff-muted);
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.15s ease;
        }
        .date-controls button:hover { background: var(--staff-surface); color: var(--staff-text); }
        .date-controls .date-display {
          font-family: var(--font-ui);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.06em;
          color: var(--staff-text);
          min-width: 140px;
          text-align: center;
        }
        .date-controls input[type="date"].staff-input {
          width: auto;
          padding: 7px 12px;
          font-size: 12px;
          letter-spacing: 0.04em;
        }

        .section-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .sub-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid var(--staff-border);
          margin-bottom: 28px;
        }
        .sub-tab {
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--staff-dim);
          padding: 10px 20px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: color 0.15s ease, border-color 0.15s ease;
          margin-bottom: -1px;
        }
        .sub-tab:hover { color: var(--staff-muted); }
        .sub-tab.active { color: var(--crimson); border-bottom-color: var(--crimson); }

        .court-row {
          background: var(--staff-card);
          border: 1px solid var(--staff-border);
          padding: 16px 20px;
          margin-bottom: 8px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .court-row-name {
          font-family: var(--font-ui);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--staff-text);
          min-width: 90px;
          padding-top: 2px;
        }
        .court-row-lessons {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .lesson-chip {
          background: var(--staff-surface);
          border: 1px solid var(--staff-border-hi);
          padding: 6px 12px;
          font-family: var(--font-ui);
          font-size: 11px;
          color: var(--staff-muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .lesson-chip-time { color: var(--staff-text); font-weight: 600; }
        .lesson-chip-name { color: var(--staff-muted); }
        .lesson-chip-unassigned { border-color: rgba(245,158,11,0.3); }
        .lesson-chip-unassigned .lesson-chip-name { color: #fbbf24; }

        @media (max-width: 900px) {
          .staff-sidebar { width: 60px; }
          .sidebar-logo, .sidebar-role-badge, .sidebar-username, .sidebar-nav-item span { display: none; }
          .sidebar-nav-item { padding: 14px; text-align: center; font-size: 9px; letter-spacing: 0; }
          .staff-main { margin-left: 60px; }
          .stat-grid { grid-template-columns: repeat(2,1fr); }
          .form-row { grid-template-columns: 1fr; }
          .staff-content { padding: 24px 20px; }
        }
      `}</style>

      <div className="staff-shell">
        {/* ─── SIDEBAR ──────────────────────────────────────────── */}
        <aside className="staff-sidebar">
          <div className="sidebar-top">
            <Image
              src="/NYAC.Website.Photos/NYAC.logo.png"
              alt="NYAC"
              width={100}
              height={32}
              className="sidebar-logo"
              style={{ objectFit: 'contain', objectPosition: 'left' }}
            />
            <span className="sidebar-role-badge">{ROLE_DISPLAY[role] ?? role}</span>
            <span className="sidebar-username">{userName}</span>
          </div>

          <nav className="sidebar-nav" role="navigation" aria-label="Dashboard navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`sidebar-nav-item${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => onTabChange(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="sidebar-logout">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Log Out
              </button>
            </form>
          </div>
        </aside>

        {/* ─── MAIN ─────────────────────────────────────────────── */}
        <main className="staff-main">
          {children}
        </main>
      </div>
    </>
  );
}
