# Management Sidebar Agent And Account Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move admin agent management into the left sidebar flow, make agent filtering instant, and replace the top-right inline account actions with a compact hover/click panel.

**Architecture:** Keep the existing admin list page as the main shell. Add a fixed first-level sidebar item for agent management, render agent management inside the list-page content area, and simplify the legacy `/agents` route to reuse the same content component. Refactor the top navigation account area into a popover-style account panel so actions are hidden until interaction.

**Tech Stack:** Vue 3, Pinia, Vue Router, Element Plus, TypeScript.

---

### Task 1: Sidebar Agent Entry

**Files:**
- Modify: `web/src/management/utils/workSpace.ts`
- Modify: `web/src/management/stores/workSpace.ts`
- Modify: `web/src/management/pages/list/components/SliderBar.vue`
- Modify: `web/src/management/pages/list/index.vue`
- Modify: `web/src/management/router/index.ts`

- [ ] Add a dedicated admin-only sidebar menu id for agent management.
- [ ] Teach the list page to treat that menu as a first-level content view.
- [ ] Route `/agents` through the same list-page shell so the sidebar remains the primary entry.

### Task 2: Agent Management Content

**Files:**
- Create: `web/src/management/pages/agent/components/AgentManagePanel.vue`
- Modify: `web/src/management/pages/agent/AgentPage.vue`
- Modify: `web/src/management/api/space.ts`

- [ ] Extract agent management body into a reusable panel component.
- [ ] Replace explicit search button behavior with input-driven filtering.
- [ ] Keep empty-result behavior as a plain empty table when no agent matches.

### Task 3: Account Action Drawer

**Files:**
- Modify: `web/src/management/components/TopNav.vue`
- Reuse: `web/src/management/components/ChangePasswordDialog.vue`

- [ ] Replace inline “修改密码 / 退出” text buttons with a compact account trigger.
- [ ] Show actions inside a hover/click popover-style drawer panel.
- [ ] Keep both admin and agent flows using the same account interaction.

### Task 4: Verification

**Files:**
- All modified frontend files

- [ ] Run `cd web && npm run type-check`.
