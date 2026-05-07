import axios from './base'

// 创建空间
export const createSpace = ({ name, description, members }: any) => {
  return axios.post('/workspace', { name, description, members })
}

export const updateSpace = ({ workspaceId, name, description, members }: any) => {
  return axios.post(`/workspace/${workspaceId}`, { name, description, members })
}

// 获取空间列表
export const getSpaceList = (params: any) => {
  return axios.get('/workspace', {
    params
  })
}

export const getSpaceDetail = (workspaceId: string) => {
  return axios.get(`/workspace/${workspaceId}`)
}

export const getMemberList = () => {
  return axios.get('/workspace/member/list')
}

export const deleteSpace = (workspaceId: string) => {
  return axios.delete(`/workspace/${workspaceId}`)
}

export const getUserList = (username = '') => {
  return axios.get(`/user/getUserList`, {
    params: {
      username
    }
  })
}

export const getAgentList = (username = '') => {
  return axios.get(`/user/getAgentList`, {
    params: {
      username,
      pageIndex: 1,
      pageSize: 100
    }
  })
}

export const createAgent = ({ username, password }: any) => {
  return axios.post('/user/createAgent', {
    username,
    password
  })
}

export const updateAgentStatus = ({ userId, status }: { userId: string; status: 'active' | 'disabled' }) => {
  return axios.post('/user/updateAgentStatus', {
    userId,
    status
  })
}

export const deleteAgent = (userId: string) => {
  return axios.post('/user/deleteAgent', {
    userId
  })
}

// 获取协作权限下拉框枚举
export const getPermissionList = () => {
  return axios.get('collaborator/getPermissionList')
}

export const saveCollaborator = ({ surveyId, collaborators }: any) => {
  return axios.post('collaborator/batchSave', {
    surveyId,
    collaborators
  })
}

// 添加协作人
export const addCollaborator = ({ surveyId, userId, permissions }: any) => {
  return axios.post('collaborator', {
    surveyId,
    userId,
    permissions
  })
}
// 更新问卷协作信息
export const updateCollaborator = ({ surveyId, userId, permissions }: any) => {
  return axios.post('collaborator/changeUserPermission', {
    surveyId,
    userId,
    permissions
  })
}
// 获取问卷协作信息
export const getCollaborator = (surveyId: string) => {
  return axios.get(`collaborator`, {
    params: {
      surveyId
    }
  })
}
// 获取问卷协作权限
export const getCollaboratorPermissions = (surveyId: string) => {
  return axios.get(`collaborator/permissions`, {
    params: {
      surveyId
    }
  })
}

export const createGroup = ({ name, parentId }: any) => {
  return axios.post('surveyGroup', { name, parentId })
}

export const updateGroup = ({ _id, name, parentId }: any) => {
  return axios.post(`/surveyGroup/update`, { name, parentId, groupId: _id })
}

export const getGroupList = (params: any) => {
  return axios.get('/surveyGroup', {
    params
  })
}

export const deleteGroup = (id: string) => {
  return axios.post(`/surveyGroup/delete`, { groupId: id })
}

export const getRecycleBinCount = (params: any) => {
  return axios.get('/recycleBin', {
    params
  })
}
