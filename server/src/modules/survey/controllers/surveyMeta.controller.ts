import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  UseGuards,
  Request,
  SetMetadata,
} from '@nestjs/common';
import * as Joi from 'joi';
import moment from 'moment';
import { ApiTags } from '@nestjs/swagger';

import { SurveyMetaService } from '../services/surveyMeta.service';
import { WorkspaceService } from 'src/modules/workspace/services/workspace.service';

import { getFilter, getOrder } from 'src/utils/surveyUtil';
import { HttpException } from 'src/exceptions/httpException';
import { EXCEPTION_CODE } from 'src/enums/exceptionCode';
import { Authentication } from 'src/guards/authentication.guard';
import { Logger } from 'src/logger';
import { SurveyGuard } from 'src/guards/survey.guard';
import { SURVEY_PERMISSION } from 'src/enums/surveyPermission';
import { WorkspaceGuard } from 'src/guards/workspace.guard';
import { PERMISSION as WORKSPACE_PERMISSION } from 'src/enums/workspace';

import { GetSurveyListDto } from '../dto/getSurveyMetaList.dto';
import { CollaboratorService } from '../services/collaborator.service';
import { GROUP_STATE } from 'src/enums/surveyGroup';
import { USER_ROLE } from 'src/enums/user';
import { UserService } from 'src/modules/auth/services/user.service';

@ApiTags('survey')
@Controller('/api/survey')
export class SurveyMetaController {
  constructor(
    private readonly surveyMetaService: SurveyMetaService,
    private readonly logger: Logger,
    private readonly collaboratorService: CollaboratorService,
    private readonly workspaceService: WorkspaceService,
    private readonly userService: UserService,
  ) {}

  @Post('/updateMeta')
  @HttpCode(200)
  @UseGuards(SurveyGuard)
  @SetMetadata('surveyId', 'body.surveyId')
  @SetMetadata('surveyPermission', [SURVEY_PERMISSION.SURVEY_EDIT_MANAGE])
  @UseGuards(Authentication)
  async updateMeta(@Body() reqBody, @Request() req) {
    const { value, error } = Joi.object({
      title: Joi.string().required(),
      remark: Joi.string().allow(null, '').default(''),
      surveyId: Joi.string().required(),
      groupId: Joi.string().allow(null, ''),
    }).validate(reqBody, { allowUnknown: true });

    if (error) {
      this.logger.error(`updateMeta_parameter error: ${error.message}`);
      throw new HttpException('参数错误', EXCEPTION_CODE.PARAMETER_ERROR);
    }
    const survey = req.surveyMeta;
    await this.surveyMetaService.updateSurveyBaseInfo({
      survey,
      title: value.title,
      remark: value.remark,
      groupId: value.groupId && value.groupId !== '' ? value.groupId : null,
      operator: req.user.username,
      operatorId: req.user._id.toString(),
    });

    return {
      code: 200,
    };
  }

  @UseGuards(WorkspaceGuard)
  @SetMetadata('workspacePermissions', [WORKSPACE_PERMISSION.READ_SURVEY])
  @SetMetadata('workspaceId', { optional: true, key: 'query.workspaceId' })
  @UseGuards(Authentication)
  @Get('/getList')
  @HttpCode(200)
  async getList(
    @Query()
    queryInfo: GetSurveyListDto,
    @Request()
    req,
  ) {
    const { value, error } = GetSurveyListDto.validate(queryInfo);
    if (error) {
      this.logger.error(error.message);
      throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
    }
    const { curPage, pageSize, workspaceId, groupId, isRecycleBin } = value;
    let filter = {},
      order = {};
    if (value.filter) {
      try {
        filter = getFilter(JSON.parse(decodeURIComponent(value.filter)));
      } catch (error) {
        this.logger.error(error.message);
      }
    }
    if (value.order) {
      try {
        order = order = getOrder(JSON.parse(decodeURIComponent(value.order)));
      } catch (error) {
        this.logger.error(error.message);
      }
    }
    const userId = req.user._id.toString();
    let cooperationList = [];
    if (req.user.role === USER_ROLE.AGENT || groupId === GROUP_STATE.ALL) {
      cooperationList =
        await this.collaboratorService.getCollaboratorListByUserId({ userId });
    }
    if (isRecycleBin) {
      // 回收站查询当前用户协作的问卷
      cooperationList =
        await this.collaboratorService.getManageListByUserId({ userId });
    }
    const cooperSurveyIdMap = cooperationList.reduce((pre, cur) => {
      pre[cur.surveyId] = cur;
      return pre;
    }, {});
    const surveyIdList1 = cooperationList.map((item) => item.surveyId);
    let surveyIdList2 = []
    if (isRecycleBin) {
      // 回收站查询当前用户参与的空间下的回收站的问卷
      surveyIdList2 = (await this.workspaceService.getAllSurveyIdListByUserId(userId, isRecycleBin)).data.surveyIdList
    }
    const surveyIdList = [...new Set([...surveyIdList1, ...surveyIdList2])];
    const username = req.user.username;
    const data = await this.surveyMetaService.getSurveyMetaList({
      pageNum: curPage,
      pageSize: pageSize,
      userId,
      username,
      role: req.user.role,
      filter,
      order,
      workspaceId,
      groupId,
      surveyIdList,
      isRecycleBin,
    });
    const surveyIds = data.data.map((item) => item._id.toString());
    const collaboratorList = surveyIds.length
      ? await Promise.all(
          surveyIds.map((surveyId) =>
            this.collaboratorService.getSurveyCollaboratorList({ surveyId }),
          ),
        )
      : [];
    const collaboratorMap = collaboratorList.reduce((pre, cur, index) => {
      pre[surveyIds[index]] = cur;
      return pre;
    }, {});
    const collaboratorUserIds = collaboratorList.flat().map((item) => item.userId);
    const uniqueUserIds = [...new Set(collaboratorUserIds)];
    const userInfoList = uniqueUserIds.length
      ? await this.userService.getUserListByIds({ idList: uniqueUserIds })
      : [];
    const userInfoMap = userInfoList.reduce((pre, cur) => {
      pre[cur._id.toString()] = cur;
      return pre;
    }, {});
    const dataList = data.data.map((item) => {
      const fmt = 'YYYY-MM-DD HH:mm:ss';
      if (!item.surveyType) {
        item.surveyType = item.questionType || 'normal';
      }
      item.createdAt = moment(item.createdAt).format(fmt);
      if (item.curStatus) {
        item.curStatus.date = moment(item.curStatus.date).format(fmt);
      }
      if (item.subStatus) {
        item.subStatus.date = moment(item.subStatus.date).format(fmt);
      }
      item.updatedAt = moment(item.updatedAt).format(fmt);
      const surveyId = item._id.toString();
      if (cooperSurveyIdMap[surveyId]) {
        item.isCollaborated = true;
        item.currentPermissions = cooperSurveyIdMap[surveyId].permissions;
      } else {
        item.isCollaborated = false;
        item.currentPermissions = [];
      }
      const surveyCollaborators = collaboratorMap[surveyId] || [];
      const collaboratorAgents = surveyCollaborators
        .filter((collaborator) => userInfoMap[collaborator.userId]?.role === USER_ROLE.AGENT)
        .map((collaborator) => ({
          userId: collaborator.userId,
          username: userInfoMap[collaborator.userId]?.username || '',
        }));
      item.authorizedAgents = collaboratorAgents;
      item.currentUserId = userId;
      return item;
    })
    return {
      code: 200,
      data: {
        count: data.count,
        data: dataList,
      },
    };
  }

  @UseGuards(Authentication)
  @Post('/assignAgents')
  @HttpCode(200)
  async assignAgents(
    @Body()
    reqBody: {
      surveyId: string;
      agentIds: string[];
    },
    @Request() req,
  ) {
    const { value, error } = Joi.object({
      surveyId: Joi.string().required(),
      agentIds: Joi.array().items(Joi.string()).required(),
    }).validate(reqBody);

    if (error) {
      throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
    }

    if (req.user.role !== USER_ROLE.ADMIN) {
      throw new HttpException('没有权限', EXCEPTION_CODE.NO_PERMISSION);
    }

    await this.surveyMetaService.assignAgents({
      surveyId: value.surveyId,
      agentIds: value.agentIds,
      operator: req.user.username,
      operatorId: req.user._id.toString(),
    });

    return {
      code: 200,
    };
  }
}
