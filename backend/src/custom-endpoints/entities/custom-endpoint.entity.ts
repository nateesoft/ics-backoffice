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
  'list' | 'get' | 'create' | 'update' | 'delete' | 'findBy' | 'validate';
export type CustomEndpointAuthType = 'none' | 'basic' | 'bearer';
export type ValidatePasswordMode = 'bcrypt' | 'plain';

export interface InputMappingRule {
  requestField: string;
  recordField: string;
  required: boolean;
  // 'validate' action only: marks this row as the password comparison instead of a lookup
  // criterion — requestField is the submitted password, recordField is the stored (hashed, by
  // default) password field on the record. Every other row in the same mapping is used to look
  // up the candidate record (e.g. requestField 'username' -> recordField 'username').
  isPasswordField?: boolean;
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

  // 'validate' action only — how the record's stored password field is compared against the
  // submitted password. Defaults to 'bcrypt' since real login collections should store hashed
  // passwords; 'plain' exists for test/seed data with plaintext passwords.
  @Column({ default: 'bcrypt' })
  validatePasswordMode: ValidatePasswordMode;

  @Column({ default: 'none' })
  authType: CustomEndpointAuthType;

  @Column({ type: 'varchar', nullable: true })
  authUsername: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  authSecretHash: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
