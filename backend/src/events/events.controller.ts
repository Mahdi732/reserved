import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  // Public: list published events
  @Get()
  async findPublished() {
    const events = await this.eventsService.findAllPublished();
    return events.map((e) => ({
      ...e,
      remainingPlaces: this.eventsService.getRemainingPlaces(e),
    }));
  }

  // Public: get event details
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const event = await this.eventsService.findOnePublished(id);
    return { ...event, remainingPlaces: this.eventsService.getRemainingPlaces(event) };
  }

  // Admin: list all events
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/all')
  async findAllAdmin() {
    const events = await this.eventsService.findAllAdmin();
    return events.map((e) => ({
      ...e,
      remainingPlaces: this.eventsService.getRemainingPlaces(e),
    }));
  }

  // Admin: create event
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateEventDto, @Request() req: any) {
    return this.eventsService.create(dto, req.user);
  }

  // Admin: update event
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  // Admin: cancel event
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async cancel(@Param('id') id: string) {
    return this.eventsService.cancel(id);
  }

  // Admin: stats
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/stats')
  async stats() {
    return this.eventsService.getStats();
  }
}
