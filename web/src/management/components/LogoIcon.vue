<template>
  <div class="navbar-main-logo" @click="handleNavigate">
    <img src="/imgs/s-logo.webp" />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/management/stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const homeRouteName = computed(() => (userStore.userInfo?.role === 'admin' ? 'survey' : 'agentSurvey'))

const handleNavigate = () => {
  router.push({ name: homeRouteName.value })
}
</script>
<style lang="scss" scoped>
.navbar-main-logo {
  width: 80px;
  height: 56px;
  display: flex;
  justify-content: center;
  align-items: center;

  :hover {
    cursor: pointer;
  }

  img {
    width: 32px;
  }
}
</style>
