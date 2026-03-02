import { Controller, Get, Param, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AlertsService } from './alerts.service';
import type { AuthenticatedRequest } from '../auth/types';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('session/:sessionId')
  getBySession(
    @Param('sessionId') sessionId: string,
    @Request() _req: AuthenticatedRequest,
  ) {
    return this.alertsService.getAlertsForSession(sessionId);
  }

  @Patch(':id/acknowledge')
  acknowledge(
    @Param('id') id: string,
    @Body() body: { contactId: string },
  ) {
    return this.alertsService.acknowledge(id, body.contactId);
  }
}
