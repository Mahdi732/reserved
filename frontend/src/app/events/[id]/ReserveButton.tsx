'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Props {
  eventId: string;
}

export default function ReserveButton({ eventId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  const handleReserve = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    setLoading(true);
    setMessage('');
    setMessageType(null);
    
    try {
      await api.post('/reservations', { eventId });
      setMessage('Reservation created successfully! It is pending admin approval.');
      setMessageType('success');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Reservation failed. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button onClick={handleReserve} disabled={loading} className="btn btn-primary">
        {loading ? 'Reserving...' : 'Reserve Your Spot'}
      </button>
      {message && (
        <p className={`mt-2 ${messageType === 'success' ? 'success' : 'error'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
