import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type NavigationGuardNext
} from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { SurveyPermissions } from '@/management/utils/workSpace'
import { analysisTypeMap } from '@/management/config/analysisConfig'
import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/src/message.scss'
import 'element-plus/theme-chalk/src/message-box.scss'
import 'element-plus/theme-chalk/src/button.scss'
import 'element-plus/theme-chalk/src/overlay.scss'
import { useUserStore } from '@/management/stores/user'
import { useEditStore } from '@/management/stores/edit'

// 定义路由规则
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/survey'
  },
  {
    path: '/survey',
    name: 'survey',
    component: () => import('../pages/list/index.vue'),
    meta: {
      needLogin: true,
      allowRoles: ['admin'],
      title: '问卷列表'
    }
  },
  {
    path: '/agent/survey',
    name: 'agentSurvey',
    component: () => import('../pages/list/index.vue'),
    meta: {
      needLogin: true,
      allowRoles: ['agent'],
      title: '我的问卷'
    }
  },
  {
    path: '/download',
    name: 'download',
    component: () => import('../pages/download/DownloadPage.vue'),
    meta: {
      needLogin: true,
      allowRoles: ['admin']
    }
  },
  {
    path: '/survey/:id/edit',
    meta: {
      needLogin: true,
      allowRoles: ['admin'],
      permissions: [SurveyPermissions.EditManage]
    },
    name: 'QuestionEdit',
    component: () => import('../pages/edit/index.vue'),
    children: [
      {
        path: '',
        meta: {
          needLogin: true
        },
        name: 'QuestionEditPage',
        component: () => import('../pages/edit/pages/edit/index.vue'),
        children: [
          {
            path: '',
            name: 'QuestionEditIndex',
            meta: {
              needLogin: true
            },
            component: () => import('../pages/edit/pages/edit/QuestionEditPage.vue')
          },
          {
            path: 'logic',
            name: 'LogicIndex',
            meta: {
              needLogin: true
            },
            component: () => import('../pages/edit/pages/edit/LogicIndex.vue'),
            props: (route) => ({ active: route.query.active })
          }
        ]
      },
      {
        path: 'setting',
        name: 'QuestionEditSetting',
        meta: {
          needLogin: true
        },
        component: () => import('../pages/edit/pages/setting/index.vue')
      },
      {
        path: 'skin',
        meta: {
          needLogin: true
        },
        component: () => import('../pages/edit/pages/skin/index.vue'),
        children: [
          {
            path: '',
            name: 'QuestionSkinSetting',
            meta: {
              needLogin: true
            },
            component: () => import('../pages/edit/pages/skin/ContentPage.vue')
          },
          {
            path: 'result',
            name: 'QuestionEditResultConfig',
            meta: {
              needLogin: true
            },
            component: () => import('../pages/edit/pages/skin/ResultPage.vue')
          }
        ]
      }
    ]
  },
  {
    path: '/survey/:id/analysis',
    name: 'analysisPage',
    redirect: {
      name: analysisTypeMap.dataTable
    },
    meta: {
      needLogin: true,
      allowRoles: ['admin', 'agent'],
      permissions: [SurveyPermissions.ResponseManage]
    },
    component: () => import('../pages/analysis/AnalysisPage.vue'),
    children: [
      {
        path: analysisTypeMap.dataTable,
        name: analysisTypeMap.dataTable,
        meta: {
          needLogin: true,
          premissions: [SurveyPermissions.ResponseManage]
        },
        component: () => import('../pages/analysis/pages/DataTablePage.vue')
      },
      {
        path: analysisTypeMap.separateStatistics,
        name: analysisTypeMap.separateStatistics,
        meta: {
          needLogin: true,
          premissions: [SurveyPermissions.ResponseManage]
        },
        component: () => import('../pages/analysis/pages/SeparateStatisticsPage.vue')
      }
    ]
  },
  {
    path: '/survey/:id/publish',
    name: 'publish',
    meta: {
      needLogin: true,
      allowRoles: ['admin', 'agent'],
      permissions: [SurveyPermissions.DeliveryManage]
    },
    component: () => import('../pages/publish/PublishPage.vue')
  },
  {
    path: '/survey/:id/channel',
    name: 'channel',
    meta: {
      needLogin: true,
      allowRoles: ['admin', 'agent'],
      permissions: [SurveyPermissions.DeliveryManage]
    },
    component: () => import('../pages/publish/ChannelPage.vue')
  },
  {
    path: '/create',
    name: 'create',
    meta: {
      needLogin: true,
      allowRoles: ['admin'],
      title: '创建问卷'
    },
    component: () => import('../pages/create/CreatePage.vue')
  },
  {
    path: '/agents',
    name: 'agents',
    meta: {
      needLogin: true,
      allowRoles: ['admin'],
      title: '代理管理'
    },
    component: () => import('../pages/agent/AgentPage.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/login/LoginPage.vue'),
    meta: {
      title: '登录'
    }
  }
]

// 创建路由
const router = createRouter({
  history: createWebHistory('/management'),
  routes
})


// 路由跳转之前
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  // 初始化用户信息
  if (!userStore?.initialized) {
    await userStore.init()
  }
  // 更新页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  if (to.meta.needLogin) {
    await handleLoginGuard(to, from, next)
  } else {
    next()
  }
})

// 处理登录防护机制
async function handleLoginGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const userStore = useUserStore()
  if (userStore?.hasLogin) {
    const role = userStore.userInfo?.role || 'agent'
    const allowRoles = to.meta.allowRoles as string[] | undefined
    if (allowRoles && !allowRoles.includes(role)) {
      next({
        name: role === 'admin' ? 'survey' : 'agentSurvey'
      })
      return
    }
    await handlePermissionsGuard(to, from, next)
  } else {
    next({
      name: 'login',
      query: { redirect: encodeURIComponent(to.path) }
    })
  }
}


// 处理权限机制
async function handlePermissionsGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const userStore = useUserStore()
  const role = userStore.userInfo?.role || 'agent'
  const editStore = useEditStore()
  const currSurveyId = to?.params?.id || ''
  const prevSurveyId = from?.params?.id || ''
  // 如果跳转页面不存在surveyId 或者不需要页面权限，则直接跳转
  if (!to.meta.permissions || !currSurveyId) {
    next()
  } else if (role === 'admin' || role === 'agent') {
    next()
  } else {
    // 如果跳转编辑页面，且跳转页面和上一页的surveyId不同，判断是否有对应页面权限
    if (currSurveyId !== prevSurveyId) {
      const cooperPermissions = await editStore.fetchCooperPermissions(currSurveyId as string)
      if (hasRequiredPermissions(to.meta.permissions as string[], cooperPermissions)) {
        next()
      } else {
        ElMessage.warning('您没有该问卷的相关授权权限')
        next({ name: role === 'admin' ? 'survey' : 'agentSurvey' })
      }
    } else {
      next()
    }
  }
}

// 处理请求权限
function hasRequiredPermissions(requiredPermissions: string[], userPermissions: string[]) {
  return requiredPermissions.some((permission) => userPermissions.includes(permission))
}

export default router
