'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { Reservation } from '@/types';

const EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&q=80',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&q=80',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&q=80',
  'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=400&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&q=80',
];

function getEventImage(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EVENT_IMAGES[Math.abs(hash) % EVENT_IMAGES.length];
}

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['PARTICIPANT']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get<Reservation[]>('/reservations/me');
      setReservations(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await api.patch(`/reservations/${id}/cancel`);
      fetchReservations();
    } catch {
      alert('Failed to cancel reservation. Please try again.');
    }
  };

  const handleDownloadTicket = async (id: string) => {
    try {
      const res = await api.get(`/reservations/${id}/ticket`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download ticket. Please try again.');
    }
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'badge badge-confirmed';
      case 'PENDING': return 'badge badge-pending';
      case 'REFUSED': return 'badge badge-refused';
      case 'CANCELED': return 'badge badge-canceled';
      default: return 'badge';
    }
  };

  if (loading) {
    return <div className="loading"><p>Loading your reservations...</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Reservations</h1>
      </div>
      {reservations.length === 0 ? (
        <div className="empty-state">
          <p>You have no reservations yet.</p>
          <p>Browse events to make your first reservation!</p>
        </div>
      ) : (
        <div className="reservation-grid">
          {reservations.map((r) => (
            <div className="reservation-card" key={r.id}>
              <div className="reservation-card-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getEventImage(r.event?.title || 'event')}
                  alt={r.event?.title || 'Event'}
                  loading="lazy"
                />
              </div>
              <div className="reservation-card-body">
                <div className="reservation-card-title">{r.event?.title || 'N/A'}</div>
                {r.event?.location && (
                  <div className="reservation-card-info">📍 {r.event.location}</div>
                )}
                {r.event?.dateTime && (
                  <div className="reservation-card-info">
                    🗓️ {new Date(r.event.dateTime).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
                <div style={{ margin: '0.5rem 0' }}>
                  <span className={getBadgeClass(r.status)}>{r.status}</span>
                </div>
                <div className="reservation-card-actions">
                  {r.status === 'CONFIRMED' && (
                    <button onClick={() => handleDownloadTicket(r.id)} className="btn btn-sm btn-primary">
                      🎟️ Download Ticket
                    </button>
                  )}
                  {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                    <button onClick={() => handleCancel(r.id)} className="btn btn-sm btn-outline">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
