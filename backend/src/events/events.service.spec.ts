import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { EventStatus } from './event-status.enum';
import { UserRole } from '../users/user-role.enum';

describe('EventsService', () => {
  let service: EventsService;
  let eventModel: any;
  let reservationModel: any;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'admin@test.com',
    name: 'Admin',
    password: 'hashed',
    role: UserRole.ADMIN,
  };

  const mockEvent = {
    _id: '507f1f77bcf86cd799439012',
    title: 'Test Event',
    description: 'Desc',
    dateTime: new Date('2026-03-01T10:00:00Z'),
    location: 'Room A',
    capacity: 10,
    status: EventStatus.DRAFT,
    createdBy: mockUser._id,
    reservations: [],
  };

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockLean = jest.fn().mockReturnValue({ exec: mockExec });
    const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
    const mockSort = jest.fn().mockReturnValue({ populate: mockPopulate, lean: mockLean });
    const mockFind = jest.fn().mockReturnValue({ sort: mockSort, lean: mockLean });
    const mockFindById = jest.fn().mockReturnValue({ populate: mockPopulate });
    const mockFindByIdAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn() }) });

    eventModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...mockEvent, ...dto }),
    }));
    eventModel.find = mockFind;
    eventModel.findById = mockFindById;
    eventModel.findByIdAndUpdate = mockFindByIdAndUpdate;

    reservationModel = {
      find: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getModelToken(Event.name), useValue: eventModel },
        { provide: getModelToken(Reservation.name), useValue: reservationModel },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  describe('create', () => {
    it('should create an event with DRAFT status', async () => {
      const dto = {
        title: 'New Event',
        description: 'Desc',
        dateTime: '2026-04-01T10:00:00Z',
        location: 'Room B',
        capacity: 20,
      };
      const result = await service.create(dto, mockUser);
      expect(result.status).toBe(EventStatus.DRAFT);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      eventModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRemainingPlaces', () => {
    it('should calculate remaining places correctly', () => {
      const eventWithReservations = {
        ...mockEvent,
        capacity: 10,
        reservations: [
          { status: 'CONFIRMED' },
          { status: 'PENDING' },
          { status: 'CANCELED' },
        ],
      };
      const remaining = service.getRemainingPlaces(eventWithReservations);
      expect(remaining).toBe(8);
    });
  });
});
