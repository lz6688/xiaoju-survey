<template>
  <div class="agent-page">
    <TopNav />
    <AgentManagePanel />
  </div>
</template>

<script setup lang="ts">
import TopNav from '@/management/components/TopNav.vue'
import AgentManagePanel from './components/AgentManagePanel.vue'
</script>

<style lang="scss" scoped>
.agent-page {
  min-height: 100vh;
  background: #f6f7f9;
}
</style>
