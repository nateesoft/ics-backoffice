// A trimmed retarget of backend/src/auth/ (cookie-first JWT extraction, bcrypt.compare, the
// OnModuleInit auto-seed precedent) — same shape, but scoped to sitemap Actors instead of ICS
// Backoffice operators, seeded from the baked SEED.actors instead of a hardcoded admin/admin, and
// with one new endpoint (`GET /auth/verify`) that Preview never had: a real server-side
// allow/deny check the generated frontend's middleware.ts calls before serving a protected route.

export function renderActorEntityTs(): string {
  return `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('actors')
export class Actor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The sitemap's own xyflow node id — how the baked ACCESS_MAP/frontend route manifest refer to
  // this actor, independent of this table's own generated id.
  @Column({ unique: true })
  actorNodeId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;
}
`;
}

export function renderActorAuthModuleTs(): string {
  return `import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Actor } from './actor.entity';
import { ActorAuthController } from './actor-auth.controller';
import { ActorAuthService } from './actor-auth.service';
import { ActorJwtStrategy } from './actor-jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Actor]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ActorAuthController],
  providers: [ActorAuthService, ActorJwtStrategy],
  exports: [ActorAuthService],
})
export class ActorAuthModule {}
`;
}

export function renderActorJwtStrategyTs(): string {
  return `import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ActorJwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.get<string>('JWT_SECRET', 'default-secret'),
    });
  }

  validate(payload: { sub: string; actorNodeId: string; username: string }) {
    return payload;
  }
}
`;
}

export function renderActorJwtAuthGuardTs(): string {
  return `import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ActorJwtAuthGuard extends AuthGuard('jwt') {}
`;
}

export function renderActorAuthServiceTs(): string {
  return `import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Actor } from './actor.entity';
import { SEED } from '../seed';

@Injectable()
export class ActorAuthService implements OnModuleInit {
  constructor(
    @InjectRepository(Actor) private actorRepo: Repository<Actor>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const existing = await this.actorRepo.count();
    if (existing > 0) return;
    for (const a of SEED.actors) {
      await this.actorRepo.save({ actorNodeId: a.actorNodeId, name: a.name, username: a.username, passwordHash: a.passwordHash });
    }
  }

  async login(username: string, password: string) {
    const actor = await this.actorRepo.findOne({ where: { username }, select: { id: true, actorNodeId: true, name: true, username: true, passwordHash: true } });
    if (!actor) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, actor.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const token = this.jwtService.sign({ sub: actor.id, actorNodeId: actor.actorNodeId, username: actor.username });
    return { token, actor: { id: actor.id, actorNodeId: actor.actorNodeId, name: actor.name, username: actor.username } };
  }

  async getById(id: string) {
    return this.actorRepo.findOne({ where: { id } });
  }

  // Real server-side enforcement Preview never had: a page/content node with no actor edges is
  // public; otherwise the token's actor must be one of the node's granting actors.
  async verifyAccess(nodeId: string, token: string | undefined): Promise<{ allowed: boolean; actor: { id: string; actorNodeId: string; name: string; username: string } | null }> {
    const entry = SEED.accessMap.find(a => a.nodeId === nodeId);
    const allowedActorNodeIds: readonly string[] = entry?.allowedActorNodeIds ?? [];

    let actor: { id: string; actorNodeId: string; name: string; username: string } | null = null;
    if (token) {
      try {
        const payload = this.jwtService.verify(token) as { sub: string; actorNodeId: string; username: string };
        const row = await this.getById(payload.sub);
        if (row) actor = { id: row.id, actorNodeId: row.actorNodeId, name: row.name, username: row.username };
      } catch {
        actor = null;
      }
    }

    if (allowedActorNodeIds.length === 0) return { allowed: true, actor };
    return { allowed: Boolean(actor && allowedActorNodeIds.includes(actor.actorNodeId)), actor };
  }
}
`;
}

export function renderActorAuthControllerTs(): string {
  return `import { Controller, Post, Get, Body, Query, Res, Req, HttpCode, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Response, Request } from 'express';
import { IsString, IsNotEmpty } from 'class-validator';
import { ActorAuthService } from './actor-auth.service';
import { ActorJwtAuthGuard } from './actor-jwt-auth.guard';

class LoginDto {
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() password: string;
}

@Controller('auth')
export class ActorAuthController {
  constructor(private authService: ActorAuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto.username, dto.password);
    res.cookie('token', result.token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return { actor: result.actor };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(ActorJwtAuthGuard)
  async me(@Req() req: Request & { user: { sub: string } }) {
    const actor = await this.authService.getById(req.user.sub);
    if (!actor) throw new UnauthorizedException();
    return { id: actor.id, actorNodeId: actor.actorNodeId, name: actor.name, username: actor.username };
  }

  // Unguarded on purpose: a denied request should get a normal {allowed:false} response, not a
  // 401 thrown by a guard — the generated frontend's middleware.ts is the thing that turns
  // "allowed:false" into a redirect to /login.
  @Get('verify')
  verify(@Query('nodeId') nodeId: string, @Req() req: Request) {
    return this.authService.verifyAccess(nodeId, req.cookies?.token);
  }
}
`;
}
