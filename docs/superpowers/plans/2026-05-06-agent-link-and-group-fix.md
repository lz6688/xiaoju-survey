# Agent Link And Group Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复问卷分组筛选，给每个代理生成固定专属投放链接，并按代理链接隔离数据展示。

**Architecture:** 复用现有 `channel` 模型作为“代理专属链接”承载体，为每个代理-问卷维护唯一渠道。问卷列表与数据统计接口按角色分流，管理员看全量及代理来源，代理只看自己链接对应的数据。前端根据角色隐藏无关列并展示专属链接。

**Tech Stack:** NestJS, TypeORM(Mongo), Vue 3, Pinia, Element Plus, Jest, vue-tsc

---

### Task 1: 修复分组筛选

**Files:**
- Modify: `server/src/modules/survey/controllers/surveyMeta.controller.ts`
- Modify: `server/src/modules/survey/services/surveyMeta.service.ts`
- Test: `server/src/modules/survey/__test/surveyMeta.controller.spec.ts`
- Test: `server/src/modules/survey/__test/surveyMeta.service.spec.ts`

- [ ] 补失败测试，确保管理员点击具体分组时只返回该分组问卷。
- [ ] 跑测试确认失败。
- [ ] 实现最小修复并让测试转绿。

### Task 2: 代理固定专属链接

**Files:**
- Modify: `server/src/modules/channel/services/channel.service.ts`
- Modify: `server/src/modules/channel/controllers/channel.controller.ts`
- Modify: `web/src/management/pages/publish/PublishPage.vue`
- Modify: `web/src/management/pages/publish/ChannelPage.vue`
- Test: `server/src/modules/channel/__test/channel.service.spec.ts`

- [ ] 补失败测试，确保同一代理同一问卷只得到一个固定渠道。
- [ ] 跑测试确认失败。
- [ ] 实现后端生成/复用逻辑与前端专属链接展示。

### Task 3: 数据归属隔离

**Files:**
- Modify: `server/src/modules/survey/controllers/dataStatistic.controller.ts`
- Modify: `server/src/modules/survey/services/dataStatistic.service.ts`
- Modify: `server/src/modules/survey/__test/dataStatistic.controller.spec.ts`
- Modify: `server/src/modules/survey/__test/dataStatistic.service.spec.ts`
- Modify: `web/src/management/pages/analysis/pages/DataTablePage.vue`

- [ ] 补失败测试，确保管理员能看到来源代理，代理只看自己渠道的数据。
- [ ] 跑测试确认失败。
- [ ] 实现数据过滤和来源列输出。

### Task 4: 代理问卷列表列裁剪

**Files:**
- Modify: `web/src/management/pages/list/components/BaseList.vue`

- [ ] 代理端隐藏“已授权代理”列。
- [ ] 联动前面改动后跑 `npm run type-check`。
