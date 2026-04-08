import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="site-footer">
      <div className="footer-inner">
        <div className="footer-contact">
          <span className="footer-col-heading">Contact</span>
          <p>1 Travers Island Road</p>
          <p>Pelham Bay, NY 10461</p>
          <a href="tel:2127677000">(212) 767-7000</a>
          <a href="mailto:tennis@nyac.org">tennis@nyac.org</a>
        </div>
        <div className="footer-links">
          <span className="footer-col-heading">Quick Links</span>
          <Link href="/">Home</Link>
          <Link href="/court-booking">Court Booking</Link>
          <Link href="/private-lessons">Private Lessons</Link>
          <Link href="/clinics">Clinics</Link>
        </div>
        <div className="footer-hours">
          <span className="footer-col-heading">Hours of Operation</span>
          <div className="footer-hours-row">
            <span className="footer-hours-day">Mon – Fri</span>
            <span className="footer-hours-time">7:00 AM – 9:00 PM</span>
            <span className="footer-hours-day">Sat – Sun</span>
            <span className="footer-hours-time">6:30 AM – 8:00 PM</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; 2025 New York Athletic Club &mdash; Travers Island Tennis
      </div>
    </footer>
  );
}
