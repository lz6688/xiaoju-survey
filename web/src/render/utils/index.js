// 移动端设备检测函数,用于判断用户当前是否正在使用手机等移动设备访问页面
export function isMobile() {
  const userAgentInfo = navigator.userAgent
  const Agents = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod']
  let flag = false
  // User Agent 检测
  for (let v = 0; v < Agents.length; v++) {
    if (userAgentInfo.indexOf(Agents[v]) > 0) {
      flag = true
      break
    }
  }
  const w = document.body && document.body.clientWidth

  // 屏幕宽度检测
  if (w > 960) {
    return false
  } else if (w < 480) {
    return true
  } else {
    return flag
  }
}

// 对链接做一个兼容转换，支持用户不配置http开头或者配置 // 开头
export const formatLink = (url) => {
  url = url.trim()
  if (!url) {
    return url
  }
  if (url.startsWith('http') || url.startsWith('//')) {
    return url
  }
  return `http://${url}`
}
