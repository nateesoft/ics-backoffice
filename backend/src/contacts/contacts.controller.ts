import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './contacts.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contacts')
export class ContactsController {
  constructor(private svc: ContactsService) {}

  // Public — the marketing site contact form posts here
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.svc.create(dto);
  }

  // Protected — back office can review submissions
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.svc.findAll();
  }
}
