import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CodeType {
  JAVA = 'Java',
  NODEJS = 'NodeJS',
  NESTJS = 'NestJS',
  NEXTJS = 'NextJS',
  REACTJS = 'ReactJS',
  JAVA_SPRINGBOOT = 'Java Springboot',
  PYTHON = 'Python',
  GOLANG = 'Golang',
}

export enum Priority {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum WorkPeriodUnit {
  DAYS = 'Days',
  HOURS = 'Hours',
}

export enum TaskStatus {
  NEW = 'New',
  TODO = 'Todo',
  IN_PROGRESS = 'InProgress',
  TEST = 'Test',
  DONE = 'Done',
}

export enum DeploymentStatus {
  WAIT_APPROVE = 'Wait Approve',
  WAIT_DEPLOY = 'Wait Deploy',
  DEPLOYED = 'Deployed',
}

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectName: string;

  @Column({ type: 'enum', enum: CodeType })
  codeType: CodeType;

  @Column({ type: 'text', nullable: true })
  detail: string;

  @Column({ nullable: true })
  githubLink: string;

  @Column({ type: 'date' })
  issueCreateDate: string;

  @Column({ type: 'enum', enum: Priority })
  priority: Priority;

  @Column({ type: 'int', nullable: true })
  taskWorkPeriod: number;

  @Column({ type: 'enum', enum: WorkPeriodUnit, nullable: true })
  taskWorkPeriodUnit: WorkPeriodUnit;

  @Column({ type: 'date', nullable: true })
  targetDate: string;

  @Column({ nullable: true })
  issuer: string;

  @Column({ nullable: true })
  developer: string;

  @Column({ nullable: true })
  tester: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.NEW })
  taskStatus: TaskStatus;

  @Column({ type: 'enum', enum: DeploymentStatus, default: DeploymentStatus.WAIT_APPROVE })
  deploymentStatus: DeploymentStatus;

  @Column({ nullable: true })
  anydesk: string;

  @Column({ nullable: true })
  teamViewer: string;

  @Column({ type: 'text', nullable: true })
  contractDetail: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ default: false })
  isCancelled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
