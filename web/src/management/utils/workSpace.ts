export interface ListItem {
  value: string
  label: string
}

export interface MenuItem {
  id: string
  name: string
  icon?: string
  total?: Number
  count?: Number
  parentId?: string | null
  children?: MenuItem[]
}

export type IGroup = {
  _id?: string
  name: string
  parentId?: string | null
}

export type IWorkspace = {
  _id?: string
  name: string
  description: string
  members: IMember[]
}

export type IMember = {
  userId: string
  username: string
  role: any
  accountRole?: AccountRole
  _id?: string
}

export interface SpaceDetail {
  _id?: string
  name: string
  currentUserId?: string
  description: string
  surveyTotal: number
  members: IMember[]
}

export type SpaceItem = Required<Omit<SpaceDetail, 'members'>> & {
  createdAt: string
  curStatus: { date: number; status: string }
  memberTotal: number
  currentUserRole: string
  owner: string
  ownerId: string
  surveyTotal: number
}

export interface ICollaborator {
  _id?: string
  userId: string
  username: string
  permissions: Array<number>
}

export type GroupItem = {
  _id: string
  name: string
  parentId?: string | null
  parentName?: string
  createdAt: string
  updatedAt?: string
  ownerId: string
  surveyTotal: number
}

export enum MenuType {
  PersonalGroup = 'personalGroup',
  SpaceGroup = 'spaceGroup',
  AgentManage = 'agentManage',
  RecycleBin = 'recycleBin'
}

export enum UserRole {
  Admin = 'admin',
  Member = 'user'
}

export enum AccountRole {
  Admin = 'admin',
  Agent = 'agent'
}

export enum GroupState {
  All = 'all',
  Not = 'unclassified'
}

// 定义角色标签映射对象
export const roleLabels: Record<UserRole, string> = {
  [UserRole.Admin]: '管理员',
  [UserRole.Member]: '成员'
}

export const accountRoleLabels: Record<AccountRole, string> = {
  [AccountRole.Admin]: '管理员',
  [AccountRole.Agent]: '代理'
}

export enum SurveyPermissions {
  EditManage = 'SURVEY_EDIT_MANAGE',
  DeliveryManage = 'SURVEY_DELIVERY_MANAGE',
  AuthManage = 'SURVEY_AUTH_MANAGE',
  ResponseManage = 'SURVEY_RESPONSE_MANAGE'
}
// 定义协作者权限标签映射对象
export const surveyPermissionsLabels: Record<SurveyPermissions, string> = {
  [SurveyPermissions.EditManage]: '问卷编辑',
  [SurveyPermissions.DeliveryManage]: '投放管理',
  [SurveyPermissions.AuthManage]: '授权管理',
  [SurveyPermissions.ResponseManage]: '数据查看'
}
