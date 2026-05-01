<template>
  <router-view></router-view>
</template>
<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPublishedSurveyInfo, getPreviewSchema } from '../api/survey'
import AlertDialog from '../components/AlertDialog.vue'
import { useSurveyStore } from '../stores/survey'
import useCommandComponent from '../hooks/useCommandComponent'

const route = useRoute()
const surveyStore = useSurveyStore()

// 用于声明在数据更改时调用的侦听回调
watch(
  () => route.query.t, // 第一个参数：监听的数据源（路由查询参数中的 t 字段）
  (t) => { // 第二个参数：回调函数，t 是当前最新的参数值
    // 用于强制刷新（可能是防止缓存或版本更新）
    if (t) location.reload() // URL带 ?t=xxx 参数时刷新页面 如果 t 存在（不为 null/undefined），刷新页面
  }
)

// 注册一个回调函数,在组件挂载完成后执行
onMounted(() => {
  const surveyId = route.params.surveyId
  surveyStore.setSurveyPath(surveyId)
  getDetail(surveyId as string)
})

// 加载数据
const loadData = (res: any, surveyPath: string) => {
  if (res.code === 200) {
    const data = res.data
    const {
      bannerConf,
      baseConf,
      bottomConf,
      dataConf,
      skinConf,
      submitConf,
      logicConf,
      pageConf
    } = data.code
    const questionData = {
      bannerConf,
      baseConf,
      bottomConf,
      dataConf,
      skinConf,
      submitConf,
      pageConf
    }

    if (!pageConf || pageConf?.length == 0) {
      questionData.pageConf = [dataConf.dataList.length]
    }

    document.title = data.title

    surveyStore.setSurveyPath(surveyPath)
    surveyStore.initSurvey(questionData) // 初始化问卷数据
    surveyStore.initShowLogicEngine(logicConf?.showLogicConf)  // 题目显示逻辑
    surveyStore.initJumpLogicEngine(logicConf?.jumpLogicConf)  // 页面跳转逻辑
  } else {
    throw new Error(res.errmsg)
  }
}

// 是否为对象id
function isObjectId(id: string) {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/
  return objectIdRegex.test(id)
}

// 获取详情
const getDetail = async (surveyPath: string) => {
  // 警告弹窗
  const alert = useCommandComponent(AlertDialog)
  try {
    if (isObjectId(surveyPath)) {
      const res: any = await getPreviewSchema({ surveyPath })
      loadData(res, surveyPath)
    } else {
      const res: any = await getPublishedSurveyInfo({ surveyPath })
      // checkStatus(res.data)
      loadData(res, surveyPath)
      surveyStore.getEncryptInfo()
    }
  } catch (error: any) {
    console.log(error)
    alert({ title: error.message || '获取问卷失败' })
  }
}
</script>
