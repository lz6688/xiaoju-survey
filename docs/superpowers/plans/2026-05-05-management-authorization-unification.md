# Management Authorization Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify survey assignment and collaboration into one authorization model, add agent audit visibility, and expose authorized agent names in management views.

**Architecture:** Move survey member authorization to collaborator records with a four-permission model and legacy permission compatibility. Keep `assignedAgentIds` as a transition fallback for reads while the frontend switches to a single authorization-management flow. Extend user records with login/access audit fields and surface them through the existing admin agent page.

**Tech Stack:** NestJS, TypeORM MongoRepository, Jest, Vue 3, Pinia, Vue Router, Element Plus.

---

## File Structure

- Modify `server/src/enums/surveyPermission.ts`: add new permission constants and authorization display names, keep legacy compatibility values.
- Modify `server/src/models/user.entity.ts`: add login/access audit fields.
- Modify `server/src/models/collaborator.entity.ts`: allow collaborator role metadata if needed by response shaping.
- Modify `server/src/modules/auth/services/user.service.ts`: support audit updates and richer agent list results.
- Modify `server/src/guards/authentication.guard.ts`: touch user access time/IP on authenticated requests.
- Modify `server/src/guards/survey.guard.ts`: normalize collaborator permissions and legacy assigned-agent fallback.
- Modify `server/src/modules/survey/services/collaborator.service.ts`: add permission normalization helpers and survey-member query helpers.
- Modify `server/src/modules/survey/controllers/collaborator.controller.ts`: return normalized permissions, rename authorization labels, and make unified authorization save the primary flow.
- Modify `server/src/modules/survey/controllers/surveyMeta.controller.ts`: include authorized agent summaries and collaborator-derived current permissions.
- Modify `server/src/modules/survey/services/surveyMeta.service.ts`: remove agent-only filtering by `assignedAgentIds` as the primary path and support authorization summary shaping.
- Modify `server/src/modules/auth/controllers/auth.controller.ts`: update login to write audit info.
- Modify `server/src/modules/auth/controllers/user.controller.ts`: return audit fields from agent list and allow blank username for full-list queries.
- Modify DTOs under `server/src/modules/auth/dto` and `server/src/modules/survey/dto`: allow optional username and expanded permissions.
- Modify auth/survey/guard Jest specs accordingly.
- Modify `web/src/management/utils/workSpace.ts`: replace three old permission names with four new authorization permissions and labels.
- Modify `web/src/management/router/index.ts`: require new permissions per page.
- Modify `web/src/management/components/LeftMenu.vue`: render tabs from edit/delivery/data permissions.
- Modify `web/src/management/components/CooperModify/*`: turn collaboration UI into authorization management UI with agent defaults and role display.
- Delete or stop using `web/src/management/pages/list/components/AssignAgentDialog.vue`: merged into authorization management.
- Modify `web/src/management/pages/list/components/BaseList.vue`: replace separate assign/cooper actions with unified authorization action and show authorized-agent column.
- Modify `web/src/management/config/listConfig.js`: add authorized-agent field configuration.
- Modify `web/src/management/pages/agent/AgentPage.vue`: default-load agents and show audit columns.
- Modify `web/src/management/api/space.ts` and related stores: support optional username and unified authorization naming.

### Task 1: Document and Encode New Permission Semantics

**Files:**
- Modify: `server/src/enums/surveyPermission.ts`
- Modify: `server/src/modules/survey/dto/batchSaveCollaborator.dto.ts`
- Modify: `server/src/modules/survey/dto/createCollaborator.dto.ts`
- Modify: `server/src/modules/survey/dto/changeUserPermission.dto.ts`
- Modify: `web/src/management/utils/workSpace.ts`

- [ ] Write failing tests for DTO validation and permission normalization expectations.
- [ ] Run focused tests to verify red.
- [ ] Implement four-permission model with legacy compatibility and rename "协作管理" to "授权管理".
- [ ] Run tests again to verify green.

### Task 2: Add User Login and Access Audit

**Files:**
- Modify: `server/src/models/user.entity.ts`
- Modify: `server/src/modules/auth/services/user.service.ts`
- Modify: `server/src/modules/auth/controllers/auth.controller.ts`
- Modify: `server/src/guards/authentication.guard.ts`
- Modify: `server/src/modules/auth/controllers/user.controller.ts`
- Modify: `server/src/modules/auth/dto/getUserList.dto.ts`
- Modify: `server/src/modules/auth/__test/user.service.spec.ts`
- Modify: `server/src/modules/auth/__test/auth.controller.spec.ts`
- Modify: `server/src/modules/auth/__test/user.controller.spec.ts`
- Modify: `server/src/guards/__test/authentication.guard.spec.ts`

- [ ] Write failing tests for login audit writes, request activity writes, optional agent search, and audit fields in agent list responses.
- [ ] Run focused auth tests to verify red.
- [ ] Implement audit field persistence and agent list enrichment.
- [ ] Run focused auth tests to verify green.

### Task 3: Move Agent Authorization to Collaborator Primary Path

**Files:**
- Modify: `server/src/modules/survey/services/collaborator.service.ts`
- Modify: `server/src/modules/survey/controllers/collaborator.controller.ts`
- Modify: `server/src/guards/survey.guard.ts`
- Modify: `server/src/modules/survey/controllers/surveyMeta.controller.ts`
- Modify: `server/src/modules/survey/services/surveyMeta.service.ts`
- Modify: `server/src/guards/__test/survey.guard.spec.ts`
- Modify: `server/src/modules/survey/__test/collaborator.controller.spec.ts`
- Modify: `server/src/modules/survey/__test/collaborator.service.spec.ts`
- Modify: `server/src/modules/survey/__test/surveyMeta.controller.spec.ts`
- Modify: `server/src/modules/survey/__test/surveyMeta.service.spec.ts`

- [ ] Write failing tests for normalized collaborator permissions, legacy assigned-agent fallback, unified current permissions, and authorized-agent summary output.
- [ ] Run focused survey/guard tests to verify red.
- [ ] Implement collaborator-first authorization with legacy `assignedAgentIds` compatibility.
- [ ] Run focused survey/guard tests to verify green.

### Task 4: Update Route Permission Boundaries

**Files:**
- Modify: `server/src/modules/survey/controllers/survey.controller.ts`
- Modify: `server/src/modules/survey/controllers/session.controller.ts`
- Modify: `server/src/modules/survey/controllers/surveyHistory.controller.ts`
- Modify: `server/src/modules/survey/controllers/dataStatistic.controller.ts`
- Modify: `server/src/modules/channel/controllers/channel.controller.ts`
- Modify: `web/src/management/router/index.ts`
- Modify: `web/src/management/components/LeftMenu.vue`

- [ ] Write failing tests or extend existing focused tests so edit routes need edit permission, publish/channel need delivery permission, data pages need data permission, and authorization pages need auth permission.
- [ ] Run relevant backend tests to verify red.
- [ ] Update backend metadata and frontend route permission constants.
- [ ] Run tests/type-check to verify green.

### Task 5: Merge "分配" and "协作" into Unified Authorization UI

**Files:**
- Modify: `web/src/management/components/CooperModify/ModifyDialog.vue`
- Modify: `web/src/management/components/CooperModify/MemberSelect.vue`
- Modify: `web/src/management/components/CooperModify/MemberList.vue`
- Modify: `web/src/management/pages/list/components/BaseList.vue`
- Modify: `web/src/management/config/listConfig.js`
- Modify: `web/src/management/api/space.ts`
- Delete or stop using: `web/src/management/pages/list/components/AssignAgentDialog.vue`

- [ ] Update the authorization dialog to show unified members, role-aware defaults for agents, and "授权管理" text.
- [ ] Replace separate list actions with one authorization-management entry.
- [ ] Show authorized agent usernames in the survey list.
- [ ] Run `cd web && npm run type-check` and fix any issues.

### Task 6: Enhance Admin Agent Page

**Files:**
- Modify: `web/src/management/pages/agent/AgentPage.vue`
- Modify: `web/src/management/api/space.ts`

- [ ] Make agent list load all agents on mount.
- [ ] Refresh full list after agent creation.
- [ ] Add audit columns for login/access times and IPs.
- [ ] Run `cd web && npm run type-check` and verify no errors.

### Task 7: Final Verification

**Files:**
- All modified files.

- [ ] Run focused backend tests covering auth, guard, collaborator, survey meta, and channel authorization.
- [ ] Run `cd server && npm run build`.
- [ ] Run `cd web && npm run type-check`.
