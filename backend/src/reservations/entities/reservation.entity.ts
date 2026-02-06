import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReservationStatus } from '../reservation-status.enum';

export type ReservationDocument = Reservation & Document;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ type: String, enum: ReservationStatus, default: ReservationStatus.PENDING })
  status: ReservationStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  event: Types.ObjectId;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
