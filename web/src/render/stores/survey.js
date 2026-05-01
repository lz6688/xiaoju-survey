import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { defineStore } from 'pinia'
import { pick } from 'lodash-es'
import moment from 'moment'

import { isMobile as isInMobile } from '@/render/utils/index'

import { getEncryptInfo as getEncryptInfoApi } from '@/render/api/survey'
import { useQuestionStore } from '@/render/stores/question'
import { useErrorInfo } from '@/render/stores/errorInfo'

import adapter from '../adapter'
import { RuleMatch } from '@/common/logicEngine/RulesMatch'
/**
 * CODE_MAP不从management引入，在dev阶段，会导致B端 router被加载，进而导致C端路由被添加 baseUrl: /management
 */
const CODE_MAP = {
  SUCCESS: 200,
  ERROR: 500,
  NO_AUTH: 403
}

export const useSurveyStore = defineStore('survey', () => {
  // 问卷路径id
  const surveyPath = ref('')
  // 是否是手机
  const isMobile = ref(isInMobile())
  // 进入时间
  const enterTime = ref(0)
  // 加密信息
  const encryptInfo = ref(null)
  // 规则
  const rules = ref({})
  // 横幅通告
  const bannerConf = ref({})
  // 基础配置
  const baseConf = ref({})
  // 底部配置
  const bottomConf = ref({})
  // 数据配置
  const dataConf = ref({})
  // 皮肤配置
  const skinConf = ref({})
  // 提交确认配置
  const submitConf = ref({})
  // 表单数据
  const formValues = ref({})
  // 白名单数据
  const whiteData = ref({})
  // 页面配置
  const pageConf = ref([])

  // 路由
  const router = useRouter()
  // 使用问题库
  const questionStore = useQuestionStore()

  // 设置错误信息函数
  const { setErrorInfo } = useErrorInfo()

  // 设置白名单数据方法
  const setWhiteData = (data) => {
    whiteData.value = data
  }

  // 设置问卷路径id方法
  const setSurveyPath = (data) => {
    surveyPath.value = data
  }

  // 设置进入时间方法
  const setEnterTime = () => {
    enterTime.value = Date.now()
  }

  // 设置表单数据
  const setFormValues = (data) => {
    formValues.value = data
  }

  // 获取加密信息
  const getEncryptInfo = async () => {
    try {
      const res = await getEncryptInfoApi()
      if (res.code === CODE_MAP.SUCCESS) {
        encryptInfo.value = res.data
      }
    } catch (error) {
      console.log(error)
    }
  }

  // 是否可以填写问卷
  const canFillQuestionnaire = (baseConf, submitConf) => {
    const { beginTime, endTime, answerBegTime, answerEndTime } = baseConf
    const { msgContent } = submitConf
    const now = Date.now()
    let isSuccess = true

    if (now < new Date(beginTime).getTime()) {
      isSuccess = false
      setErrorInfo({
        errorType: 'overTime',
        errorMsg: `<p>问卷未到开始填写时间，暂时无法进行填写<p/>
                   <p>开始时间为: ${beginTime}</p>`
      })
    } else if (now > new Date(endTime).getTime()) {
      isSuccess = false
      setErrorInfo({
        errorType: 'overTime',
        errorMsg: msgContent.msg_9001 || '您来晚了，感谢支持问卷~'
      })
    } else if (answerBegTime && answerEndTime) {
      const momentNow = moment()
      const todayStr = momentNow.format('yyyy-MM-DD')
      const momentStartTime = moment(`${todayStr} ${answerBegTime}`)
      const momentEndTime = moment(`${todayStr} ${answerEndTime}`)
      if (momentNow.isBefore(momentStartTime) || momentNow.isAfter(momentEndTime)) {
        isSuccess = false
        setErrorInfo({
          errorType: 'overTime',
          errorMsg: `<p>不在答题时间范围内，暂时无法进行填写<p/>
                    <p>答题时间为: ${answerBegTime} ~ ${answerEndTime}</p>`
        })
      }
    }

    if (!isSuccess) {
      router.push({ name: 'errorPage' })
    }

    return isSuccess
  }
  // 加载空白页面
  function clearFormData(option) {
    // 根据初始的schema生成questionData, questionSeq, rules, formValues, 这四个字段
    const {
      questionData,
      questionSeq,
      rules: _rules,
      formValues: _formValues
    } = adapter.generateData(
      pick(option, [
        'bannerConf',
        'baseConf',
        'bottomConf',
        'dataConf',
        'skinConf',
        'submitConf',
        'whiteData',
        'pageConf'
      ])
    )

    questionStore.questionData = questionData
    questionStore.questionSeq = questionSeq

    // 将数据设置到state上
    rules.value = _rules
    bannerConf.value = option.bannerConf
    baseConf.value = option.baseConf
    bottomConf.value = option.bottomConf
    dataConf.value = option.dataConf
    skinConf.value = option.skinConf
    submitConf.value = option.submitConf
    formValues.value = _formValues
    whiteData.value = option.whiteData
    pageConf.value = option.pageConf

    questionStore.initOptionCountInfo()

  }

  // 初始化问卷
  const initSurvey = (option) => {
    setEnterTime()
    if (!canFillQuestionnaire(option.baseConf, option.submitConf)) {
      return
    }
    // 加载空白问卷
    clearFormData(option)
  }

  // 用户输入或者选择后，更新表单数据
  const changeData = (data) => {
    let { key, value } = data
    formValues.value[key] = value
    questionStore.setChangeField(key)
  }

  // 初始化逻辑引擎
  const showLogicEngine = ref()
  const initShowLogicEngine = (showLogicConf) => {
    showLogicEngine.value = new RuleMatch().fromJson(showLogicConf || [])
  }

  // 初始化跳转逻辑引擎
  const jumpLogicEngine = ref()
  const initJumpLogicEngine = (jumpLogicConf) => {
    jumpLogicEngine.value = new RuleMatch().fromJson(jumpLogicConf || [])
  }

  return {
    surveyPath,
    isMobile,
    enterTime,
    encryptInfo,
    rules,
    bannerConf,
    baseConf,
    bottomConf,
    dataConf,
    skinConf,
    submitConf,
    formValues,
    whiteData,
    pageConf,
    initSurvey,
    changeData,
    setWhiteData,
    setFormValues,
    setSurveyPath,
    setEnterTime,
    getEncryptInfo,
    showLogicEngine,
    initShowLogicEngine,
    jumpLogicEngine,
    initJumpLogicEngine
  }
})
