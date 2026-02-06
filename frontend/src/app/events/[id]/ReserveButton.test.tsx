/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReserveButton from '@/app/events/[id]/ReserveButton';
import { AuthProvider } from '@/context/AuthContext';
import api from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn((key) => {
    if (key === 'token') return 'fake-token';
    if (key === 'user') return JSON.stringify({ id: 'u1', email: 'test@test.com', name: 'Test', role: 'PARTICIPANT' });
    return undefined;
  }),
  set: jest.fn(),
  remove: jest.fn(),
}));

describe('ReserveButton - Reservation Flow', () => {
  it('shows Reserve button when user is logged in', () => {
    render(
      <AuthProvider>
        <ReserveButton eventId="e1" />
      </AuthProvider>
    );
    expect(screen.getByRole('button', { name: /Reserve/i })).toBeInTheDocument();
  });

  it('shows success message on successful reservation', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { id: 'r1', status: 'PENDING' } });

    render(
      <AuthProvider>
        <ReserveButton eventId="e1" />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Reserve/i }));

    await waitFor(() => {
      expect(screen.getByText(/Reservation created successfully!/i)).toBeInTheDocument();
    });
  });

  it('shows error message on failed reservation', async () => {
    mockedApi.post.mockRejectedValueOnce({
      response: { data: { message: 'Event is fully booked' } },
    });

    render(
      <AuthProvider>
        <ReserveButton eventId="e1" />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Reserve/i }));

    await waitFor(() => {
      expect(screen.getByText(/Event is fully booked/i)).toBeInTheDocument();
    });
  });
});
