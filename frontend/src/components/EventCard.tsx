import Link from 'next/link';
import { Event } from '@/types';

interface Props {
  event: Event;
}

// Deterministic Unsplash images based on event title
const EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80', // concert
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80', // conference
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&q=80', // seminar
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80', // festival
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&q=80', // stage
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&q=80', // graduation
  'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=600&q=80', // workshop
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80', // gala
];

function getEventImage(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EVENT_IMAGES[Math.abs(hash) % EVENT_IMAGES.length];
}

export default function EventCard({ event }: Props) {
  const d = new Date(event.dateTime);
  const day = d.getDate();
  const month = d.toLocaleString('en', { month: 'short' }).toUpperCase();
  const remaining = event.remainingPlaces ?? event.capacity;
  const fillPercent = Math.round(((event.capacity - remaining) / event.capacity) * 100);
  const isLow = remaining <= Math.ceil(event.capacity * 0.2);

  return (
    <article className="event-card">
      <div className="event-card-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getEventImage(event.title)} alt={event.title} loading="lazy" />
        <div className="event-card-date-badge">
          <span className="day">{day}</span>
          <span className="month">{month}</span>
        </div>
      </div>
      <div className="event-card-body">
        <h3 className="event-card-title">
          <Link href={`/events/${event.id}`}>{event.title}</Link>
        </h3>
        <p className="event-card-desc">{event.description}</p>
        <div className="event-card-meta">
          <span className="event-card-meta-item">
            <span className="event-card-meta-icon">📍</span>
            {event.location}
          </span>
          <span className="event-card-meta-item">
            <span className="event-card-meta-icon">🕐</span>
            {d.toLocaleString()}
          </span>
        </div>
        <div className="capacity-bar-wrapper">
          <div className="capacity-info">
            <span>{remaining} spots left</span>
            <span>{fillPercent}% filled</span>
          </div>
          <div className="capacity-bar">
            <div
              className={`capacity-fill${isLow ? ' low' : ''}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
        <div className="event-card-footer">
          <Link href={`/events/${event.id}`} className="btn btn-primary">
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export { getEventImage };
