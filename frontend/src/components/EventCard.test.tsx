import { render, screen } from '@testing-library/react';
import EventCard from '@/components/EventCard';

describe('EventCard', () => {
  const mockEvent = {
    id: 'e1',
    title: 'Test Event',
    description: 'Test description',
    dateTime: '2026-03-15T14:00:00Z',
    location: 'Test Location',
    capacity: 50,
    status: 'PUBLISHED' as const,
    remainingPlaces: 30,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('renders event title', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  it('renders event description', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders location', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(/Test Location/)).toBeInTheDocument();
  });

  it('renders remaining places', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(/30 \/ 50/)).toBeInTheDocument();
  });

  it('renders view details link', () => {
    render(<EventCard event={mockEvent} />);
    const link = screen.getByRole('link', { name: /View Details/i });
    expect(link).toHaveAttribute('href', '/events/e1');
  });
});
