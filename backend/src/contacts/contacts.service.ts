import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { CreateContactDto } from './contacts.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact) private repo: Repository<Contact>,
  ) {}

  create(dto: CreateContactDto) {
    return this.repo.save({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone?.trim() || null,
      company: dto.company?.trim() || null,
      service: dto.service?.trim() || null,
      message: dto.message.trim(),
    });
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
