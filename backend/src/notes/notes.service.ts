import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from '../entities/note.entity';
import { NoteReaction } from '../entities/note-reaction.entity';
import { NoteReply } from '../entities/note-reply.entity';
import { CreateNoteDto, UpdateNoteDto, CreateReplyDto } from './notes.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private repo: Repository<Note>,
    @InjectRepository(NoteReaction) private reactionRepo: Repository<NoteReaction>,
    @InjectRepository(NoteReply) private replyRepo: Repository<NoteReply>,
  ) {}

  async findAll() {
    const notes = await this.repo.find({ order: { order: 'ASC', id: 'DESC' } });
    const noteIds = notes.map(n => n.id);
    if (noteIds.length === 0) return [];

    const reactions = await this.reactionRepo
      .createQueryBuilder('r')
      .where('r.noteId IN (:...ids)', { ids: noteIds })
      .getMany();

    const replyCounts = await this.replyRepo
      .createQueryBuilder('r')
      .select('r.noteId', 'noteId')
      .addSelect('COUNT(*)', 'count')
      .where('r.noteId IN (:...ids)', { ids: noteIds })
      .groupBy('r.noteId')
      .getRawMany<{ noteId: number; count: string }>();

    const replyCountMap = new Map(replyCounts.map(r => [Number(r.noteId), Number(r.count)]));

    return notes.map(note => ({
      ...note,
      reactions: reactions.filter(r => r.noteId === note.id),
      replyCount: replyCountMap.get(note.id) ?? 0,
    }));
  }

  async create(dto: CreateNoteDto, createdBy: string) {
    const minResult = await this.repo
      .createQueryBuilder('note')
      .select('MIN(note.order)', 'min')
      .getRawOne<{ min: number | null }>();
    const minOrder = minResult?.min ?? 0;

    const note = await this.repo.save({
      content: dto.content ?? '',
      color: dto.color ?? 'yellow',
      order: minOrder - 1,
      createdBy,
    });
    return { ...note, reactions: [], replyCount: 0 };
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
    await this.reactionRepo.delete({ noteId: id });
    await this.replyRepo.delete({ noteId: id });
    await this.repo.delete(id);
  }

  async reorder(ids: number[]) {
    await Promise.all(
      ids.map((id, index) => this.repo.update(id, { order: index })),
    );
  }

  // ─── Reactions ────────────────────────────────────────────────────────────
  async toggleReaction(noteId: number, emoji: string, username: string) {
    const existing = await this.reactionRepo.findOne({
      where: { noteId, emoji, createdBy: username },
    });
    if (existing) {
      await this.reactionRepo.delete(existing.id);
    } else {
      await this.reactionRepo.save({ noteId, emoji, createdBy: username });
    }
    return this.reactionRepo.find({ where: { noteId } });
  }

  // ─── Replies ──────────────────────────────────────────────────────────────
  getReplies(noteId: number) {
    return this.replyRepo.find({
      where: { noteId },
      order: { createdAt: 'ASC' },
    });
  }

  async addReply(noteId: number, dto: CreateReplyDto, createdBy: string) {
    const note = await this.repo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException();
    return this.replyRepo.save({ noteId, content: dto.content, createdBy });
  }

  async deleteReply(noteId: number, replyId: number, username: string) {
    const reply = await this.replyRepo.findOne({ where: { id: replyId, noteId } });
    if (!reply) throw new NotFoundException();
    await this.replyRepo.delete(replyId);
  }
}
