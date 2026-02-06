import { IsNotEmpty, IsDateString, IsInt, Min } from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsDateString()
  dateTime: string;

  @IsNotEmpty()
  location: string;

  @IsInt()
  @Min(1)
  capacity: number;
}
