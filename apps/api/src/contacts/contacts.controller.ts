import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import type { AddContactDto, UpdateContactDto } from '@safecircle/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContactsService } from './contacts.service';
import type { AuthenticatedRequest } from '../auth/types';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  list(@Request() req: AuthenticatedRequest) {
    return this.contacts.listContacts(req.user.sub);
  }

  @Post()
  add(@Request() req: AuthenticatedRequest, @Body() dto: AddContactDto) {
    return this.contacts.addContact(req.user.sub, dto);
  }

  @Patch(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contacts.updateContact(req.user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.contacts.removeContact(req.user.sub, id);
  }

  @Post('invite/:token/accept')
  @HttpCode(HttpStatus.OK)
  acceptInvite(
    @Param('token') token: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.contacts.acceptInvite(token, req.user.sub);
  }
}
