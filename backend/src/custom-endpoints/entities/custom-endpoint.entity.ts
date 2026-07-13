import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Collection } from '../../collections/entities/collection.entity';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type CustomEndpointAction =
  'list' | 'get' | 'create' | 'update' | 'delete';
export type CustomEndpointAuthType = 'none' | 'basic' | 'bearer';

export interface InputMappingRule {
  requestField: string;
  recordField: string;
  required: boolean;
}

export interface ResponseMappingRule {
  recordField: string;
  responseField: string;
}

export interface TransformStep {
  field: string;
  expression: string;
}

@Entity('custom_endpoints')
@Index(['method', 'path'], { unique: true })
export class CustomEndpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  method: HttpMethod;

  @Column()
  path: string;

  @Column()
  action: CustomEndpointAction;

  @Column()
  collectionId: string;

  @ManyToOne(() => Collection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collectionId' })
  collection: Collection;

  @Column('jsonb', { default: [] })
  inputMapping: InputMappingRule[];

  @Column('jsonb', { default: [] })
  transformSteps: TransformStep[];

  @Column('jsonb', { default: [] })
  responseMapping: ResponseMappingRule[];

  @Column({ default: 'none' })
  authType: CustomEndpointAuthType;

  @Column({ type: 'varchar', nullable: true })
  authUsername: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  authSecretHash: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
