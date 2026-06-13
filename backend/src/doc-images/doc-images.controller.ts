import {
  Controller, Post, Get, Param, UseGuards, UseInterceptors,
  UploadedFile, Res, NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('doc-images')
export class DocImagesController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads'),
      filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only image files are allowed'), false);
    },
  }))
  upload(@UploadedFile() file: Express.Multer.File) {
    return { filename: file.filename };
  }

  @Get(':filename')
  serveImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) throw new NotFoundException();
    res.sendFile(filePath);
  }
}
