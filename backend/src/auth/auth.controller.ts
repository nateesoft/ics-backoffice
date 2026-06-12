import { Controller, Post, Delete, Body, Res, HttpCode, UseGuards, Get, Req, Param, ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { Response, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { AuthService } from './auth.service';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { JwtAuthGuard } from './jwt-auth.guard';

class LoginDto {
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() password: string;
}

class ChangePasswordDto {
  @IsString() @IsNotEmpty() currentPassword: string;
  @IsString() @IsNotEmpty() @MinLength(4) newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto.username, dto.password);
    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request & { user: any }) {
    const user = await this.authService.getUserById(req.user.id);
    if (!user) throw new UnauthorizedException();
    return { id: user.id, username: user.username, avatarFilename: user.avatarFilename };
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'avatars'),
        filename: (req, file, cb) => {
          const userId = (req as any).user?.id ?? 'unknown';
          const timestamp = Date.now();
          cb(null, `${userId}_${timestamp}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 3 * 1024 * 1024 },
    }),
  )
  uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: Request & { user: any }) {
    return this.authService.uploadAvatar(req.user.id, file.filename);
  }

  @Delete('avatar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  removeAvatar(@Req() req: Request & { user: any }) {
    return this.authService.removeAvatar(req.user.id);
  }

  @Get('avatar/:userId')
  async getAvatar(@Param('userId', ParseIntPipe) userId: number, @Res() res: Response) {
    const user = await this.authService.getUserById(userId);
    if (!user?.avatarFilename) {
      res.status(404).send();
      return;
    }
    const ext = extname(user.avatarFilename).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    res.setHeader('Content-Type', mimeMap[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(join(process.cwd(), 'uploads', 'avatars', user.avatarFilename));
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: Request & { user: any }) {
    return this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }

  @Post('heartbeat')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  heartbeat(@Req() req: Request & { user: any }) {
    return this.authService.heartbeat(req.user.id);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  getUsers() {
    return this.authService.getUsers();
  }
}
