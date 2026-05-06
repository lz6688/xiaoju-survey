import axios from './base'

// 获取已发布的调查信息
export const getPublishedSurveyInfo = ({ surveyPath }) => {
  return axios.get('/responseSchema/getSchema', {
    params: {
      surveyPath
    }
  })
}

// 获取预览方案
export const getPreviewSchema = ({ surveyPath }) => {
  return axios.get('/survey/getPreviewSchema', {
    params: {
      surveyPath
    }
  })
}

// 提交表单
export const submitForm = (data) => {
  return axios.post('/surveyResponse/createResponse', data)
}

export const submitFormWithOpen = (data) => {
  return axios.post('/surveyResponse/createResponseWithOpen', data)
}

export const queryOptionCountInfo = ({ surveyPath, fieldList }) => {
  return axios.get('/counter/queryOptionCountInfo', {
    params: {
      surveyPath,
      fieldList
    }
  })
}

export const getEncryptInfo = () => {
  return axios.get('/clientEncrypt/getEncryptInfo')
}

export const validate = ({ surveyPath, password = '', whitelist = '' }) => {
  return axios.post(`/responseSchema/${surveyPath}/validate`, {
    password,
    whitelist
  })
}
