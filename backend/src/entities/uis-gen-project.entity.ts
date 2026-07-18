import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('uis_gen_projects')
export class UisGenProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  templateId: string;

  @Column()
  navPosition: string;

  @Column()
  themeColor: string;

  // Gates whether the project detail page shows the "Generate" empty-state or the Sitemap
  // Canvas directly — set true the first time the user clicks Generate.
  @Column({ default: false })
  sitemapGenerated: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
