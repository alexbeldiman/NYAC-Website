'use client';

import { useEffect, useState } from 'react';

const ET_TZ = 'America/New_York';
const DISMISSED_KEY = 'tz_notice_dismissed';

export default function TimezoneNotice() {
  const [show, setShow] = useState(false);
  const [localTz, setLocalTz] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem(DISMISSED_KEY)) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz !== ET_TZ) {
      setLocalTz(tz);
      setShow(true);
      const timer = setTimeout(() => {
        sessionStorage.setItem(DISMISSED_KEY, '1');
        setShow(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#1a1a2e',
      color: '#e0e0e0',
      fontSize: 13,
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    }}>
      <span>
        All times are shown in <strong>Eastern Time (ET)</strong>.
        Your device is set to <strong>{localTz.replace(/_/g, ' ')}</strong>.
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss timezone notice"
        style={{
          background: 'none',
          border: 'none',
          color: '#a0a0a0',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          padding: '0 4px',
          marginLeft: 8,
        }}
      >
        ×
      </button>
    </div>
  );
}
