'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => pathname === href;

  return (
    <nav id="main-nav" className={scrolled ? 'nav-scrolled' : ''}>
      <div className="nav-row-1">
        <div className="nav-link-group">
          <Link href="/" className={isActive('/') ? 'active' : ''}>Home</Link>
          <Link href="/court-booking" className={isActive('/court-booking') ? 'active' : ''}>Court Booking</Link>
        </div>
        <div className="nav-logo-wrap">
          <Link href="/">
            <Image
              src="/NYAC.Website.Photos/NYAC.logo.png"
              alt="NYAC Logo"
              width={120}
              height={48}
              className="nav-logo"
              style={{ height: '48px', width: 'auto' }}
            />
          </Link>
        </div>
        <div className="nav-link-group">
          <Link href="/private-lessons" className={isActive('/private-lessons') ? 'active' : ''}>Private Lessons</Link>
          <Link href="/clinics" className={isActive('/clinics') ? 'active' : ''}>Clinics</Link>
          <button
            id="hamburger-btn"
            aria-label="Open menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div id="mobile-nav" style={{ display: mobileOpen ? 'block' : 'none' }}>
        <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
        <Link href="/court-booking" onClick={() => setMobileOpen(false)}>Court Booking</Link>
        <Link href="/private-lessons" onClick={() => setMobileOpen(false)}>Private Lessons</Link>
        <Link href="/clinics" onClick={() => setMobileOpen(false)}>Clinics</Link>
        <Link href="/staff/login" onClick={() => setMobileOpen(false)}>Member Login</Link>
      </div>
    </nav>
  );
}
