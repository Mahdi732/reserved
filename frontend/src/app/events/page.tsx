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
      <h1>Published Events</h1>
      {events.length === 0 ? (
        <div className="text-center">
          <p>No events available at the moment.</p>
          <p className="text-gray-600">Check back later for new events!</p>
        </div>
      ) : (
        <div>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
