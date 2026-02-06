'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { Event, EventStatus } from '@/types';

export default function EditEventPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <EditEventForm />
    </ProtectedRoute>
  );
}

function EditEventForm() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(10);
  const [status, setStatus] = useState<EventStatus>('DRAFT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get<Event[]>(`/events/admin/all`);
        const found = res.data.find((e: Event) => e.id === eventId);
        if (found) {
          setEvent(found);
          setTitle(found.title);
          setDescription(found.description);
          setDateTime(found.dateTime.slice(0, 16));
          setLocation(found.location);
          setCapacity(found.capacity);
          setStatus(found.status);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.patch(`/events/${eventId}`, { title, description, dateTime, location, capacity, status });
      router.push('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this event?')) return;
    try {
      await api.delete(`/events/${eventId}`);
      router.push('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel event');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!event) return <div className="empty-state">Event not found</div>;

  return (
    <div>
      <h1>Edit Event</h1>
      <form className="form form-wide" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            className="form-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Date and Time</label>
          <input
            className="form-input"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input
            className="form-input"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Capacity</label>
          <input
            className="form-input"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as EventStatus)}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="CANCELED">CANCELED</option>
          </select>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="flex gap-1">
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Event'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => router.push('/admin')}>
            Back
          </button>
          {status !== 'CANCELED' && (
            <button className="btn btn-danger" type="button" onClick={handleCancel}>
              Cancel Event
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
