'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { Reservation } from '@/types';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'badge badge-confirmed';
      case 'PENDING':
        return 'badge badge-pending';
      case 'REFUSED':
        return 'badge badge-refused';
      case 'CANCELED':
        return 'badge badge-canceled';
      default:
        return 'badge';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <p>Loading your reservations...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>My Reservations</h1>
      {reservations.length === 0 ? (
        <div className="text-center">
          <p>You have no reservations yet.</p>
          <p className="text-gray-600">Browse events to make your first reservation!</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.event?.title || 'N/A'}</strong>
                    {r.event?.location && (
                      <div className="card-meta">
                        {r.event.location}
                      </div>
                    )}
                  </td>
                  <td>
                    {r.event?.dateTime ? new Date(r.event.dateTime).toLocaleString() : 'N/A'}
                  </td>
                  <td>
                    <span className={getStatusColor(r.status)}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {r.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleDownloadTicket(r.id)}
                          className="btn btn-secondary"
                        >
                          Download Ticket
                        </button>
                      )}
                      {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                        <button
                          onClick={() => handleCancel(r.id)}
                          className="btn btn-outline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
