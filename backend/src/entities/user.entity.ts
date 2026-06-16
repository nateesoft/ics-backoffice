import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', default: 'admin' })
  role: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  avatarFilename: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  lastSeenAt: Date | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  lineUserId: string | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  lineRegToken: string | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  lineRegTokenExpiry: Date | null;
}
