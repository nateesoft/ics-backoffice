import { Injectable, UnauthorizedException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    mkdirSync(join(process.cwd(), 'uploads', 'avatars'), { recursive: true });
    const exists = await this.userRepo.findOne({ where: { username: 'admin' } });
    if (!exists) {
      const hashed = await bcrypt.hash('admin', 10);
      await this.userRepo.save({ username: 'admin', password: hashed });
    }
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
  }

  async login(username: string, password: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const token = this.jwtService.sign({ sub: user.id, username: user.username });
    return { token, user: { id: user.id, username: user.username, role: user.role, avatarFilename: user.avatarFilename } };
  }

  async getUserById(userId: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async uploadAvatar(userId: number, newFilename: string): Promise<{ avatarFilename: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user?.avatarFilename) {
      const oldPath = join(process.cwd(), 'uploads', 'avatars', user.avatarFilename);
      if (existsSync(oldPath)) unlinkSync(oldPath);
    }
    await this.userRepo.update(userId, { avatarFilename: newFilename });
    return { avatarFilename: newFilename };
  }

  async removeAvatar(userId: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user?.avatarFilename) {
      const oldPath = join(process.cwd(), 'uploads', 'avatars', user.avatarFilename);
      if (existsSync(oldPath)) unlinkSync(oldPath);
    }
    await this.userRepo.update(userId, { avatarFilename: null });
  }

  async heartbeat(userId: number) {
    await this.userRepo.update(userId, { lastSeenAt: new Date() });
  }

  async getUsers() {
    const users = await this.userRepo.find({ where: {} });
    const onlineThreshold = new Date(Date.now() - 3 * 60 * 1000);
    return users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      isOnline: u.lastSeenAt != null && u.lastSeenAt > onlineThreshold,
      avatarFilename: u.avatarFilename,
    }));
  }
}
