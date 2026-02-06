import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './entities/event.entity';
import { EventStatus } from './event-status.enum';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Reservation, ReservationDocument } from '../reservations/entities/reservation.entity';
import { ReservationStatus } from '../reservations/reservation-status.enum';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
  ) {}

  async create(dto: CreateEventDto, user: any): Promise<EventDocument> {
    const event = new this.eventModel({
      ...dto,
      dateTime: new Date(dto.dateTime),
      status: EventStatus.DRAFT,
      createdBy: user._id || user.id,
    });
    return event.save();
  }

  async findAllPublished(): Promise<any[]> {
    const events = await this.eventModel
      .find({ status: EventStatus.PUBLISHED })
      .sort({ dateTime: 1 })
      .lean()
      .exec();

    const results = [];
    for (const event of events) {
      const reservations = await this.reservationModel
        .find({ event: event._id, status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] } })
        .lean()
        .exec();
      results.push({
        ...event,
        id: event._id.toString(),
        reservations,
      });
    }
    return results;
  }

  async findAllAdmin(): Promise<any[]> {
    const events = await this.eventModel
      .find()
      .sort({ dateTime: 1 })
      .populate('createdBy', '-password')
      .lean()
      .exec();

    const results = [];
    for (const event of events) {
      const reservations = await this.reservationModel
        .find({ event: event._id })
        .lean()
        .exec();
      results.push({
        ...event,
        id: event._id.toString(),
        reservations,
      });
    }
    return results;
  }

  async findOne(id: string): Promise<any> {
    const event = await this.eventModel
      .findById(id)
      .populate('createdBy', '-password')
      .lean()
      .exec();
    if (!event) throw new NotFoundException('Event not found');

    const reservations = await this.reservationModel
      .find({ event: event._id })
      .lean()
      .exec();

    return { ...event, id: event._id.toString(), reservations };
  }

  async findOnePublished(id: string): Promise<any> {
    const event = await this.findOne(id);
    if (event.status !== EventStatus.PUBLISHED) {
      throw new ForbiddenException('Event is not available');
    }
    return event;
  }

  async update(id: string, dto: UpdateEventDto): Promise<any> {
    const event = await this.findOne(id);
    if (dto.status === EventStatus.PUBLISHED && event.status === EventStatus.CANCELED) {
      throw new BadRequestException('Cannot publish a canceled event');
    }
    const updateData: any = { ...dto };
    if (dto.dateTime) {
      updateData.dateTime = new Date(dto.dateTime);
    }
    const updated = await this.eventModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean()
      .exec();
    return { ...updated, id: updated!._id.toString() };
  }

  async cancel(id: string): Promise<any> {
    await this.findOne(id);
    const updated = await this.eventModel
      .findByIdAndUpdate(id, { status: EventStatus.CANCELED }, { new: true })
      .lean()
      .exec();
    return { ...updated, id: updated!._id.toString() };
  }

  getRemainingPlaces(event: any): number {
    const active =
      event.reservations?.filter(
        (r: any) =>
          r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.PENDING,
      ).length || 0;
    return Math.max(0, event.capacity - active);
  }

  async getStats() {
    const events = await this.eventModel.find().lean().exec();
    const now = new Date();
    const results = [];
    for (const event of events) {
      const reservations = await this.reservationModel
        .find({ event: event._id })
        .lean()
        .exec();
      results.push({ ...event, reservations });
    }

    const upcoming = results.filter(
      (e) => e.status === EventStatus.PUBLISHED && new Date(e.dateTime) > now,
    );
    const totalCapacity = upcoming.reduce((sum, e) => sum + e.capacity, 0);
    const totalReserved = upcoming.reduce(
      (sum, e) =>
        sum +
        (e.reservations?.filter(
          (r: any) =>
            r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.PENDING,
        ).length || 0),
      0,
    );
    const fillRate = totalCapacity > 0 ? Math.round((totalReserved / totalCapacity) * 100) : 0;

    return {
      upcomingCount: upcoming.length,
      fillRate,
    };
  }
}
