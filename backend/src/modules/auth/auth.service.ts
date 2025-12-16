import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash, verify } from '@node-rs/argon2';
import { User } from '../user/user.entity';
import { Team } from '../team/team.entity';
import { TeamMember, TeamRole, InvitationStatus } from '../team/team-member.entity';
import { RegisterDto, LoginDto, UpdateTokensDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private teamMemberRepository: Repository<TeamMember>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await hash(registerDto.password);

    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    // Auto-create personal team for new user
    const personalTeam = this.teamRepository.create({
      name: `${registerDto.fullName || registerDto.email.split('@')[0]}'s Team`,
      description: 'Personal workspace',
      ownerId: savedUser.id,
    });

    const savedTeam = await this.teamRepository.save(personalTeam);

    // Add user as team owner
    await this.teamMemberRepository.save({
      teamId: savedTeam.id,
      userId: savedUser.id,
      role: TeamRole.OWNER,
      status: InvitationStatus.ACCEPTED,
    });

    const { password, ...result } = savedUser;
    return { ...result, defaultTeamId: savedTeam.id };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (user && (await verify(user.password, password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  // Deprecated: Tokens are now managed per project
  // async updateTokens(userId: string, updateTokensDto: UpdateTokensDto) {
  //   const user = await this.userRepository.findOne({ where: { id: userId } });

  //   if (!user) {
  //     throw new UnauthorizedException();
  //   }

  //   if (updateTokensDto.githubToken) {
  //     user.githubToken = updateTokensDto.githubToken;
  //   }

  //   if (updateTokensDto.gitlabToken) {
  //     user.gitlabToken = updateTokensDto.gitlabToken;
  //   }

  //   if (updateTokensDto.discordBotToken) {
  //     user.discordBotToken = updateTokensDto.discordBotToken;
  //   }

  //   await this.userRepository.save(user);

  //   return { message: 'Tokens updated successfully' };
  // }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException();
    }

    const { password, githubToken, gitlabToken, discordBotToken, ...result } = user;
    return {
      ...result,
      // Tokens are now managed per project, keeping these for backward compatibility
      hasGithubToken: false,
      hasGitlabToken: false,
      hasDiscordBotToken: false,
    };
  }
}
