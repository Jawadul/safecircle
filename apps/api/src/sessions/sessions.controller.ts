import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import type {
  StartCheckInDto,
  StartSafeRideDto,
  StartWalkAloneDto,
  StartSOSDto,
} from '@safecircle/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import type { AuthenticatedRequest } from '../auth/types';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post('checkin')
  startCheckIn(@Request() req: AuthenticatedRequest, @Body() dto: StartCheckInDto) {
    return this.sessions.startCheckIn(req.user.sub, dto);
  }

  @Post('saferide')
  startSafeRide(@Request() req: AuthenticatedRequest, @Body() dto: StartSafeRideDto) {
    return this.sessions.startSafeRide(req.user.sub, dto);
  }

  @Post('walkalone')
  startWalkAlone(@Request() req: AuthenticatedRequest, @Body() dto: StartWalkAloneDto) {
    return this.sessions.startWalkAlone(req.user.sub, dto);
  }

  @Post('sos')
  @HttpCode(HttpStatus.CREATED)
  startSOS(@Request() req: AuthenticatedRequest, @Body() dto: StartSOSDto) {
    return this.sessions.startSOS(req.user.sub, dto);
  }

  @Get(':id')
  getSession(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.sessions.findOneForUser(id, req.user.sub);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  endSession(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.sessions.endSession(id, req.user.sub);
  }
}
