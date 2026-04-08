'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  const [stickyClosed, setStickyClosed] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    // Fade-up on scroll
    const fadeEls = document.querySelectorAll('.fade-up');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    fadeEls.forEach((el) => observer.observe(el));

    // Sticky CTA — show after hero
    const handleScroll = () => {
      const hero = document.getElementById('hero-section');
      if (!hero) return;
      const heroBottom = hero.getBoundingClientRect().bottom;
      setStickyVisible(heroBottom < 0);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <style suppressHydrationWarning>{`
        /* ─── HERO ──────────────────────────────────────────────────── */
        #hero-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.50);
          z-index: 0;
        }
        .hero-content { position: relative; z-index: 1; padding: 0 24px; }
        .hero-eyebrow {
          font-family: var(--font-ui);
          font-size: 12px;
          font-weight: 500;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          opacity: 0.85;
        }
        .hero-divider {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.7);
          width: 48px;
          margin: 16px auto;
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: 72px;
          font-weight: 400;
          color: white;
          line-height: 1.1;
        }
        .hero-subtitle {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 20px;
          color: white;
          opacity: 0.80;
          margin-top: 16px;
        }
        .hero-ctas {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 40px;
          flex-wrap: wrap;
        }
        .hero-scroll {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1;
          opacity: 0.65;
          animation: bounce 1.6s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(9px); }
        }

        /* ─── INFO BAR ──────────────────────────────────────────────── */
        #info-bar {
          background: linear-gradient(to right, var(--charcoal) 0%, var(--crimson) 50%, var(--charcoal) 100%);
          display: flex;
        }
        .info-tile {
          flex: 1;
          padding: 28px 32px;
          border-right: 1px solid rgba(255,255,255,0.1);
          text-decoration: none;
          display: block;
          transition: background-color 0.25s ease;
        }
        .info-tile:last-child { border-right: none; }
        .info-tile:hover { background: rgba(255,255,255,0.06); }
        .info-tile:hover .info-value { color: var(--crimson); }
        .info-label {
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.16em;
          display: block;
          margin-bottom: 8px;
        }
        .info-value {
          font-family: var(--font-body);
          font-size: 17px;
          font-weight: 600;
          color: var(--white);
          transition: color 0.25s ease;
        }

        /* ─── ABOUT THE PLACE ───────────────────────────────────────── */
        #about-place { background: var(--white); display: flex; }
        .about-place-text { flex: 1; padding: 96px 64px 96px 80px; }
        .about-place-img-wrap {
          flex: 1;
          min-height: 560px;
          overflow: visible;
          position: relative;
          margin-right: 36px;
        }
        .about-place-img {
          width: 100%;
          height: 100%;
          min-height: 560px;
          object-fit: cover;
          object-position: center;
          display: block;
          box-shadow: 12px 12px 0px var(--crimson);
        }
        .about-place-text h2 {
          font-family: var(--font-display);
          font-size: 42px;
          font-weight: 400;
          color: var(--crimson);
          line-height: 1.2;
          margin-bottom: 28px;
        }
        .about-place-text p {
          font-family: var(--font-body);
          font-size: 17px;
          color: var(--dark);
          line-height: 1.8;
          margin-bottom: 20px;
        }

        /* ─── ABOUT THE DIRECTOR ────────────────────────────────────── */
        #about-director { background: var(--off-white); display: flex; }
        .director-photo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 96px 48px;
          flex: 1;
        }
        .director-photo {
          width: 240px;
          height: 240px;
          border-radius: 50%;
          border: 4px solid var(--crimson);
          background: var(--light-gray);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-ui);
          font-size: 12px;
          color: var(--mid-gray);
          text-align: center;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .director-text { flex: 1; padding: 96px 80px 96px 48px; }
        .director-text .director-name {
          font-family: var(--font-display);
          font-size: 40px;
          color: var(--crimson);
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .director-text .director-title {
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 500;
          color: var(--mid-gray);
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin-bottom: 28px;
          display: block;
        }
        .director-text p {
          font-family: var(--font-body);
          font-size: 17px;
          color: var(--dark);
          line-height: 1.8;
          margin-bottom: 20px;
        }

        /* ─── COACHES ───────────────────────────────────────────────── */
        #about-coaches { background: var(--white); padding: 96px 0; }
        .coaches-header { text-align: center; margin-bottom: 56px; }
        .coaches-header h2 {
          font-family: var(--font-display);
          font-size: 42px;
          font-weight: 400;
          color: var(--crimson);
          line-height: 1.2;
        }
        .coaches-container { max-width: 860px; margin: 0 auto; padding: 0 24px; }
        .coach-card {
          display: flex;
          align-items: center;
          gap: 36px;
          padding: 32px 36px;
          border: 1px solid var(--light-gray);
          background: var(--white);
          margin-bottom: 20px;
          transition: all 0.25s ease;
          cursor: pointer;
        }
        .coach-card:hover {
          border-top: 3px solid var(--crimson);
          box-shadow: 0 8px 28px rgba(0,0,0,0.08);
          transform: translateY(-3px);
        }
        .coach-photo {
          width: 160px;
          height: 160px;
          flex-shrink: 0;
          background: var(--light-gray);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-ui);
          font-size: 11px;
          color: var(--mid-gray);
          text-align: center;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .coach-info { flex: 1; }
        .coach-name {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 600;
          color: var(--dark);
          line-height: 1.3;
          margin-bottom: 4px;
        }
        .coach-role {
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 500;
          color: var(--mid-gray);
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin-bottom: 10px;
          display: block;
        }
        .coach-bio {
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--mid-gray);
          line-height: 1.7;
        }

        /* ─── BULLETIN BOARD ────────────────────────────────────────── */
        #bulletin-board { background: var(--off-white); padding: 96px 0; }
        .bulletin-header { text-align: center; margin-bottom: 56px; }
        .bulletin-header h2 {
          font-family: var(--font-display);
          font-size: 42px;
          font-weight: 400;
          color: var(--crimson);
          line-height: 1.2;
        }
        .news-grid {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        .news-card {
          background: var(--white);
          border: 1px solid var(--light-gray);
          overflow: hidden;
          transition: box-shadow 0.25s ease;
        }
        .news-card:hover { box-shadow: 0 10px 32px rgba(0,0,0,0.09); }
        .news-img-placeholder {
          width: 100%;
          aspect-ratio: 16 / 9;
          background: var(--light-gray);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-ui);
          font-size: 11px;
          color: var(--mid-gray);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .news-card-body { padding: 24px 28px 28px; }
        .news-date {
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 500;
          color: var(--mid-gray);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-bottom: 8px;
          display: block;
        }
        .news-title {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--dark);
          margin-bottom: 12px;
          line-height: 1.3;
        }
        .news-body {
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--mid-gray);
          line-height: 1.7;
          margin-bottom: 16px;
        }
        .news-read-more {
          font-family: var(--font-ui);
          font-size: 12px;
          color: var(--crimson);
          letter-spacing: 0.06em;
          font-weight: 500;
        }
        .news-read-more:hover { text-decoration: underline; }

        /* ─── STICKY CTA ────────────────────────────────────────────── */
        #sticky-cta {
          position: fixed;
          bottom: 0; left: 0;
          width: 100%;
          background: var(--crimson);
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 14px 24px;
          transform: translateY(100%);
          transition: transform 0.35s ease;
        }
        #sticky-cta.visible { transform: translateY(0); }
        #sticky-cta span {
          font-family: var(--font-ui);
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.85);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        #sticky-cta a {
          font-family: var(--font-ui);
          font-size: 12px;
          font-weight: 600;
          color: white;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid rgba(255,255,255,0.5);
          padding: 9px 24px;
          transition: background 0.25s ease;
        }
        #sticky-cta a:hover { background: rgba(255,255,255,0.12); }
        #sticky-cta-close {
          position: absolute;
          right: 20px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.6);
          font-size: 20px;
          cursor: pointer;
          line-height: 1;
          padding: 4px;
        }
        #sticky-cta-close:hover { color: white; }

        /* ─── RESPONSIVE ────────────────────────────────────────────── */
        @media (max-width: 900px) {
          .news-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 44px; }
          #info-bar { flex-wrap: wrap; }
          .info-tile { flex: 1 1 50%; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); }
          .info-tile:nth-child(odd) { border-right: 1px solid rgba(255,255,255,0.1); }
          .info-tile:nth-child(4), .info-tile:nth-child(5) { border-bottom: none; }
          #about-place { flex-direction: column; }
          .about-place-img-wrap { min-height: 320px; margin-right: 0; }
          .about-place-img { min-height: 320px; box-shadow: 8px 8px 0px var(--crimson); }
          .about-place-text { padding: 64px 32px; }
          #about-director { flex-direction: column; }
          .director-photo-wrap { padding: 64px 24px 32px; }
          .director-photo { width: 180px; height: 180px; }
          .director-text { padding: 0 32px 64px; }
          .coach-card { flex-direction: column; align-items: flex-start; }
          .coach-photo { width: 100%; height: 220px; }
          #sticky-cta { gap: 12px; }
          #sticky-cta span { display: none; }
        }
        @media (max-width: 600px) {
          .news-grid { grid-template-columns: 1fr; padding: 0 24px; }
        }
      `}</style>

      {/* ─── STICKY BOOK CTA ──────────────────────────────────────── */}
      {!stickyClosed && (
        <div id="sticky-cta" className={stickyVisible ? 'visible' : ''}>
          <span>NYAC Travers Island Tennis</span>
          <Link href="/court-booking">Book a Court</Link>
          <Link href="/private-lessons">Book a Lesson</Link>
          <Link href="/clinics">Book a Clinic</Link>
          <button id="sticky-cta-close" aria-label="Close" onClick={() => setStickyClosed(true)}>&times;</button>
        </div>
      )}

      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section id="hero-section">
        <Image fill priority src="/NYAC.Website.Photos/Arial.View.Courts.png" alt="" style={{ objectFit: 'cover', zIndex: -1 }} />
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-eyebrow">NYAC Travers Island</p>
          <hr className="hero-divider" />
          <h1 className="hero-title">Tennis House</h1>
          <p className="hero-subtitle">Pelham Bay &middot; New York</p>
          <div className="hero-ctas">
            <Link href="/clinics" className="btn-ghost">View Clinics</Link>
            <Link href="/court-booking" className="btn-crimson">Book a Court</Link>
            <Link href="/private-lessons" className="btn-ghost">Private Lessons</Link>
          </div>
        </div>
        <div className="hero-scroll" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </section>

      {/* ─── INFO BAR ──────────────────────────────────────────────── */}
      <div id="info-bar">
        <a href="#" className="info-tile">
          <span className="info-label">Hours</span>
          <span className="info-value">Mon–Sun: 7:00 AM – 9:00 PM</span>
        </a>
        <a href="#" className="info-tile">
          <span className="info-label">Location</span>
          <span className="info-value">Travers Island, Pelham Bay, NY</span>
        </a>
        <Link href="/court-booking" className="info-tile">
          <span className="info-label">Court Rental</span>
          <span className="info-value">From $35/hr</span>
        </Link>
        <Link href="/clinics" className="info-tile">
          <span className="info-label">Clinics</span>
          <span className="info-value">Weekends 9–11 AM</span>
        </Link>
        <Link href="/private-lessons" className="info-tile">
          <span className="info-label">Private Lessons</span>
          <span className="info-value">From $120/session</span>
        </Link>
      </div>

      {/* ─── ABOUT THE PLACE ──────────────────────────────────────── */}
      <section id="about-place">
        <div className="about-place-text fade-up">
          <span className="section-label">About Travers Island</span>
          <hr className="divider-crimson" />
          <h2>A Storied Venue<br />for the Sport of Tennis</h2>
          <p>Travers Island has been home to competitive tennis within the New York Athletic Club since the early twentieth century. The courts have hosted generations of members, from weekend players to nationally ranked competitors, all sharing the same tradition of sport and sportsmanship that defines the NYAC&apos;s legacy.</p>
          <p>The tennis complex sits on the eastern point of Travers Island, overlooking the Long Island Sound with views that few athletic facilities in the region can match. Twelve Har-Tru clay courts — including two championship courts with spectator seating — are complemented by a well-appointed clubhouse, pro shop, and covered pavilion.</p>
          <p>Playing tennis at Travers Island means joining a community with genuine depth — members who have played together for decades, professionals who invest in your game, and a program structured to challenge players at every level. It is not simply a place to hit; it is a place to improve, compete, and belong.</p>
        </div>
        <div className="about-place-img-wrap fade-up">
          <Image
            src="/NYAC.Website.Photos/Side.View.Courts.png"
            alt="Travers Island tennis courts — covered patio with Adirondack chairs"
            className="about-place-img"
            width={800}
            height={560}
            style={{ width: '100%', height: '100%', minHeight: '560px', objectFit: 'cover' }}
          />
        </div>
      </section>

      {/* ─── ABOUT THE DIRECTOR ───────────────────────────────────── */}
      <section id="about-director">
        <div className="director-photo-wrap fade-up">
          <div className="director-photo">Director<br />Photo</div>
        </div>
        <div className="director-text fade-up">
          <span className="section-label">Tennis Director</span>
          <hr className="divider-crimson" />
          <p className="director-name">Marcus Reynolds</p>
          <span className="director-title">Director of Tennis</span>
          <p>Marcus Reynolds brings over 20 years of professional tennis instruction to Travers Island, having coached at the Manhattan Country Club and the Racquet &amp; Tennis Club before joining the NYAC. A graduate of the Nick Bollettieri Tennis Academy, he holds USPTA Elite certification and has developed junior players who have gone on to compete at the collegiate level.</p>
          <p>His philosophy centers on building technical precision alongside mental resilience — the belief that championship tennis begins long before a match is ever played. Under his direction, the Travers Island program has expanded its adult clinics, introduced a junior development pathway, and cultivated a playing culture that reflects the traditions of the Club.</p>
        </div>
      </section>

      {/* ─── ABOUT THE COACHES ────────────────────────────────────── */}
      <section id="about-coaches">
        <div className="coaches-header fade-up">
          <span className="section-label">Our Coaching Staff</span>
          <hr className="divider-crimson centered" />
          <h2>Meet the Team</h2>
        </div>
        <div className="coaches-container">
          {[
            { name: 'Sofia Marchetti', role: 'Head Pro', bio: 'USPTA-certified with 12 years of competitive experience, specializing in adult instruction and advanced stroke mechanics.' },
            { name: 'Daniel Park', role: 'Assistant Pro', bio: 'Former Division I collegiate player, Daniel focuses on junior development and high-performance conditioning programs.' },
            { name: 'Priya Nair', role: 'Clinic Coordinator', bio: 'A nationally ranked junior player in her youth, Priya now leads group clinics and beginner development for new members.' },
            { name: 'James Whitfield', role: 'Performance Coach', bio: 'James specializes in competitive match preparation, fitness integration, and working with members who play USTA league tennis.' },
            { name: 'Elena Vasquez', role: 'Junior Academy Director', bio: 'Elena oversees the junior academy pipeline, coordinating year-round skill progression for players ages 8–18.' },
          ].map((coach) => (
            <div key={coach.name} className="coach-card fade-up">
              <div className="coach-photo">Coach Photo</div>
              <div className="coach-info">
                <p className="coach-name">{coach.name}</p>
                <span className="coach-role">{coach.role}</span>
                <p className="coach-bio">{coach.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BULLETIN BOARD ───────────────────────────────────────── */}
      <section id="bulletin-board">
        <div className="bulletin-header fade-up">
          <span className="section-label">Club Updates</span>
          <hr className="divider-crimson centered" />
          <h2>News &amp; Announcements</h2>
        </div>
        <div className="news-grid">
          {[
            { date: 'March 15, 2025', title: 'Spring Clay Court Season Opens April 1', body: 'All twelve Har-Tru courts will be fully operational beginning April 1st. Members are encouraged to book early as weekend slots fill quickly during the spring season. Online court reservations are now live.' },
            { date: 'February 28, 2025', title: 'Adult Clinic Schedule — Spring 2025', body: 'The spring clinic schedule is now available, featuring beginner, intermediate, and advanced sessions across all skill levels. Registration opens March 10th — spaces are limited to twelve players per session.' },
            { date: 'February 10, 2025', title: 'Member Tournament Returns This June', body: 'The annual member tournament returns this June with singles and doubles draws for all levels. Registration opens May 1st. Full draws, seedings, and bracket information will be posted as we approach the event.' },
          ].map((item) => (
            <article key={item.title} className="news-card fade-up">
              <div className="news-img-placeholder">Image Placeholder</div>
              <div className="news-card-body">
                <span className="news-date">{item.date}</span>
                <h3 className="news-title">{item.title}</h3>
                <p className="news-body">{item.body}</p>
                <a href="#" className="news-read-more">Read More &rarr;</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── MAP ──────────────────────────────────────────────────── */}
      <section id="map-section">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3015.0!2d-73.8!3d40.87!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c2f3e000000000%3A0x1!2sTravers+Island%2C+NY!5e0!3m2!1sen!2sus!4v1"
          width="100%"
          height="480"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>

      <Footer />
    </>
  );
}
