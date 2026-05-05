import axios from './base'

// 验证码api
export const refreshCaptcha = ({ captchaId }) => {
  return axios.post('/auth/captcha', { captchaId })
}
