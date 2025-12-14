import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from '../project/project.entity';

@Entity('token_usage')
export class TokenUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ nullable: true })
  reviewId: string;

  @Column({ default: 'openrouter' })
  provider: string;

  @Column({ default: 'anthropic/claude-3.5-sonnet' })
  model: string;

  @Column({ type: 'int', default: 0 })
  promptTokens: number;

  @Column({ type: 'int', default: 0 })
  completionTokens: number;

  @Column({ type: 'int', default: 0 })
  totalTokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  estimatedCost: number;

  @Column({ nullable: true })
  operation: string; // 'review', 'reply', 'summary'

  @Column({ nullable: true })
  fileName: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
