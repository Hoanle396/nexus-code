# Token Management Migration - Per Project Configuration

## Overview
Migrated token management from global user-level settings to per-project configuration. Each project can now have its own GitHub token, GitLab token, and Discord bot token.

## Changes Made

### Backend Changes

#### 1. Project Entity (`backend/src/modules/project/project.entity.ts`)
- Added three new optional fields:
  - `githubToken?: string`
  - `gitlabToken?: string`
  - `discordBotToken?: string`

#### 2. Project DTOs (`backend/src/modules/project/dto/project.dto.ts`)
- Updated `CreateProjectDto` to include optional token fields
- Updated `UpdateProjectDto` to include optional token fields

#### 3. Database Migration (`backend/src/migrations/1734200000000-AddTokensToProjects.ts`)
- Created new migration to add token columns to `projects` table
- All three token fields are nullable (optional)

#### 4. Webhook Service (`backend/src/modules/webhook/webhook.service.ts`)
- Updated all references from `project.user.githubToken` to `project.githubToken`
- Updated all references from `project.user.gitlabToken` to `project.gitlabToken`
- Updated all references from `project.user.discordBotToken` to `project.discordBotToken`
- Affected methods:
  - `fetchGithubFileContents()`
  - `fetchGitlabFileContents()`
  - `postLineComment()`
  - `postReplyToComment()`
  - `postComment()`
  - `enrichGitlabMRData()`
  - `extractCommentData()`
  - Discord notification sending

#### 5. Auth Service (`backend/src/modules/auth/auth.service.ts`)
- Deprecated `updateTokens()` method (commented out)
- Updated `getProfile()` to return `false` for all `hasXToken` flags (backward compatibility)

#### 6. Auth Controller (`backend/src/modules/auth/auth.controller.ts`)
- Commented out `PUT /auth/tokens` endpoint (deprecated)

### Frontend Changes

#### 1. Project Service (`frontend/src/services/project.service.ts`)
- Updated `Project` interface to include optional token fields
- Updated `CreateProjectData` interface to include optional token fields
- Updated `UpdateProjectData` interface to include optional token fields

#### 2. New Project Page (`frontend/src/app/dashboard/projects/new/page.tsx`)
- Added "API Tokens" section with three token input fields:
  - GitHub Personal Access Token
  - GitLab Personal Access Token
  - Discord Bot Token (Optional)
- Each field includes:
  - Password input type for security
  - Placeholder text
  - Helper text with required scopes/usage

#### 3. Edit Project Page (`frontend/src/app/dashboard/projects/[id]/page.tsx`)
- Added "API Tokens" section (same as new project page)
- Updated `loadProject()` to populate token fields in the form
- Added setValue calls for:
  - `githubToken`
  - `gitlabToken`
  - `discordBotToken`

#### 4. Settings Page (`frontend/src/app/dashboard/settings/page.tsx`)
- Removed all token-related form fields and submission logic
- Replaced with informational card explaining tokens are now per-project
- Removed unused imports:
  - `useForm`, `toast`, `Button`, `Input`, `Label`, `Badge`, `Save`, `CheckCircle`
  - `UpdateTokensData`, `cn`
- Simplified page to only show account information
- Updated page description from "Manage your account and integration tokens" to "Manage your account information"

## Migration Instructions

### Database Migration
Run the migration to add token columns to the projects table:
```bash
cd backend
npm run migration:run
# or
pnpm migration:run
```

### User Migration Path
Users need to:
1. Go to each of their projects
2. Edit the project settings
3. Add the appropriate tokens (GitHub for GitHub projects, GitLab for GitLab projects)
4. Add Discord bot token if they want notifications
5. Save the project

### Benefits
- **Better Security**: Tokens can be scoped per project
- **Flexibility**: Different projects can use different tokens/accounts
- **Team Collaboration**: Team members can configure tokens for their own projects
- **Isolation**: Compromised token only affects one project instead of all projects

## Breaking Changes
- ⚠️ **API Breaking Change**: `PUT /auth/tokens` endpoint is now deprecated (commented out)
- ⚠️ **Behavior Change**: Existing projects will need tokens to be reconfigured at project level
- ⚠️ **Data Migration**: User-level tokens are not automatically copied to projects

## Backward Compatibility
- User entity still has token fields (not removed to avoid breaking migration)
- `getProfile()` endpoint still returns `hasXToken` flags (always false now)
- Old webhook service code that used `project.user` relation will fail gracefully

## Testing Checklist
- [ ] Create new GitHub project with token
- [ ] Create new GitLab project with token
- [ ] Edit existing project to add tokens
- [ ] Test PR webhook with project-level GitHub token
- [ ] Test MR webhook with project-level GitLab token
- [ ] Test Discord notifications with project-level bot token
- [ ] Verify settings page shows information message
- [ ] Test that projects without tokens fail gracefully with clear error messages

## Future Enhancements
- Add token validation on project creation/update
- Add UI indicators for which tokens are required based on project type
- Add option to test tokens before saving
- Add migration script to copy user tokens to their projects
