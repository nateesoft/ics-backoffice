import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RecordEntity } from './record.entity';

export type FieldType =
  'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'null';

export interface FieldSchema {
  name: string;
  type: FieldType;
}

@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ default: false })
  published: boolean;

  @Column('jsonb')
  fields: FieldSchema[];

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => RecordEntity, (record) => record.collection)
  records: RecordEntity[];
}
