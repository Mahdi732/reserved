import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Discover & Reserve Amazing Events</h1>
          <p className="subtitle">
            From concerts to conferences — find your next unforgettable experience
            and secure your spot in just a few clicks.
          </p>
          <Link href="/events" className="btn btn-primary btn-lg">
            Browse Events
          </Link>
        </div>
      </section>

      {/* Features Strip */}
      <section className="features">
        <div className="feature-item">
          <div className="feature-icon">-</div>
          <h3>Explore Events</h3>
          <p>Browse through a curated selection of upcoming events near you.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">-</div>
          <h3>Instant Booking</h3>
          <p>Reserve your seat in seconds with our streamlined process.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">-</div>
          <h3>Digital Tickets</h3>
          <p>Get your PDF tickets delivered instantly once confirmed.</p>
        </div>
      </section>
    </div>
  );
}
