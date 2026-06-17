import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { Note } from '../entities/note.entity';
import { NoteReaction } from '../entities/note-reaction.entity';
import { NoteReply } from '../entities/note-reply.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Note, NoteReaction, NoteReply])],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
