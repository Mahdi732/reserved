import { IsOptional, IsDateString, IsInt, Min, IsEnum } from 'class-validator';
import { EventStatus } from '../event-status.enum';

export class UpdateEventDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsDateString()
  dateTime?: string;

  @IsOptional()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
