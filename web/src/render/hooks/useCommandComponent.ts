import { createVNode, getCurrentInstance, render } from 'vue'
import type { AppContext, Component, ComponentPublicInstance, VNode } from 'vue'

export interface Options {
  visible?: boolean
  onClose?: () => void
  appendTo?: HTMLElement | string
  [key: string]: unknown
}

export interface CommandComponent {
  (options: Options): VNode
  close: () => void
}

const getAppendToElement = (props: Options): HTMLElement => {
  let appendTo: HTMLElement | null = document.body
  if (props.appendTo) {
    if (typeof props.appendTo === 'string') {
      appendTo = document.querySelector<HTMLElement>(props.appendTo)
    }
    if (props.appendTo instanceof HTMLElement) {
      appendTo = props.appendTo
    }
    if (!(appendTo instanceof HTMLElement)) {
      appendTo = document.body
    }
  }
  return appendTo
}

const initInstance = <T extends Component>(
  Component: T,
  props: Options,
  container: HTMLElement,
  appContext: AppContext | null = null
) => {
  const vNode = createVNode(Component, props)
  vNode.appContext = appContext
  // 渲染
  render(vNode, container)

  getAppendToElement(props).appendChild(container)
  return vNode
}

export const useCommandComponent = <T extends Component>(Component: T): CommandComponent => {
  // 保存应用上下文
  const appContext = getCurrentInstance()?.appContext
  if (appContext) {
    const currentProvides = (getCurrentInstance() as any)?.provides
    // 一个安全设置对象属性的方法 合并 provides，确保依赖注入能够正常工作
    Reflect.set(appContext, 'provides', { ...appContext.provides, ...currentProvides })
  }

  // 创建容器并定义关闭函数
  const container = document.createElement('div')

  const close = () => {
    render(null, container) // 卸载组件
    container.parentNode?.removeChild(container) // 从 DOM 移除容器
  }

  const CommandComponent = (options: Options): VNode => {
    // 确保 visible 属性存在（默认显示）
    if (!Reflect.has(options, 'visible')) {
      options.visible = true
    }

    // 处理关闭回调：确保组件关闭时自动清理
    if (typeof options.onClose !== 'function') {
      options.onClose = close
    } else {
      const originOnClose = options.onClose
      options.onClose = () => {
        originOnClose()
        close()
      }
    }

    // 创建组件实例并渲染
    const vNode = initInstance<T>(Component, options, container, appContext)

    // 将 options 中不在 props 里的属性直接挂载到组件实例上
    const vm = vNode.component?.proxy as ComponentPublicInstance<Options>

    for (const prop in options) {
      if (Reflect.has(options, prop) && !Reflect.has(vm.$props, prop)) {
        vm[prop as keyof ComponentPublicInstance] = options[prop]
      }
    }

    return vNode
  }

  CommandComponent.close = close

  return CommandComponent
}

export default useCommandComponent
