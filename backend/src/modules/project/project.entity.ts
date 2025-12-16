import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Review } from '../review/review.entity';
import { Team } from '../team/team.entity';

export enum ProjectType {
  GITHUB = 'github',
  GITLAB = 'gitlab',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ProjectType })
  type: ProjectType;

  @Column()
  repositoryUrl: string;

  @Column({ nullable: true })
  webhookUrl?: string;

  @Column({ nullable: true })
  webhookSecret?: string;

  @Column({ type: 'text', nullable: true })
  businessContext?: string;

  @Column({ type: 'json', nullable: true })
  reviewRules?: Record<string, any>;

  @Column({ default: true })
  autoReview: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  discordChannelId?: string;

  @Column({ nullable: true })
  githubToken?: string;

  @Column({ nullable: true })
  gitlabToken?: string;

  @Column({ nullable: true })
  discordBotToken?: string;

  @ManyToOne(() => User, (user) => user.projects)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Team, (team) => team.projects, { nullable: true })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column({ nullable: true })
  teamId?: string;

  @OneToMany(() => Review, (review) => review.project, { cascade: true, onDelete: 'CASCADE' })
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
