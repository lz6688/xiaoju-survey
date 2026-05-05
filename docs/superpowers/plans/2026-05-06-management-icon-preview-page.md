# Management Icon Preview Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local development-only icon preview page for management iconfont inspection.

**Architecture:** Create a lightweight page under the management router that renders the existing iconfont class names in a grid. Keep the route hidden from normal navigation so it does not affect the product UI.

**Tech Stack:** Vue 3, Vue Router, TypeScript, SCSS.

---

### Task 1: Add Hidden Icon Preview Route

**Files:**
- Modify: `web/src/management/router/index.ts`

- [ ] Add a hidden authenticated route at `/icon-preview`.

### Task 2: Build Preview Page

**Files:**
- Create: `web/src/management/pages/icon/IconPreviewPage.vue`

- [ ] Render iconfont class names from the existing management icon set in a responsive grid.
- [ ] Show the icon, its class name, and use the existing theme color for easy inspection.

### Task 3: Verification

**Files:**
- All modified frontend files

- [ ] Run `cd web && npm run type-check`.
