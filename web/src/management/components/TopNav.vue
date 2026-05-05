<template>
  <div class="top-nav">
    <div class="left">
      <img class="logo-img" src="/imgs/Logo.webp" alt="logo" />
      <el-menu :default-active="activeMenu" class="el-menu-demo" mode="horizontal">
        <el-menu-item index="survey">
          <router-link :to="{ name: surveyRouteName }">问卷列表</router-link>
        </el-menu-item>
        <el-menu-item v-if="isAdmin" index="download">
          <router-link :to="{ name: 'download' }">下载中心</router-link>
        </el-menu-item>
      </el-menu>
    </div>
    <el-popover
      v-model:visible="showAccountPanel"
      placement="bottom-end"
      trigger="hover"
      :width="220"
      popper-class="account-popover"
    >
      <template #reference>
        <div class="login-info" @click="showAccountPanel = !showAccountPanel">
          <div class="welcome-block">
            <span class="welcome-label">您好</span>
            <span class="welcome-name">{{ userInfo?.username }}</span>
          </div>
          <img class="login-info-img" src="/imgs/avatar.webp" />
          <i class="iconfont icon-xiala trigger-arrow"></i>
        </div>
      </template>
      <div class="account-panel">
        <div class="account-summary">
          <img class="login-info-img" src="/imgs/avatar.webp" />
          <div>
            <div class="account-name">{{ userInfo?.username }}</div>
            <div class="account-role">{{ userRoleText }}</div>
          </div>
        </div>
        <div class="account-actions">
          <button class="action-button" type="button" @click="openPasswordDialog">修改密码</button>
          <button class="action-button action-button--danger" type="button" @click="handleLogout">
            退出登录
          </button>
        </div>
      </div>
    </el-popover>
  </div>
  <ChangePasswordDialog
    :visible="showPasswordDialog"
    @close="showPasswordDialog = false"
    @success="showPasswordDialog = false"
  />
</template>

<script setup lang="ts">
import { useUserStore } from '@/management/stores/user'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChangePasswordDialog from './ChangePasswordDialog.vue'
const router = useRouter()
const route = useRoute()

const userStore = useUserStore()
const showPasswordDialog = ref(false)
const showAccountPanel = ref(false)
const userInfo = computed(() => {
  return userStore.userInfo
})
const userRoleText = computed(() => {
  return userInfo.value?.role === 'admin' ? '管理员' : '代理'
})
const isAdmin = computed(() => userInfo.value?.role === 'admin')
const surveyRouteName = computed(() => (isAdmin.value ? 'survey' : 'agentSurvey'))
const activeMenu = computed(() => {
  if (route.name === 'download') {
    return 'download'
  }
  return 'survey'
})

const openPasswordDialog = () => {
  showAccountPanel.value = false
  showPasswordDialog.value = true
}

const handleLogout = () => {
  showAccountPanel.value = false
  userStore.logout()
  router.replace({ name: 'login' })
}
</script>

<style lang="scss" scoped>
.top-nav {
  background: #fff;
  color: #4a4c5b;
  padding: 0 20px;
  height: 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.04);
  .left {
    display: flex;
    align-items: center;
    width: calc(100% - 200px);
    .logo-img {
      width: 90px;
      height: fit-content;
      padding-right: 20px;
    }
    .el-menu {
      width: 100%;
      height: 56px;
      border: none !important;
      :deep(.el-menu-item, .is-active) {
        border: none !important;
      }
      .router-link-active {
        color: $primary-color;
      }
    }
  }
  .login-info {
    display: flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 8px;
    gap: 10px;
    transition: background-color 0.2s ease;

    &:hover {
      background: #f6f7f9;
    }

    .welcome-block {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      line-height: 1.2;
    }

    .welcome-label {
      color: #909399;
      font-size: 12px;
      cursor: pointer;
    }

    .welcome-name {
      color: #303133;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .login-info-img {
      height: 30px;
      margin-top: 0;
    }

    .trigger-arrow {
      color: #909399;
    }
  }
}

:global(.account-popover) {
  padding: 0 !important;
  border-radius: 12px !important;
}

.account-panel {
  padding: 14px;
}

.account-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;

  .login-info-img {
    height: 34px;
  }

  .account-name {
    font-size: 14px;
    color: #303133;
  }

  .account-role {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
  }
}

.account-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
}

.action-button {
  width: 100%;
  border: none;
  background: #f6f7f9;
  color: #303133;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
}

.action-button--danger {
  color: #e16b6b;
}
</style>
