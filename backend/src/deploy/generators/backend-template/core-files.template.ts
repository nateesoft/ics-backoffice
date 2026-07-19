// Plain template-string functions, not a separate templating engine — type-checked at the main
// app's own build time and requires no asset-copy configuration (see copy-with-transform.util.ts
// for why the *reused* files are copied instead of templated).

export function renderMainTs(): string {
  return `import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({ origin: true, credentials: true });
  await app.listen(process.env.PORT || 3001);
}
bootstrap();
`;
}

export function renderCollectionsModuleTs(): string {
  return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicApiController } from './public-api.controller';
import { CollectionsService } from './collections.service';
import { Collection } from './entities/collection.entity';
import { RecordEntity } from './entities/record.entity';

// Trimmed from the source CollectionsModule: the JWT-guarded admin CRUD controller isn't needed —
// a deployed app's collections/records are seeded once from the deploy manifest, not managed live.
@Module({
  imports: [TypeOrmModule.forFeature([Collection, RecordEntity])],
  controllers: [PublicApiController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
`;
}

export function renderCustomEndpointsModuleTs(): string {
  return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsModule } from '../collections/collections.module';
import { CustomEndpoint } from './entities/custom-endpoint.entity';
import { CustomEndpointsExecutorController } from './custom-endpoints-executor.controller';
import { CustomEndpointsService } from './custom-endpoints.service';

// Trimmed from the source CustomEndpointsModule: same reasoning as CollectionsModule above — the
// admin CRUD controller for defining endpoints isn't needed, only the real execution engine.
@Module({
  imports: [TypeOrmModule.forFeature([CustomEndpoint]), CollectionsModule],
  controllers: [CustomEndpointsExecutorController],
  providers: [CustomEndpointsService],
  exports: [CustomEndpointsService],
})
export class CustomEndpointsModule {}
`;
}

export function renderAppModuleTs(): string {
  return `import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from './collections/entities/collection.entity';
import { RecordEntity } from './collections/entities/record.entity';
import { CustomEndpoint } from './custom-endpoints/entities/custom-endpoint.entity';
import { Actor } from './actor-auth/actor.entity';
import { CollectionsModule } from './collections/collections.module';
import { CustomEndpointsModule } from './custom-endpoints/custom-endpoints.module';
import { ActorAuthModule } from './actor-auth/actor-auth.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [Collection, RecordEntity, CustomEndpoint, Actor],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    CollectionsModule,
    CustomEndpointsModule,
    ActorAuthModule,
    SeedModule,
  ],
})
export class AppModule {}
`;
}

export function renderPackageJson(name: string): string {
  const pkg = {
    name,
    version: '0.0.1',
    private: true,
    scripts: {
      build: 'nest build',
      'start:prod': 'node dist/main',
    },
    dependencies: {
      '@nestjs/common': '^11.0.1',
      '@nestjs/config': '^4.0.4',
      '@nestjs/core': '^11.0.1',
      '@nestjs/jwt': '^11.0.2',
      '@nestjs/passport': '^11.0.5',
      '@nestjs/platform-express': '^11.0.1',
      '@nestjs/typeorm': '^11.0.1',
      'bcryptjs': '^3.0.3',
      'class-transformer': '^0.5.1',
      'class-validator': '^0.15.1',
      'cookie-parser': '^1.4.7',
      'jexl': '^2.3.0',
      'passport': '^0.7.0',
      'passport-jwt': '^4.0.1',
      'pg': '^8.21.0',
      'reflect-metadata': '^0.2.2',
      'rxjs': '^7.8.1',
      'typeorm': '^1.0.0',
    },
    devDependencies: {
      '@nestjs/cli': '^11.0.0',
      '@types/node': '^20',
      'typescript': '^5.7.3',
    },
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}

export function renderTsconfigJson(): string {
  return JSON.stringify({
    compilerOptions: {
      module: 'nodenext',
      moduleResolution: 'nodenext',
      declaration: false,
      removeComments: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      allowSyntheticDefaultImports: true,
      target: 'ES2023',
      sourceMap: false,
      outDir: './dist',
      rootDir: './src',
      baseUrl: './',
      strictNullChecks: true,
      noImplicitAny: false,
      strictBindCallApply: false,
      skipLibCheck: true,
    },
  }, null, 2) + '\n';
}

export function renderTsconfigBuildJson(): string {
  return JSON.stringify({ extends: './tsconfig.json', exclude: ['node_modules', 'dist'] }, null, 2) + '\n';
}

export function renderNestCliJson(): string {
  return JSON.stringify({
    $schema: 'https://json.schemastore.org/nest-cli',
    collection: '@nestjs/schematics',
    sourceRoot: 'src',
    compilerOptions: { deleteOutDir: true },
  }, null, 2) + '\n';
}

export function renderEnv(opts: { jwtSecret: string; dbHost: string; dbUser: string; dbPassword: string; dbName: string; port: number }): string {
  return `DATABASE_URL=postgresql://${opts.dbUser}:${opts.dbPassword}@${opts.dbHost}:5432/${opts.dbName}
JWT_SECRET=${opts.jwtSecret}
JWT_EXPIRES_IN=7d
PORT=${opts.port}
`;
}
