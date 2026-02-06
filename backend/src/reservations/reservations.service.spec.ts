import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation } from './entities/reservation.entity';
import { ReservationStatus } from './reservation-status.enum';
import { EventsService } from '../events/events.service';
import { EventStatus } from '../events/event-status.enum';
import { UserRole } from '../users/user-role.enum';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let reservationModel: any;
  let eventsService: Partial<Record<keyof EventsService, jest.Mock>>;

  const mockUser = {
    _id: 'u1',
    id: 'u1',
    email: 'user@test.com',
    name: 'User',
    role: UserRole.PARTICIPANT,
  };

  const mockEvent = {
    _id: 'e1',
    id: 'e1',
    title: 'Event',
    description: 'Desc',
    dateTime: new Date('2026-03-01'),
    location: 'Room',
    capacity: 10,
    status: EventStatus.PUBLISHED,
    reservations: [],
  };

  const mockReservation = {
    _id: 'r1',
    id: 'r1',
    status: ReservationStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    event: mockEvent,
  };

  beforeEach(async () => {
    reservationModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: 'r1', ...dto }),
    }));
    reservationModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    reservationModel.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      }),
    });
    reservationModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    });
    reservationModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'r1', status: ReservationStatus.CONFIRMED }),
      }),
    });

    eventsService = {
      findOne: jest.fn().mockResolvedValue(mockEvent),
      getRemainingPlaces: jest.fn().mockReturnValue(5),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: getModelToken(Reservation.name), useValue: reservationModel },
        { provide: EventsService, useValue: eventsService },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  describe('create', () => {
    it('should create a pending reservation', async () => {
      const result = await service.create('e1', mockUser as any);
      expect(result.status).toBe(ReservationStatus.PENDING);
    });

    it('should throw ForbiddenException if event not published', async () => {
      eventsService.findOne!.mockResolvedValue({ ...mockEvent, status: EventStatus.DRAFT });
      await expect(service.create('e1', mockUser as any)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if user has active reservation', async () => {
      reservationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReservation),
      });
      await expect(service.create('e1', mockUser as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if event fully booked', async () => {
      eventsService.getRemainingPlaces!.mockReturnValue(0);
      await expect(service.create('e1', mockUser as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateTicketPdf', () => {
    it('should throw ForbiddenException if reservation not confirmed', async () => {
      reservationModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue({
                ...mockReservation,
                _id: 'r1',
                status: ReservationStatus.PENDING,
              }),
            }),
          }),
        }),
      });
      await expect(service.generateTicketPdf('r1', 'u1', false)).rejects.toThrow(ForbiddenException);
    });
  });
});
