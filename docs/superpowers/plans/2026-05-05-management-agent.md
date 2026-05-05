# Management Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin and agent management experiences with system roles, agent account creation, survey assignment, restricted agent delivery/data access, and password changes.

**Architecture:** Keep one management frontend entry and add role-aware routes, stores, and actions. Add a system role field to `User`, assignment ids to `SurveyMeta`, and enforce access in backend guards and list queries. Preserve existing owner, workspace, and collaborator permission behavior for compatibility.

**Tech Stack:** NestJS, TypeORM MongoRepository, Jest, Vue 3, Pinia, Vue Router, Element Plus.

---

## File Structure

- Modify `server/src/models/user.entity.ts`: add `role`.
- Modify `server/src/models/surveyMeta.entity.ts`: add `assignedAgentIds`.
- Create `server/src/enums/user.ts`: define `USER_ROLE`.
- Create `server/src/guards/admin.guard.ts`: require authenticated admin users.
- Modify `server/src/guards/survey.guard.ts`: admin bypass and assigned-agent access.
- Modify `server/src/modules/auth/services/user.service.ts`: role defaults, admin bootstrap, agent creation/listing, password changes.
- Modify `server/src/modules/auth/services/auth.service.ts`: include `role` in tokens and return resolved users with role fallback.
- Modify `server/src/modules/auth/controllers/auth.controller.ts`: return role on login/register and add change password endpoint.
- Modify `server/src/modules/auth/controllers/user.controller.ts`: return role, add admin-only agent APIs.
- Modify `server/src/modules/auth/auth.module.ts`: ensure default admin on startup.
- Modify `server/src/modules/survey/services/surveyMeta.service.ts`: support admin list, agent assigned list, and assignment updates.
- Modify `server/src/modules/survey/controllers/surveyMeta.controller.ts`: pass user role to list queries and add admin assignment APIs.
- Modify `server/src/modules/channel/controllers/channel.controller.ts`: mark channel APIs as agent deliverable and require `surveyId`.
- Modify `server/src/modules/channel/services/channel.service.ts`: optional owner filtering for agent channel operations.
- Modify backend spec files under `server/src/modules/auth/__test`, `server/src/modules/survey/__test`, and `server/src/guards/__test`.
- Modify `web/src/management/stores/user.ts`: store `role`.
- Modify `web/src/management/api/auth.js`, `web/src/management/api/survey.js`, `web/src/management/api/channel.ts`: add new APIs and include `surveyId` for channel mutations.
- Modify `web/src/management/router/index.ts`: add admin/agent routes and role guard.
- Modify `web/src/management/pages/login/LoginPage.vue`: remove public registration and role-aware redirect.
- Modify `web/src/management/pages/list/index.vue`: hide admin-only create/group/space actions for agents.
- Modify `web/src/management/pages/list/components/BaseList.vue`: show assign action for admins and delivery/data-only actions for agents.
- Create `web/src/management/pages/agent/AgentPage.vue`: admin agent creation/list page.
- Create `web/src/management/components/ChangePasswordDialog.vue`: password change UI.
- Create `web/src/management/pages/list/components/AssignAgentDialog.vue`: assign agents to a survey.
- Modify `web/src/management/components/TopNav.vue`: role-aware nav and password dialog.

### Task 1: Backend User Roles

**Files:**
- Create: `server/src/enums/user.ts`
- Modify: `server/src/models/user.entity.ts`
- Modify: `server/src/modules/auth/services/user.service.ts`
- Modify: `server/src/modules/auth/__test/user.service.spec.ts`

- [ ] **Step 1: Write failing tests**

Add tests that expect `createUser` to default to `agent`, `createAgent` to save an agent role, `ensureDefaultAdmin` to create `admin/admin`, and `changePassword` to reject wrong old passwords and hash the new password.

- [ ] **Step 2: Run tests to verify red**

Run: `cd server && npm test -- modules/auth/__test/user.service.spec.ts --runInBand`

Expected: FAIL because `role`, `createAgent`, `ensureDefaultAdmin`, and `changePassword` do not exist yet.

- [ ] **Step 3: Implement minimal role support**

Add `USER_ROLE`, add the `role` column, default created users to agent, add admin bootstrap, agent creation/listing, and password change methods.

- [ ] **Step 4: Run tests to verify green**

Run: `cd server && npm test -- modules/auth/__test/user.service.spec.ts --runInBand`

Expected: PASS.

### Task 2: Auth and Admin APIs

**Files:**
- Create: `server/src/guards/admin.guard.ts`
- Modify: `server/src/modules/auth/auth.module.ts`
- Modify: `server/src/modules/auth/services/auth.service.ts`
- Modify: `server/src/modules/auth/controllers/auth.controller.ts`
- Modify: `server/src/modules/auth/controllers/user.controller.ts`
- Modify: `server/src/modules/auth/__test/auth.controller.spec.ts`
- Modify: `server/src/modules/auth/__test/user.controller.spec.ts`

- [ ] **Step 1: Write failing tests**

Add controller tests that expect login and user info responses to include `role`, password change to call `UserService.changePassword`, and admin agent APIs to call `createAgent` and `getAgentList`.

- [ ] **Step 2: Run tests to verify red**

Run: `cd server && npm test -- modules/auth/__test/auth.controller.spec.ts modules/auth/__test/user.controller.spec.ts --runInBand`

Expected: FAIL because the responses and endpoints are missing.

- [ ] **Step 3: Implement APIs**

Return `role` from login/register/user info, add `POST /api/auth/changePassword`, `POST /api/user/createAgent`, and `GET /api/user/getAgentList`, and call `ensureDefaultAdmin` when `AuthModule` initializes.

- [ ] **Step 4: Run tests to verify green**

Run: `cd server && npm test -- modules/auth/__test/auth.controller.spec.ts modules/auth/__test/user.controller.spec.ts --runInBand`

Expected: PASS.

### Task 3: Survey Assignment and Guard Rules

**Files:**
- Modify: `server/src/models/surveyMeta.entity.ts`
- Modify: `server/src/guards/survey.guard.ts`
- Modify: `server/src/modules/survey/services/surveyMeta.service.ts`
- Modify: `server/src/modules/survey/controllers/surveyMeta.controller.ts`
- Modify: `server/src/guards/__test/survey.guard.spec.ts`
- Modify: `server/src/modules/survey/__test/surveyMeta.service.spec.ts`
- Modify: `server/src/modules/survey/__test/surveyMeta.controller.spec.ts`

- [ ] **Step 1: Write failing tests**

Add tests for admin all-survey listing, agent assigned-survey listing, `assignAgents`, admin guard bypass, assigned agent access with `agentAccess`, and assigned agent denial for mutation handlers without `agentAccess`.

- [ ] **Step 2: Run tests to verify red**

Run: `cd server && npm test -- guards/__test/survey.guard.spec.ts modules/survey/__test/surveyMeta.service.spec.ts modules/survey/__test/surveyMeta.controller.spec.ts --runInBand`

Expected: FAIL because assignment and role-aware filtering are missing.

- [ ] **Step 3: Implement assignment and guard behavior**

Add `assignedAgentIds`, role-aware `getSurveyMetaList`, assignment service/controller methods, and `agentAccess` handling in `SurveyGuard`.

- [ ] **Step 4: Run tests to verify green**

Run: `cd server && npm test -- guards/__test/survey.guard.spec.ts modules/survey/__test/surveyMeta.service.spec.ts modules/survey/__test/surveyMeta.controller.spec.ts --runInBand`

Expected: PASS.

### Task 4: Agent Delivery APIs

**Files:**
- Modify: `server/src/modules/channel/controllers/channel.controller.ts`
- Modify: `server/src/modules/channel/services/channel.service.ts`
- Modify: `server/src/modules/survey/controllers/dataStatistic.controller.ts`
- Modify: `server/src/modules/channel/__test/channel.controller.spec.ts` if present; otherwise extend focused service/controller coverage where existing tests live.

- [ ] **Step 1: Write failing tests**

Add tests that channel list/create/update/status/delete handlers carry `agentAccess`, require `surveyId`, and restrict agent channel mutations to their own channels.

- [ ] **Step 2: Run tests to verify red**

Run: `cd server && npm test -- modules/channel --runInBand`

Expected: FAIL before channel access updates.

- [ ] **Step 3: Implement channel updates**

Mark channel handlers with `agentAccess`, include `surveyId` in guarded body handlers, and filter agent channel operations by owner.

- [ ] **Step 4: Run tests to verify green**

Run: `cd server && npm test -- modules/channel --runInBand`

Expected: PASS.

### Task 5: Frontend Role Experience

**Files:**
- Modify: `web/src/management/stores/user.ts`
- Modify: `web/src/management/router/index.ts`
- Modify: `web/src/management/pages/login/LoginPage.vue`
- Modify: `web/src/management/components/TopNav.vue`
- Create: `web/src/management/components/ChangePasswordDialog.vue`
- Create: `web/src/management/pages/agent/AgentPage.vue`
- Modify: `web/src/management/pages/list/index.vue`
- Modify: `web/src/management/pages/list/components/BaseList.vue`
- Create: `web/src/management/pages/list/components/AssignAgentDialog.vue`
- Modify: `web/src/management/api/auth.js`
- Modify: `web/src/management/api/survey.js`
- Modify: `web/src/management/api/channel.ts`

- [ ] **Step 1: Update frontend APIs and store**

Add `role`, agent APIs, assignment APIs, and change password API.

- [ ] **Step 2: Update router and login**

Add admin/agent redirects and role guard. Remove the public registration button.

- [ ] **Step 3: Update pages and controls**

Add agent management, password change, survey assignment, and agent-only delivery/data actions.

- [ ] **Step 4: Run frontend verification**

Run: `cd web && npm run type-check`

Expected: exit 0.

### Task 6: Final Verification

**Files:**
- All modified files.

- [ ] **Step 1: Run focused backend tests**

Run: `cd server && npm test -- modules/auth/__test/user.service.spec.ts modules/auth/__test/auth.controller.spec.ts modules/auth/__test/user.controller.spec.ts guards/__test/survey.guard.spec.ts modules/survey/__test/surveyMeta.service.spec.ts modules/survey/__test/surveyMeta.controller.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 2: Run backend build**

Run: `cd server && npm run build`

Expected: exit 0.

- [ ] **Step 3: Run frontend type-check**

Run: `cd web && npm run type-check`

Expected: exit 0.
