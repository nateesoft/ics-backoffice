import { Controller, Post, Body, Res, HttpCode, UseGuards, Get, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
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
  me(@Req() req: Request & { user: any }) {
    return req.user;
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
