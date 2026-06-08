import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from '../entities/note.entity';
import { CreateNoteDto, UpdateNoteDto } from './notes.dto';

@Injectable()
export class NotesService {
  constructor(@InjectRepository(Note) private repo: Repository<Note>) {}

  findAll() {
    return this.repo.find({ order: { order: 'ASC', id: 'DESC' } });
  }

  async create(dto: CreateNoteDto, createdBy: string) {
    // New note goes to the front (min order - 1)
    const minResult = await this.repo
      .createQueryBuilder('note')
      .select('MIN(note.order)', 'min')
      .getRawOne<{ min: number | null }>();
    const minOrder = minResult?.min ?? 0;

    return this.repo.save({
      content: dto.content ?? '',
      color: dto.color ?? 'yellow',
      order: minOrder - 1,
      createdBy,
    });
  }

  async update(id: number, dto: UpdateNoteDto) {
    const note = await this.repo.findOne({ where: { id } });
    if (!note) throw new NotFoundException();
    Object.assign(note, dto);
    return this.repo.save(note);
  }

  async remove(id: number) {
    const note = await this.repo.findOne({ where: { id } });
    if (!note) throw new NotFoundException();
    await this.repo.delete(id);
  }

  async reorder(ids: number[]) {
    await Promise.all(
      ids.map((id, index) => this.repo.update(id, { order: index })),
    );
  }
}
