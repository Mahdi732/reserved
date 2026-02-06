'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { Event, Reservation, StatsResponse, ReservationStatsResponse } from '@/types';

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function getBadgeClass(status: string) {
  switch (status) {
    case 'PENDING': return 'badge badge-pending';
    case 'CONFIRMED': return 'badge badge-confirmed';
    case 'PUBLISHED': return 'badge badge-published';
    case 'REFUSED': return 'badge badge-refused';
    case 'CANCELED': return 'badge badge-canceled';
    case 'DRAFT': return 'badge badge-draft';
    default: return 'badge';
  }
}

function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [resStats, setResStats] = useState<ReservationStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evtRes, resRes, statsRes, resStatsRes] = await Promise.all([
        api.get<Event[]>('/events/admin/all'),
        api.get<Reservation[]>('/reservations/admin/all'),
        api.get<StatsResponse>('/events/admin/stats'),
        api.get<ReservationStatsResponse>('/reservations/admin/stats'),
      ]);
      setEvents(evtRes.data);
      setReservations(resRes.data);
      setStats(statsRes.data);
      setResStats(resStatsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>

      {(stats || resStats) && (
        <div className="stats-grid">
          {stats && (
            <>
              <div className="stat-card">
                <div className="stat-value">{stats.upcomingCount}</div>
                <div className="stat-label">Upcoming Events</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.fillRate}%</div>
                <div className="stat-label">Fill Rate</div>
              </div>
            </>
          )}
          {resStats && (
            <>
              <div className="stat-card">
                <div className="stat-value">{resStats.statusCounts.PENDING}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{resStats.statusCounts.CONFIRMED}</div>
                <div className="stat-label">Confirmed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{resStats.statusCounts.REFUSED}</div>
                <div className="stat-label">Refused</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{resStats.statusCounts.CANCELED}</div>
                <div className="stat-label">Canceled</div>
              </div>
            </>
          )}
        </div>
      )}

      <section className="section">
        <div className="section-header">
          <h2>Events</h2>
          <a href="/admin/events/create" className="btn btn-primary">Create Event</a>
        </div>
        {events.length === 0 ? (
          <div className="empty-state">No events yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Status</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td>{new Date(e.dateTime).toLocaleString()}</td>
                  <td><span className={getBadgeClass(e.status)}>{e.status}</span></td>
                  <td>{e.remainingPlaces} / {e.capacity}</td>
                  <td>
                    <a href={`/admin/events/${e.id}`} className="btn btn-sm btn-outline">Edit</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Reservations</h2>
        </div>
        {reservations.length === 0 ? (
          <div className="empty-state">No reservations yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Participant</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td>{r.event?.title || 'N/A'}</td>
                  <td>{r.user?.name} ({r.user?.email})</td>
                  <td><span className={getBadgeClass(r.status)}>{r.status}</span></td>
                  <td>
                    <ReservationActions reservation={r} onUpdate={fetchData} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function ReservationActions({
  reservation,
  onUpdate,
}: {
  reservation: Reservation;
  onUpdate: () => void;
}) {
  const handleConfirm = async () => {
    try {
      await api.patch(`/reservations/${reservation.id}/confirm`);
      onUpdate();
    } catch {
      alert('Failed');
    }
  };

  const handleRefuse = async () => {
    try {
      await api.patch(`/reservations/${reservation.id}/refuse`);
      onUpdate();
    } catch {
      alert('Failed');
    }
  };

  const handleCancel = async () => {
    try {
      await api.patch(`/reservations/${reservation.id}/admin-cancel`);
      onUpdate();
    } catch {
      alert('Failed');
    }
  };

  return (
    <>
      {reservation.status === 'PENDING' && (
        <>
          <button className="btn btn-sm btn-primary" onClick={handleConfirm}>Confirm</button>
          <button className="btn btn-sm btn-secondary" onClick={handleRefuse}>Refuse</button>
        </>
      )}
      {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && (
        <button className="btn btn-sm btn-danger" onClick={handleCancel}>Cancel</button>
      )}
    </>
  );
}
