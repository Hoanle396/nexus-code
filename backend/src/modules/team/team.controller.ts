import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TeamService } from './team.service';
import { CreateTeamDto, UpdateTeamDto, InviteMemberDto, UpdateMemberRoleDto } from './dto/team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('teams')
@ApiBearerAuth('JWT-auth')
@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  create(@Request() req, @Body() createTeamDto: CreateTeamDto) {
    return this.teamService.create(req.user.id, createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user teams' })
  @ApiResponse({ status: 200, description: 'Returns list of teams' })
  findAll(@Request() req) {
    return this.teamService.findAllByUser(req.user.id);
  }

  @Get('my-invitations')
  @ApiOperation({ summary: 'Get pending invitations' })
  getPendingInvitations(@Request() req) {
    return this.teamService.getPendingInvitations(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team details' })
  @ApiResponse({ status: 200, description: 'Returns team details' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.teamService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team' })
  @ApiResponse({ status: 200, description: 'Team updated successfully' })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamService.update(id, req.user.id, updateTeamDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete team' })
  @ApiResponse({ status: 200, description: 'Team deleted successfully' })
  remove(@Param('id') id: string, @Request() req) {
    return this.teamService.remove(id, req.user.id);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite member to team' })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  inviteMember(
    @Param('id') id: string,
    @Request() req,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.teamService.inviteMember(id, req.user.id, inviteMemberDto);
  }

  @Post('accept-invitation')
  @ApiOperation({ summary: 'Accept team invitation' })
  acceptInvitation(@Body() body: { token: string }, @Request() req) {
    return this.teamService.acceptInvitation(body.token, req.user.id);
  }

  @Post('decline-invitation')
  @ApiOperation({ summary: 'Decline team invitation' })
  declineInvitation(@Body() body: { token: string }, @Request() req) {
    return this.teamService.declineInvitation(body.token, req.user.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get team members' })
  getMembers(@Param('id') id: string, @Request() req) {
    return this.teamService.getTeamMembers(id, req.user.id);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove team member' })
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req,
  ) {
    return this.teamService.removeMember(id, memberId, req.user.id);
  }

  @Patch(':id/members/:memberId/role')
  @ApiOperation({ summary: 'Update member role' })
  updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.teamService.updateMemberRole(
      id,
      memberId,
      req.user.id,
      updateMemberRoleDto.role,
    );
  }
}
