# Cập nhật: Quản lý Project theo Team

## Tóm tắt thay đổi

Hệ thống đã được cập nhật để mỗi user khi đăng ký sẽ tự động được tạo một team cá nhân, và có thể tạo thêm các team khác. Tất cả các project giờ đây được quản lý theo team thay vì theo user riêng lẻ.

## 🔄 Thay đổi Backend

### 1. Auth Service - Tự động tạo Team khi đăng ký

**File:** `backend/src/modules/auth/auth.service.ts`

**Thay đổi:**
- Thêm `TeamRepository` và `TeamMemberRepository` vào constructor
- Khi user đăng ký, tự động tạo một personal team với tên: `{fullName}'s Team`
- Tự động thêm user làm OWNER của team mới
- Return `defaultTeamId` khi đăng ký thành công

**Ví dụ:**
```typescript
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
```

### 2. Project Service - Quản lý theo Team

**File:** `backend/src/modules/project/project.service.ts`

**Thay đổi:**

#### a. Create Project
- Thêm validation: kiểm tra user có phải member của team không
- Chỉ cho phép tạo project nếu user là thành viên của team

#### b. Find All Projects
- Hỗ trợ filter theo `teamId` (optional)
- Nếu có `teamId`: trả về projects của team đó (sau khi verify membership)
- Nếu không có `teamId`: trả về tất cả projects từ các team mà user là member

**Logic:**
```typescript
async findAll(userId: string, teamId?: string) {
  if (teamId) {
    // Verify membership và return projects của team
  }
  
  // Get all teams user is member of
  const memberships = await this.teamMemberRepository.find({
    where: { userId, status: InvitationStatus.ACCEPTED },
  });
  
  const teamIds = memberships.map(m => m.teamId);
  
  // Return all projects from user's teams
  return await this.projectRepository
    .createQueryBuilder('project')
    .leftJoinAndSelect('project.team', 'team')
    .where('project.teamId IN (:...teamIds)', { teamIds })
    .getMany();
}
```

#### c. Find One Project
- Kiểm tra user có phải member của team chứa project không
- Chỉ cho phép access nếu là team member

### 3. Project DTO

**File:** `backend/src/modules/project/dto/project.dto.ts`

**Thay đổi:**
- Thêm field `teamId` (required) vào `CreateProjectDto`
- Validation với `@IsUUID()` decorator

### 4. Project Controller

**File:** `backend/src/modules/project/project.controller.ts`

**Thay đổi:**
- Thêm `@Query('teamId')` parameter vào endpoint `GET /projects`
- Cho phép filter projects theo team

**API:**
```
GET /projects              -> All projects from user's teams
GET /projects?teamId=xxx   -> Projects from specific team
```

### 5. Module Updates

**Files:**
- `backend/src/modules/auth/auth.module.ts`: Thêm `Team` và `TeamMember` entities
- `backend/src/modules/project/project.module.ts`: Thêm `TeamMember` entity

---

## 🎨 Thay đổi Frontend

### 1. Dashboard - Hiển thị Projects theo Team

**File:** `frontend/src/app/dashboard/page.tsx`

**Thêm tính năng:**

#### a. Team Filter
- Load danh sách teams của user
- Hiển thị buttons filter: "Tất cả" + danh sách teams
- Active state cho team đang được chọn
- Filter projects real-time khi chọn team

#### b. Display Team Info
- Mỗi project card hiển thị team badge
- Icon `Users` với tên team
- Style với component `Badge`

**UI:**
```tsx
{/* Team Filter */}
<div className="flex items-center gap-2">
  <Users className="h-4 w-4" />
  <span>Lọc theo team:</span>
  <button>Tất cả</button>
  {teams.map(team => (
    <button key={team.id}>{team.name}</button>
  ))}
</div>

{/* Project Card */}
<Card>
  <CardContent>
    {project.team && (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <Badge>{project.team.name}</Badge>
      </div>
    )}
  </CardContent>
</Card>
```

### 2. Create Project - Team Selection

**File:** `frontend/src/app/dashboard/projects/new/page.tsx`

**Thêm tính năng:**

#### a. Load Teams
- useEffect để load danh sách teams khi component mount
- Hiển thị loading state khi đang load teams

#### b. Team Selector
- Dropdown select team (required field)
- Hiển thị: `{team.name} ({team.plan})`
- Validation: phải chọn team

**Form Field:**
```tsx
<div className="space-y-2">
  <Label htmlFor="teamId">Team *</Label>
  <select
    id="teamId"
    {...register('teamId', { required: 'Team là bắt buộc' })}
  >
    <option value="">Chọn team</option>
    {teams.map((team) => (
      <option key={team.id} value={team.id}>
        {team.name} ({team.plan})
      </option>
    ))}
  </select>
</div>
```

### 3. Project Service

**File:** `frontend/src/services/project.service.ts`

**Thay đổi:**

#### a. Interfaces
- `Project`: Thêm fields `teamId` và `team` object
- `CreateProjectData`: Thêm field `teamId` (required)

#### b. API Methods
- `getAll(teamId?: string)`: Hỗ trợ optional teamId parameter
- Gửi teamId qua query params nếu có

```typescript
getAll: async (teamId?: string): Promise<Project[]> => {
  const params = teamId ? { teamId } : {};
  const response = await api.get('/projects', { params });
  return response.data;
}
```

---

## 📊 Flow hoạt động

### 1. User đăng ký
```
User Register
  ↓
Create User in DB
  ↓
Auto-create Personal Team
  ↓
Add User as Team Owner
  ↓
Return user + defaultTeamId
```

### 2. User tạo Project
```
User clicks "Tạo Project"
  ↓
Load user's teams (dropdown)
  ↓
User chọn Team + điền thông tin
  ↓
Backend: Verify user is team member
  ↓
Create Project with teamId
  ↓
Success → Redirect to Dashboard
```

### 3. User xem Projects
```
Dashboard loads
  ↓
Load user's teams (for filter)
  ↓
Load ALL projects from user's teams
  ↓
Display with team badges
  ↓
User clicks team filter
  ↓
Reload projects for that team only
```

---

## 🔒 Security & Permissions

### Project Access Control

**Rule:** User chỉ có thể access projects của teams mà họ là member

**Validation:**
1. **Create**: Verify user is team member trước khi tạo
2. **Read All**: Chỉ return projects từ teams mà user là member
3. **Read One**: Verify user là member của team chứa project
4. **Update**: Verify qua findOne (đã có check)
5. **Delete**: Verify qua findOne (đã có check)

### Team Membership Check
```typescript
const membership = await this.teamMemberRepository.findOne({
  where: {
    userId,
    teamId: project.teamId,
    status: InvitationStatus.ACCEPTED,
  },
});

if (!membership) {
  throw new ForbiddenException('Access denied');
}
```

---

## 🎯 Benefits

### 1. Team Collaboration
- Nhiều users có thể cùng quản lý projects trong một team
- Dễ dàng share projects giữa team members
- Projects được organize tốt hơn theo team/organization

### 2. Better Organization
- User có thể có nhiều teams (personal, work, side projects)
- Mỗi team có projects riêng
- Filter nhanh theo team

### 3. Scalability
- Chuẩn bị cho tính năng team subscription
- Projects limits theo team thay vì theo user
- Dễ dàng implement role-based permissions trong team

### 4. Commercial Ready
- Team-based billing (subscription theo team)
- Có thể set limits theo team plan (FREE, STARTER, PRO, ENTERPRISE)
- Revenue từ teams thay vì individual users

---

## 📋 Migration Notes

### Dữ liệu cũ (nếu có)

**Trường hợp:** Database đã có users và projects trước khi update

**Cần làm:**
1. Tạo personal team cho tất cả existing users
2. Migrate projects cũ sang team của user đó
3. Set `teamId` cho tất cả projects

**Migration Script Example:**
```sql
-- Tạo personal teams cho existing users
INSERT INTO teams (name, description, "ownerId", plan)
SELECT 
  CONCAT(COALESCE("fullName", SPLIT_PART(email, '@', 1)), '''s Team'),
  'Personal workspace',
  id,
  'FREE'
FROM users
WHERE id NOT IN (SELECT DISTINCT "ownerId" FROM teams);

-- Add users as team owners
INSERT INTO team_members ("teamId", "userId", role, status)
SELECT 
  t.id,
  t."ownerId",
  'OWNER',
  'ACCEPTED'
FROM teams t
WHERE NOT EXISTS (
  SELECT 1 FROM team_members tm 
  WHERE tm."teamId" = t.id AND tm."userId" = t."ownerId"
);

-- Update projects to use team
UPDATE projects p
SET "teamId" = (
  SELECT t.id 
  FROM teams t 
  WHERE t."ownerId" = p."userId"
  LIMIT 1
)
WHERE "teamId" IS NULL;
```

---

## ✅ Testing Checklist

### Backend
- [ ] User register tự động tạo team
- [ ] Create project yêu cầu teamId
- [ ] Create project verify team membership
- [ ] Get all projects return từ user's teams
- [ ] Get all projects với teamId filter
- [ ] Get project verify team membership
- [ ] Non-member không access được projects
- [ ] Team invitation flow vẫn hoạt động

### Frontend
- [ ] Dashboard hiển thị team filter
- [ ] Dashboard hiển thị team badge trên project cards
- [ ] Filter by team hoạt động
- [ ] Create project form có team selector
- [ ] Create project validate teamId
- [ ] Teams dropdown load đúng
- [ ] Project detail hiển thị team info

---

## 🚀 Next Steps

### Suggested Enhancements

1. **Team-based Project Limits**
   - FREE: 1 project per team
   - STARTER: 5 projects per team
   - PRO: 20 projects per team
   - ENTERPRISE: unlimited

2. **Team Dashboard**
   - Trang dashboard riêng cho mỗi team
   - Team statistics (total projects, reviews, members)
   - Team activity log

3. **Project Transfer**
   - Allow project owner to transfer project to another team
   - Useful khi user switch teams

4. **Role-based Project Permissions**
   - OWNER: full access
   - ADMIN: manage projects
   - MEMBER: create and view projects
   - VIEWER: only view projects

5. **Team Templates**
   - Pre-defined review rules per team
   - Business context templates
   - Webhook configurations

---

## 📝 API Changes Summary

### New Endpoints
None (existing endpoints updated)

### Updated Endpoints

#### `POST /projects`
**Request Body:**
```json
{
  "name": "Project Name",
  "type": "github",
  "repositoryUrl": "https://github.com/user/repo",
  "teamId": "uuid-here",  // NEW - Required
  "businessContext": "...",
  "autoReview": true
}
```

#### `GET /projects`
**Query Parameters:**
- `teamId` (optional): Filter by team ID

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Project Name",
    "teamId": "uuid",
    "team": {              // NEW - Populated
      "id": "uuid",
      "name": "Team Name",
      "plan": "FREE"
    },
    ...
  }
]
```

#### `GET /projects/:id`
**Response:**
```json
{
  "id": "uuid",
  "name": "Project Name",
  "teamId": "uuid",
  "team": {              // NEW - Populated
    "id": "uuid",
    "name": "Team Name",
    "plan": "FREE"
  },
  ...
}
```

---

## 🎓 Developer Notes

### Important Changes

1. **Breaking Change**: `CreateProjectDto` giờ require `teamId`
   - Frontend forms phải update để include team selection
   - API calls cũ sẽ fail validation

2. **Database Relations**: Projects giờ có relation với Team
   - Sử dụng `relations: ['team']` khi query để load team info
   - Team info được populate trong response

3. **Access Control**: Logic verify team membership
   - Mọi project operations đều check membership
   - ForbiddenException nếu không phải team member

4. **Migration**: Existing projects cần migrate
   - Set teamId cho projects cũ
   - Tạo personal teams cho existing users

### Code Examples

#### Check Team Membership (Reusable)
```typescript
async verifyTeamMembership(userId: string, teamId: string) {
  const membership = await this.teamMemberRepository.findOne({
    where: {
      userId,
      teamId,
      status: InvitationStatus.ACCEPTED,
    },
  });
  
  if (!membership) {
    throw new ForbiddenException('You are not a member of this team');
  }
  
  return membership;
}
```

#### Get User's Team IDs
```typescript
async getUserTeamIds(userId: string): Promise<string[]> {
  const memberships = await this.teamMemberRepository.find({
    where: { userId, status: InvitationStatus.ACCEPTED },
  });
  
  return memberships.map(m => m.teamId);
}
```

---

Hệ thống giờ đã hoàn chỉnh với team-based project management! 🎉
