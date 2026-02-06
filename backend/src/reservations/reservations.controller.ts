import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';

@Controller('reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  // Participant: create reservation
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateReservationDto, @Request() req: any) {
    return this.reservationsService.create(dto.eventId, req.user);
  }

  // Participant: list own reservations
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMine(@Request() req: any) {
    return this.reservationsService.findAllByUser(req.user.id);
  }

  // Admin: list all reservations
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/all')
  async findAllAdmin() {
    return this.reservationsService.findAllAdmin();
  }

  // Admin: list reservations by event
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/event/:eventId')
  async findByEvent(@Param('eventId') eventId: string) {
    return this.reservationsService.findAllByEvent(eventId);
  }

  // Admin: confirm reservation
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.reservationsService.confirm(id);
  }

  // Admin: refuse reservation
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/refuse')
  async refuse(@Param('id') id: string) {
    return this.reservationsService.refuse(id);
  }

  // Admin: cancel any reservation
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/admin-cancel')
  async adminCancel(@Param('id') id: string) {
    return this.reservationsService.cancelByAdmin(id);
  }

  // Participant: cancel own reservation
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  async userCancel(@Param('id') id: string, @Request() req: any) {
    return this.reservationsService.cancelByUser(id, req.user.id);
  }

  // Download ticket PDF (confirmed only)
  @UseGuards(JwtAuthGuard)
  @Get(':id/ticket')
  async downloadTicket(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    const buffer = await this.reservationsService.generateTicketPdf(id, req.user.id, isAdmin);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // Admin: stats
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/stats')
  async stats() {
    return this.reservationsService.getStats();
  }
}
