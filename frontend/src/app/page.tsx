import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="text-center">
      <h1>Welcome to EventReserve</h1>
      <p className="mb-3">Your platform for event reservations.</p>
      <Link href="/events" className="btn btn-primary">
        Browse Events
      </Link>
    </div>
  );
}
