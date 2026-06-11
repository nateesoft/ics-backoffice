import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentReactionsController } from './comment-reactions.controller';
import { CommentReactionsService } from './comment-reactions.service';
import { CommentReaction } from '../entities/comment-reaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommentReaction])],
  controllers: [CommentReactionsController],
  providers: [CommentReactionsService],
})
export class CommentReactionsModule {}
