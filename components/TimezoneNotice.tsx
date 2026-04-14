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
      width: '100%',
      background: '#1a1a2e',
      color: '#e0e0e0',
      fontSize: 13,
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderRadius: 6,
      border: '1px solid rgba(255,255,255,0.1)',
      marginBottom: 12,
      boxSizing: 'border-box',
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
          fontSize: 18,
          lineHeight: 1,
          padding: '0 2px',
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
