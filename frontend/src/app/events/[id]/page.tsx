import { notFound } from 'next/navigation';
import { Event } from '@/types';
import ReserveButton from './ReserveButton';

export const dynamic = 'force-dynamic';

// Same image array as EventCard for consistency
const EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=80',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&q=80',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80',
  'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=1200&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80',
];

function getEventImage(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EVENT_IMAGES[Math.abs(hash) % EVENT_IMAGES.length];
}

async function getEvent(id: string): Promise<Event | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/events/${id}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface Props {
  params: { id: string };
}

export default async function EventDetailPage({ params }: Props) {
  const event = await getEvent(params.id);
  if (!event) return notFound();

  const d = new Date(event.dateTime);
  const remaining = event.remainingPlaces ?? event.capacity;
  const fillPercent = Math.round(((event.capacity - remaining) / event.capacity) * 100);

  return (
    <div className="event-detail">
      {/* Hero Banner */}
      <div className="event-detail-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getEventImage(event.title)} alt={event.title} />
        <div className="event-detail-hero-overlay" />
        <div className="event-detail-hero-text">
          <h1>{event.title}</h1>
          <p style={{ color: '#d4d4d8', margin: 0, fontSize: '0.9375rem' }}>
            📍 {event.location} &nbsp;·&nbsp; 🗓️ {d.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="event-detail-content">
        <div className="event-detail-main">
          <h2>About This Event</h2>
          <p>{event.description}</p>
        </div>

        <aside className="event-detail-sidebar">
          <h3 style={{ marginBottom: '1rem' }}>Event Details</h3>
          <ul className="event-info-list">
            <li className="event-info-item">
              <span className="event-info-label">Date</span>
              <span className="event-info-value">
                {d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </li>
            <li className="event-info-item">
              <span className="event-info-label">Time</span>
              <span className="event-info-value">
                {d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </li>
            <li className="event-info-item">
              <span className="event-info-label">Location</span>
              <span className="event-info-value">{event.location}</span>
            </li>
            <li className="event-info-item">
              <span className="event-info-label">Capacity</span>
              <span className="event-info-value">{event.capacity} people</span>
            </li>
            <li className="event-info-item">
              <span className="event-info-label">Available</span>
              <span className="event-info-value">{remaining} spots</span>
            </li>
          </ul>

          <div className="capacity-bar-wrapper">
            <div className="capacity-info">
              <span>{remaining} spots left</span>
              <span>{fillPercent}% filled</span>
            </div>
            <div className="capacity-bar">
              <div
                className={`capacity-fill${remaining <= Math.ceil(event.capacity * 0.2) ? ' low' : ''}`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>

          <ReserveButton eventId={event.id} />
        </aside>
      </div>
    </div>
  );
}
