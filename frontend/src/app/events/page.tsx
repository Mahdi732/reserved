import { Event } from '@/types';
import EventCard from '@/components/EventCard';

export const dynamic = 'force-dynamic';

async function getPublishedEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/events`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div>
      <div className="page-header">
        <h1>Upcoming Events</h1>
      </div>
      {events.length === 0 ? (
        <div className="empty-state">
          <p>No events available at the moment.</p>
          <p>Check back later for new events!</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
