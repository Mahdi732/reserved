import Link from 'next/link';
import { Event } from '@/types';

interface Props {
  event: Event;
}

export default function EventCard({ event }: Props) {
  const date = new Date(event.dateTime).toLocaleString();
  
  return (
    <article className="card">
      <h3 className="card-title">{event.title}</h3>
      <p className="mb-2">{event.description}</p>
      <div className="card-meta">
        <p className="mb-1">
          <strong>Date:</strong> {date}
        </p>
        <p className="mb-1">
          <strong>Location:</strong> {event.location}
        </p>
        <p className="mb-0">
          <strong>Available:</strong> {event.remainingPlaces ?? 'N/A'} / {event.capacity} places
        </p>
      </div>
      <div className="card-actions">
        <Link href={`/events/${event.id}`} className="btn btn-primary">
          View Details
        </Link>
      </div>
    </article>
  );
}
