export enum SURVEY_PERMISSION {
  SURVEY_EDIT_MANAGE = 'SURVEY_EDIT_MANAGE',
  SURVEY_DELIVERY_MANAGE = 'SURVEY_DELIVERY_MANAGE',
  SURVEY_CONF_MANAGE = 'SURVEY_CONF_MANAGE',
  SURVEY_AUTH_MANAGE = 'SURVEY_AUTH_MANAGE',
  SURVEY_RESPONSE_MANAGE = 'SURVEY_RESPONSE_MANAGE',
  SURVEY_COOPERATION_MANAGE = 'SURVEY_COOPERATION_MANAGE',
}

export const SURVEY_PERMISSION_DESCRIPTION = {
  surveyEditManage: {
    name: '问卷编辑',
    value: SURVEY_PERMISSION.SURVEY_EDIT_MANAGE,
  },
  surveyDeliveryManage: {
    name: '投放管理',
    value: SURVEY_PERMISSION.SURVEY_DELIVERY_MANAGE,
  },
  SURVEY_CONF_MANAGE: {
    name: '问卷配置管理(兼容旧权限)',
    value: SURVEY_PERMISSION.SURVEY_CONF_MANAGE,
  },
  surveyAuthManage: {
    name: '授权管理',
    value: SURVEY_PERMISSION.SURVEY_AUTH_MANAGE,
  },
  surveyResponseManage: {
    name: '数据查看',
    value: SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE,
  },
  surveyCooperatorManage: {
    name: '协作者管理(兼容旧权限)',
    value: SURVEY_PERMISSION.SURVEY_COOPERATION_MANAGE,
  },
};
