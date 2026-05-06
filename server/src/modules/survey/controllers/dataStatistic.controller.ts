import {
  Controller,
  Get,
  Query,
  HttpCode,
  UseGuards,
  SetMetadata,
  Request,
} from '@nestjs/common';
import * as Joi from 'joi';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { DataStatisticService } from '../services/dataStatistic.service';
import { ResponseSchemaService } from '../../surveyResponse/services/responseScheme.service';

import { Authentication } from 'src/guards/authentication.guard';
import { PluginManager } from 'src/securityPlugin/pluginManager';
import { SurveyGuard } from 'src/guards/survey.guard';
import { SURVEY_PERMISSION } from 'src/enums/surveyPermission';
import { Logger } from 'src/logger';
import { HttpException } from 'src/exceptions/httpException';
import { EXCEPTION_CODE } from 'src/enums/exceptionCode';
import { AggregationStatisDto } from '../dto/aggregationStatis.dto';
import { handleAggretionData } from '../utils';
import { QUESTION_TYPE } from 'src/enums/question';
import { USER_ROLE } from 'src/enums/user';
import { UserService } from 'src/modules/auth/services/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Channel } from 'src/models/channel.entity';

@ApiTags('survey')
@ApiBearerAuth()
@Controller('/api/survey/dataStatistic')
export class DataStatisticController {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: MongoRepository<Channel>,
    private readonly responseSchemaService: ResponseSchemaService,
    private readonly dataStatisticService: DataStatisticService,
    private readonly userService: UserService,
    private readonly pluginManager: PluginManager,
    private readonly logger: Logger,
  ) {}

  @Get('/dataTable')
  @HttpCode(200)
  @UseGuards(SurveyGuard)
  @SetMetadata('surveyId', 'query.surveyId')
  @SetMetadata('surveyPermission', [SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE])
  @SetMetadata('agentAccess', true)
  @UseGuards(Authentication)
  async data(
    @Query()
    queryInfo,
    @Request() req,
  ) {
    const { value, error } = await Joi.object({
      surveyId: Joi.string().required(),
      isMasked: Joi.boolean().default(true), // 默认true就是需要脱敏
      page: Joi.number().default(1),
      pageSize: Joi.number().default(10),
    }).validate(queryInfo);
    if (error) {
      this.logger.error(error.message);
      throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
    }
    const { surveyId, isMasked, page, pageSize } = value;
    const responseSchema =
      await this.responseSchemaService.getResponseSchemaByPageId(surveyId);
    const { channelIds, channelMetaMap } =
      await this.getChannelAccessContext({
        surveyId,
        role: req.user?.role,
        currentUserId: req.user?._id?.toString(),
      });
    const { total, listHead, listBody } =
      await this.dataStatisticService.getDataTable({
        responseSchema,
        surveyId,
        pageNum: page,
        pageSize,
        role: req.user?.role,
        channelIds,
        channelMetaMap,
      });

    if (isMasked) {
      // 脱敏
      listBody.forEach((item) => {
        this.pluginManager.triggerHook('maskData', item);
      });
    }

    return {
      code: 200,
      data: {
        total,
        listHead,
        listBody,
      },
    };
  }

  @Get('/aggregationStatis')
  @HttpCode(200)
  @UseGuards(SurveyGuard)
  @SetMetadata('surveyId', 'query.surveyId')
  @SetMetadata('surveyPermission', [SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE])
  @SetMetadata('agentAccess', true)
  @UseGuards(Authentication)
  async aggregationStatis(@Query() queryInfo: AggregationStatisDto, @Request() req) {
    // 聚合统计
    const { value, error } = AggregationStatisDto.validate(queryInfo);
    if (error) {
      throw new HttpException('参数错误', EXCEPTION_CODE.PARAMETER_ERROR);
    }
    const responseSchema =
      await this.responseSchemaService.getResponseSchemaByPageId(
        value.surveyId,
      );
    if (!responseSchema) {
      return {
        code: 200,
        data: [],
      };
    }
    const allowQuestionType = [
      QUESTION_TYPE.RADIO,
      QUESTION_TYPE.CHECKBOX,
      QUESTION_TYPE.BINARY_CHOICE,
      QUESTION_TYPE.RADIO_STAR,
      QUESTION_TYPE.RADIO_NPS,
      QUESTION_TYPE.VOTE,
      QUESTION_TYPE.CASCADER,
    ];
    const fieldList = responseSchema.code.dataConf.dataList
      .filter((item) => allowQuestionType.includes(item.type as QUESTION_TYPE))
      .map((item) => item.field);
    const dataMap = responseSchema.code.dataConf.dataList.reduce((pre, cur) => {
      pre[cur.field] = cur;
      return pre;
    }, {});
    const { channelIds } = await this.getChannelAccessContext({
      surveyId: value.surveyId,
      role: req.user?.role,
      currentUserId: req.user?._id?.toString(),
    });
    const res = await this.dataStatisticService.aggregationStatis({
      surveyId: value.surveyId,
      fieldList,
      channelIds,
    });
    return {
      code: 200,
      data: res.map((item) => {
        return handleAggretionData({ item, dataMap });
      }),
    };
  }

  private async getChannelAccessContext({
    surveyId,
    role,
    currentUserId,
  }: {
    surveyId: string;
    role?: USER_ROLE;
    currentUserId?: string;
  }) {
    if (!surveyId) {
      return {
        channelIds: undefined,
        channelMetaMap: {},
      };
    }

    const ownerId = role === USER_ROLE.AGENT ? currentUserId : undefined;
    const channelList = await this.channelRepository.find({
      where: {
        surveyId,
        ...(ownerId ? { ownerId } : {}),
        isDeleted: {
          $ne: true,
        },
      },
      order: {
        _id: -1,
      },
      select: ['_id', 'name', 'ownerId', 'createdAt'],
    });
    const channelIds = channelList.map((item) => item._id.toString());

    if (role === USER_ROLE.AGENT) {
      return {
        channelIds,
        channelMetaMap: {},
      };
    }

    const ownerIds = [
      ...new Set(
        channelList
          .map((item) => item.ownerId)
          .filter((item) => typeof item === 'string' && item.length > 0),
      ),
    ];
    const userList = ownerIds.length
      ? await this.userService.getUserListByIds({ idList: ownerIds })
      : [];
    const userMap = userList.reduce((pre, cur) => {
      pre[cur._id.toString()] = cur;
      return pre;
    }, {});

    const channelMetaMap = channelList.reduce((pre, cur) => {
      const channelId = cur._id.toString();
      pre[channelId] = {
        channelName: cur.name || '',
        agentUsername:
          userMap[cur.ownerId]?.role === USER_ROLE.AGENT
            ? userMap[cur.ownerId]?.username || ''
            : '管理员',
      };
      return pre;
    }, {});

    return {
      channelIds: undefined,
      channelMetaMap,
    };
  }
}
