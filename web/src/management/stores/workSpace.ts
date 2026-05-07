import { ref } from 'vue'
import { defineStore } from 'pinia'

import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/src/message.scss'

import { CODE_MAP } from '@/management/api/base'
import {
  createSpace,
  updateSpace as updateSpaceReq,
  deleteSpace as deleteSpaceReq,
  getSpaceList as getSpaceListReq,
  getSpaceDetail as getSpaceDetailReq,
  createGroup,
  getGroupList as getGroupListReq,
  updateGroup as updateGroupReq,
  deleteGroup as deleteGroupReq,
  getRecycleBinCount as getRecycleBinCountReq
} from '@/management/api/space'

import { GroupState, MenuType } from '@/management/utils/workSpace'
import {
  type SpaceDetail,
  type SpaceItem,
  type IWorkspace,
  type IGroup,
  type GroupItem,
  type MenuItem
} from '@/management/utils/workSpace'

import { useSurveyListStore } from './surveyList'

// 工作空间存储
export const useWorkSpaceStore = defineStore('workSpace', () => {
  const buildGroupMenuTree = (list: GroupItem[]) => {
    const nodeMap = new Map<string, MenuItem>()
    const rootList: MenuItem[] = []

    list.forEach((item) => {
      nodeMap.set(item._id, {
        id: item._id,
        name: item.name,
        total: item.surveyTotal,
        parentId: item.parentId || null,
        children: []
      })
    })

    list.forEach((item) => {
      const currentNode = nodeMap.get(item._id)

      if (!currentNode) {
        return
      }

      if (item.parentId && nodeMap.has(item.parentId)) {
        nodeMap.get(item.parentId)?.children?.push(currentNode)
      } else {
        rootList.push(currentNode)
      }
    })

    return rootList
  }

  const buildGroupOptionList = (list: GroupItem[]) => {
    const childrenMap = new Map<string | null, GroupItem[]>()
    const pathMap = new Map<string, string>()
    const optionList: IGroup[] = []

    list.forEach((item) => {
      const parentId = item.parentId || null
      const children = childrenMap.get(parentId) || []

      children.push(item)
      childrenMap.set(parentId, children)
    })

    const walk = (parentId: string | null, parentPath = '') => {
      const currentList = childrenMap.get(parentId) || []

      currentList.forEach((item) => {
        const label = parentPath ? `${parentPath} / ${item.name}` : item.name

        pathMap.set(item._id, label)
        optionList.push({
          _id: item._id,
          name: label,
          parentId: item.parentId || null
        })
        walk(item._id, label)
      })
    }

    walk(null)

    // 避免异常数据导致子分组完全丢失，在根路径之外补齐剩余节点。
    list.forEach((item) => {
      if (!pathMap.has(item._id)) {
        optionList.push({
          _id: item._id,
          name: item.name,
          parentId: item.parentId || null
        })
      }
    })

    return optionList
  }

  // list空间
  const spaceMenus = ref<MenuItem[]>([
    {
      icon: 'icon-wodekongjian',
      name: '我的空间',
      id: MenuType.PersonalGroup,
      children: []
    },
    {
      icon: 'icon-tuanduikongjian',
      name: '团队空间',
      id: MenuType.SpaceGroup,
      children: []
    },
    {
      icon: 'icon-bufenquanxian',
      name: '代理管理',
      id: MenuType.AgentManage,
      children: []
    },
    {
      icon: 'icon-huishouzhan',
      name: '回收站',
      id: MenuType.RecycleBin,
      count: 0,
      children: []
    }
  ])
  const menuType = ref(MenuType.PersonalGroup)
  const groupId = ref('')
  const workSpaceId = ref('')
  const spaceDetail = ref<SpaceDetail | null>(null)
  const workSpaceList = ref<SpaceItem[]>([])
  const workSpaceListTotal = ref(0)

  const surveyListStore = useSurveyListStore()

  // 获取空间列表
  async function getSpaceList(params = { curPage: 1 }) {
    try {
      const res: any = await getSpaceListReq(params)

      if (res.code === CODE_MAP.SUCCESS) {
        const { list, count } = res.data
        // 转换数组结构
        const workSpace = list.map((item: SpaceDetail) => {
          return {
            id: item._id,
            name: item.name,
            total: item.surveyTotal
          }
        })
        workSpaceList.value = list
        workSpaceListTotal.value = count
        spaceMenus.value[1].children = workSpace
      } else {
        ElMessage.error('getSpaceList' + res.errmsg)
      }
    } catch (err) {
      ElMessage.error('getSpaceList' + err)
    }
  }

  // 获取空间详情
  async function getSpaceDetail(id: string) {
    try {
      const _id = id || workSpaceId.value
      const res: any = await getSpaceDetailReq(_id)
      if (res.code === CODE_MAP.SUCCESS) {
        spaceDetail.value = res.data
      } else {
        ElMessage.error('getSpaceList' + res.errmsg)
      }
    } catch (err) {
      ElMessage.error('getSpaceList' + err)
    }
  }

  // 更改菜单类型
  function changeMenuType(id: MenuType) {
    menuType.value = id
  }

  // 更改空间
  function changeWorkSpace(id: string) {
    workSpaceId.value = id
    groupId.value = ''
    surveyListStore.resetSearch()
  }

  // 更改组
  function changeGroup(id: string) {
    groupId.value = id
    workSpaceId.value = ''
    surveyListStore.resetSearch()
  }

  async function deleteSpace(id: string) {
    try {
      const res: any = await deleteSpaceReq(id)

      if (res.code === CODE_MAP.SUCCESS) {
        ElMessage.success('删除成功')
      } else {
        ElMessage.error(res.errmsg)
      }
    } catch (err: any) {
      ElMessage.error(err)
    }
  }

  async function updateSpace(params: Required<IWorkspace>) {
    const { _id: workspaceId, name, description, members } = params
    const res: any = await updateSpaceReq({ workspaceId, name, description, members })

    if (res?.code === CODE_MAP.SUCCESS) {
      ElMessage.success('更新成功')
    } else {
      ElMessage.error(res?.errmsg)
    }
  }

  async function addSpace(params: IWorkspace) {
    const { name, description, members } = params
    const res: any = await createSpace({ name, description, members })

    if (res.code === CODE_MAP.SUCCESS) {
      ElMessage.success('添加成功')
    } else {
      ElMessage.error('createSpace  code err' + res.errmsg)
    }
  }

  function setSpaceDetail(data: null | SpaceDetail) {
    spaceDetail.value = data
  }

  // 分组
  const groupList = ref<GroupItem[]>([])
  const groupAllList = ref<IGroup[]>([])
  const groupRawList = ref<GroupItem[]>([])
  const groupListTotal = ref(0)
  const groupDetail = ref<GroupItem | null>(null)
  async function addGroup(params: IGroup) {
    const { name, parentId } = params
    const res: any = await createGroup({ name, parentId })

    if (res.code === CODE_MAP.SUCCESS) {
      ElMessage.success('添加成功')
    } else {
      ElMessage.error('createGroup  code err' + res.errmsg)
    }
  }

  async function updateGroup(params: Required<IGroup>) {
    const { _id, name, parentId } = params
    const res: any = await updateGroupReq({ _id, name, parentId })

    if (res?.code === CODE_MAP.SUCCESS) {
      ElMessage.success('更新成功')
    } else {
      ElMessage.error(res?.errmsg)
    }
  }

  async function getGroupList(params = { curPage: 1 }) {
    try {
      const res: any = await getGroupListReq(params)
      if (res.code === CODE_MAP.SUCCESS) {
        const { list, allList, total, unclassifiedSurveyTotal, allSurveyTotal } = res.data
        const groupTree = buildGroupMenuTree(allList)

        spaceMenus.value[0].children = [
          {
            id: GroupState.All,
            name: '全部',
            total: allSurveyTotal
          },
          {
            id: GroupState.Not,
            name: '未分组',
            total: unclassifiedSurveyTotal
          },
          ...groupTree
        ]
        groupList.value = list
        groupRawList.value = allList
        groupListTotal.value = total
        groupAllList.value = buildGroupOptionList(allList)
      } else {
        ElMessage.error('getGroupList' + res.errmsg)
      }
    } catch (err) {
      ElMessage.error('getGroupList' + err)
    }
  }

  function getGroupDescendantIds(id: string) {
    const childrenMap = new Map<string, string[]>()
    const descendants = new Set<string>()

    groupRawList.value.forEach((item) => {
      const parentId = item.parentId || ''
      const children = childrenMap.get(parentId) || []

      children.push(item._id)
      childrenMap.set(parentId, children)
    })

    const stack = [id]
    while (stack.length) {
      const currentId = stack.pop()

      if (!currentId || descendants.has(currentId)) {
        continue
      }

      descendants.add(currentId)
      stack.push(...(childrenMap.get(currentId) || []))
    }

    return Array.from(descendants)
  }

  function getGroupDetail(id: string) {
    try {
      const data = groupRawList.value.find((item: GroupItem) => item._id === id)
      if (data != undefined) {
        groupDetail.value = data
      } else {
        ElMessage.error('groupDetail 未找到分组')
      }
    } catch (err) {
      ElMessage.error('groupDetail' + err)
    }
  }

  function setGroupDetail(data: null | GroupItem) {
    groupDetail.value = data
  }

  async function deleteGroup(id: string) {
    try {
      const res: any = await deleteGroupReq(id)

      if (res.code === CODE_MAP.SUCCESS) {
        ElMessage.success('删除成功')
      } else {
        ElMessage.error(res.errmsg)
      }
    } catch (err: any) {
      ElMessage.error(err)
    }
  }

  // 获取回收站中的文件数量
  async function getRecycleBinCount(params?:  any) {
    const recycleBinMenu = spaceMenus.value.find(menu => menu.id === MenuType.RecycleBin);

    try {
      const res: any = await getRecycleBinCountReq(params)
      if (res.code === CODE_MAP.SUCCESS) {
        const { count } = res.data
        recycleBinMenu && (recycleBinMenu.count = count)
      } else {
        ElMessage.error('getRecycleBinCount' + res.errmsg)
      }
    } catch (err) {
      ElMessage.error('getRecycleBinCount' + err)
    }
  }

  return {
    menuType,
    spaceMenus,
    groupId,
    workSpaceId,
    spaceDetail,
    workSpaceList,
    workSpaceListTotal,
    getSpaceList,
    getSpaceDetail,
    changeMenuType,
    changeWorkSpace,
    changeGroup,
    addSpace,
    deleteSpace,
    updateSpace,
    setSpaceDetail,
    groupList,
    groupAllList,
    groupRawList,
    groupListTotal,
    groupDetail,
    addGroup,
    updateGroup,
    getGroupList,
    getGroupDescendantIds,
    getGroupDetail,
    setGroupDetail,
    deleteGroup,
    getRecycleBinCount: getRecycleBinCount
  }
})
