import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentFolder } from '../entities/document-folder.entity';
import { CreateDocFolderDto, UpdateDocFolderDto } from './document-folders.dto';

@Injectable()
export class DocumentFoldersService {
  constructor(
    @InjectRepository(DocumentFolder) private repo: Repository<DocumentFolder>,
  ) {}

  findAll() {
    return this.repo.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async create(dto: CreateDocFolderDto) {
    const maxResult = await this.repo
      .createQueryBuilder('f')
      .select('MAX(f.sortOrder)', 'max')
      .getRawOne<{ max: number | null }>();
    const nextOrder = (maxResult?.max ?? -1) + 1;
    return this.repo.save({ name: dto.name, sortOrder: nextOrder });
  }

  async update(id: number, dto: UpdateDocFolderDto) {
    const folder = await this.repo.findOne({ where: { id } });
    if (!folder) throw new NotFoundException();
    Object.assign(folder, dto);
    return this.repo.save(folder);
  }

  async remove(id: number) {
    const folder = await this.repo.findOne({ where: { id } });
    if (!folder) throw new NotFoundException();
    await this.repo.delete(id);
  }
}
