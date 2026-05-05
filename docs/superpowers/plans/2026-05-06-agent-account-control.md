# Agent Account Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为管理端代理管理页增加代理封号、解封、删除能力，并在登录链路中拦截被封代理。

**Architecture:** 后端在 `user` 模型中增加账号状态字段，并通过管理员专用接口完成状态切换与删除。登录接口在密码校验后增加状态校验。前端在代理管理列表中展示状态并提供封号、解封、删除操作。

**Tech Stack:** NestJS, TypeORM(Mongo), Vue 3, Pinia, Element Plus, Jest, vue-tsc

---

### Task 1: 后端账号状态与管理接口

**Files:**
- Modify: `server/src/models/user.entity.ts`
- Modify: `server/src/modules/auth/services/user.service.ts`
- Modify: `server/src/modules/auth/controllers/user.controller.ts`
- Test: `server/src/modules/auth/__test/user.service.spec.ts`
- Test: `server/src/modules/auth/__test/user.controller.spec.ts`

- [ ] 写失败测试，覆盖代理状态展示、封号/解封、删除。
- [ ] 跑相关 `jest` 用例确认失败。
- [ ] 实现最小后端改动并让测试转绿。

### Task 2: 登录拦截被封代理

**Files:**
- Modify: `server/src/modules/auth/controllers/auth.controller.ts`
- Test: `server/src/modules/auth/__test/auth.controller.spec.ts`

- [ ] 写失败测试，覆盖被封代理登录报错。
- [ ] 跑相关 `jest` 用例确认失败。
- [ ] 实现登录拦截并让测试转绿。

### Task 3: 管理端代理管理操作

**Files:**
- Modify: `web/src/management/api/space.ts`
- Modify: `web/src/management/pages/agent/components/AgentManagePanel.vue`

- [ ] 在列表中展示代理状态。
- [ ] 增加封号/解封、删除按钮和确认交互。
- [ ] 完成操作后刷新列表，并跑 `npm run type-check`。
