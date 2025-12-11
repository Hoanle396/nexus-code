import { IsNotEmpty, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TeamPlan } from '../team.entity';
import { TeamRole } from '../team-member.entity';

export class CreateTeamDto {
  @ApiProperty({ example: 'My Team', description: 'Team name' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A great team', required: false })
  @IsOptional()
  description?: string;
}

export class UpdateTeamDto {
  @ApiProperty({ required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  avatarUrl?: string;
}

export class InviteMemberDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email of user to invite' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: TeamRole, default: TeamRole.MEMBER })
  @IsEnum(TeamRole)
  @IsOptional()
  role?: TeamRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: TeamRole })
  @IsEnum(TeamRole)
  role: TeamRole;
}
