import { IsEnum } from 'class-validator';
import { ReservationStatus } from '../reservation-status.enum';

export class UpdateReservationDto {
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}
