import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument } from './entities/reservation.entity';
import { ReservationStatus } from './reservation-status.enum';
import { EventsService } from '../events/events.service';
import { EventStatus } from '../events/event-status.enum';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
    private eventsService: EventsService,
  ) {}

  async create(eventId: string, user: any): Promise<any> {
    const event = await this.eventsService.findOne(eventId);

    if (event.status !== EventStatus.PUBLISHED) {
      throw new ForbiddenException('Event is not available for reservation');
    }

    const userId = user._id || user.id;

    const existing = await this.reservationModel.findOne({
      event: eventId,
      user: userId,
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
    }).exec();

    if (existing) {
      throw new BadRequestException('You already have an active reservation for this event');
    }

    if (this.eventsService.getRemainingPlaces(event) < 1) {
      throw new BadRequestException('Event is fully booked');
    }

    const reservation = new this.reservationModel({
      user: userId,
      event: eventId,
      status: ReservationStatus.PENDING,
    });
    const saved = await reservation.save();
    return { id: saved._id.toString(), status: saved.status };
  }

  async findAllByUser(userId: string): Promise<any[]> {
    const reservations = await this.reservationModel
      .find({ user: userId })
      .populate('event')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return reservations.map((r) => ({
      ...r,
      id: r._id.toString(),
      event: r.event ? { ...(r.event as any), id: (r.event as any)._id?.toString() } : null,
    }));
  }

  async findAllAdmin(): Promise<any[]> {
    const reservations = await this.reservationModel
      .find()
      .populate('user', '-password')
      .populate('event')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return reservations.map((r) => ({
      ...r,
      id: r._id.toString(),
      user: r.user ? { ...(r.user as any), id: (r.user as any)._id?.toString() } : null,
      event: r.event ? { ...(r.event as any), id: (r.event as any)._id?.toString() } : null,
    }));
  }

  async findAllByEvent(eventId: string): Promise<any[]> {
    const reservations = await this.reservationModel
      .find({ event: eventId })
      .populate('user', '-password')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return reservations.map((r) => ({
      ...r,
      id: r._id.toString(),
      user: r.user ? { ...(r.user as any), id: (r.user as any)._id?.toString() } : null,
    }));
  }

  async findOne(id: string): Promise<any> {
    const reservation = await this.reservationModel
      .findById(id)
      .populate('user', '-password')
      .populate('event')
      .lean()
      .exec();
    if (!reservation) throw new NotFoundException('Reservation not found');
    return {
      ...reservation,
      id: reservation._id.toString(),
      user: reservation.user
        ? { ...(reservation.user as any), id: (reservation.user as any)._id?.toString() }
        : null,
      event: reservation.event
        ? { ...(reservation.event as any), id: (reservation.event as any)._id?.toString() }
        : null,
    };
  }

  async confirm(id: string): Promise<any> {
    const reservation = await this.findOne(id);
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('Only pending reservations can be confirmed');
    }

    const event = await this.eventsService.findOne(reservation.event.id);
    if (this.eventsService.getRemainingPlaces(event) < 1) {
      throw new BadRequestException('Event capacity reached');
    }

    const updated = await this.reservationModel
      .findByIdAndUpdate(id, { status: ReservationStatus.CONFIRMED }, { new: true })
      .lean()
      .exec();
    return { ...updated, id: updated!._id.toString(), status: ReservationStatus.CONFIRMED };
  }

  async refuse(id: string): Promise<any> {
    const reservation = await this.findOne(id);
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('Only pending reservations can be refused');
    }
    const updated = await this.reservationModel
      .findByIdAndUpdate(id, { status: ReservationStatus.REFUSED }, { new: true })
      .lean()
      .exec();
    return { ...updated, id: updated!._id.toString(), status: ReservationStatus.REFUSED };
  }

  async cancelByAdmin(id: string): Promise<any> {
    const reservation = await this.findOne(id);
    if (
      reservation.status === ReservationStatus.CANCELED ||
      reservation.status === ReservationStatus.REFUSED
    ) {
      throw new BadRequestException('Reservation already canceled or refused');
    }
    const updated = await this.reservationModel
      .findByIdAndUpdate(id, { status: ReservationStatus.CANCELED }, { new: true })
      .lean()
      .exec();
    return { ...updated, id: updated!._id.toString(), status: ReservationStatus.CANCELED };
  }

  async cancelByUser(id: string, userId: string): Promise<any> {
    const reservation = await this.findOne(id);
    if (reservation.user.id !== userId) {
      throw new ForbiddenException('Not your reservation');
    }
    if (
      reservation.status === ReservationStatus.CANCELED ||
      reservation.status === ReservationStatus.REFUSED
    ) {
      throw new BadRequestException('Reservation already canceled or refused');
    }
    const updated = await this.reservationModel
      .findByIdAndUpdate(id, { status: ReservationStatus.CANCELED }, { new: true })
      .lean()
      .exec();
    return { ...updated, id: updated!._id.toString(), status: ReservationStatus.CANCELED };
  }

  async generateTicketPdf(id: string, userId: string, isAdmin: boolean): Promise<Buffer> {
    const reservation = await this.findOne(id);

    if (!isAdmin && reservation.user.id !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new ForbiddenException('Ticket available only for confirmed reservations');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('Event Reservation Ticket', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Event: ${reservation.event.title}`);
      doc.text(`Date: ${new Date(reservation.event.dateTime).toLocaleString()}`);
      doc.text(`Location: ${reservation.event.location}`);
      doc.moveDown();
      doc.text(`Participant: ${reservation.user.name} (${reservation.user.email})`);
      doc.text(`Reservation ID: ${reservation.id}`);
      doc.text(`Status: ${reservation.status}`);
      doc.end();
    });
  }

  async getStats() {
    const reservations = await this.reservationModel.find().lean().exec();
    const statusCounts = {
      [ReservationStatus.PENDING]: 0,
      [ReservationStatus.CONFIRMED]: 0,
      [ReservationStatus.REFUSED]: 0,
      [ReservationStatus.CANCELED]: 0,
    };
    reservations.forEach((r) => {
      const s = r.status as ReservationStatus;
      if (s in statusCounts) statusCounts[s]++;
    });
    return { statusCounts, total: reservations.length };
  }
}
