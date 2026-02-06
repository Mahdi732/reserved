import { notFound } from 'next/navigation';
import { Event } from '@/types';
import ReserveButton from './ReserveButton';

export const dynamic = 'force-dynamic';

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

  const date = new Date(event.dateTime).toLocaleString();

  return (
    <div>
      <div className="card">
        <h1>{event.title}</h1>
        <p className="mb-3">{event.description}</p>
        
        <div className="mb-3">
          <p className="mb-1">
            <strong>Date:</strong> {date}
          </p>
          <p className="mb-1">
            <strong>Location:</strong> {event.location}
          </p>
          <p className="mb-1">
            <strong>Total Capacity:</strong> {event.capacity} people
          </p>
          <p className="mb-0">
            <strong>Available Places:</strong> {event.remainingPlaces ?? 'N/A'} remaining
          </p>
        </div>
        
        <ReserveButton eventId={event.id} />
      </div>
    </div>
  );
}
