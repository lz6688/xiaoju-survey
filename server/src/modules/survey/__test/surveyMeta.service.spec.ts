import { Test, TestingModule } from '@nestjs/testing';
import { SurveyMetaService } from '../services/surveyMeta.service';
import { MongoRepository } from 'typeorm';
import { SurveyMeta } from 'src/models/surveyMeta.entity';
import { PluginManager } from 'src/securityPlugin/pluginManager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpException } from 'src/exceptions/httpException';
import { RECORD_STATUS, RECORD_SUB_STATUS } from 'src/enums';
import { ObjectId } from 'mongodb';
import { USER_ROLE } from 'src/enums/user';
import { GROUP_STATE } from 'src/enums/surveyGroup';
import { SurveyGroupService } from '../services/surveyGroup.service';

describe('SurveyMetaService', () => {
  let service: SurveyMetaService;
  let surveyRepository: MongoRepository<SurveyMeta>;
  let pluginManager: PluginManager;
  let surveyGroupService: SurveyGroupService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveyMetaService,
        {
          provide: getRepositoryToken(SurveyMeta),
          useValue: {
            findOne: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            updateOne: jest.fn(),
            findAndCount: jest.fn(),
            find: jest.fn(),
          },
        },
        PluginManager,
        {
          provide: SurveyGroupService,
          useValue: {
            getGroupAndDescendantIds: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<SurveyMetaService>(SurveyMetaService);
    surveyRepository = module.get<MongoRepository<SurveyMeta>>(
      getRepositoryToken(SurveyMeta),
    );
    pluginManager = module.get<PluginManager>(PluginManager);
    surveyGroupService = module.get<SurveyGroupService>(SurveyGroupService);
  });

  describe('getNewSurveyPath', () => {
    it('should generate a new survey path', async () => {
      jest.spyOn(pluginManager, 'triggerHook').mockResolvedValueOnce('path1');
      jest.spyOn(surveyRepository, 'count').mockResolvedValueOnce(0);

      const surveyPath = await service.getNewSurveyPath();

      expect(surveyPath).toBe('path1');
      expect(pluginManager.triggerHook).toHaveBeenCalledTimes(1);
      expect(surveyRepository.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('createSurveyMeta', () => {
    it('should create a new survey meta and return it', async () => {
      const params = {
        title: 'Test Survey',
        remark: 'This is a test survey',
        surveyType: 'normal',
        username: 'testUser',
        userId: new ObjectId().toString(),
        createMethod: '',
        createFrom: '',
        workspaceId: 'workspace1',
      };
      const newSurvey = new SurveyMeta();

      jest.spyOn(service, 'getNewSurveyPath').mockResolvedValue('path1');
      jest
        .spyOn(surveyRepository, 'create')
        .mockImplementation(() => newSurvey);
      jest.spyOn(surveyRepository, 'save').mockResolvedValue(newSurvey);

      const result = await service.createSurveyMeta(params);

      expect(surveyRepository.create).toHaveBeenCalledWith({
        title: params.title,
        remark: params.remark,
        surveyType: params.surveyType,
        surveyPath: 'path1',
        creator: params.username,
        creatorId: params.userId,
        owner: params.username,
        ownerId: params.userId,
        createMethod: params.createMethod,
        createFrom: params.createFrom,
        workspaceId: params.workspaceId,
        groupId: null,
        assignedAgentIds: [],
      });
      expect(surveyRepository.save).toHaveBeenCalledWith(newSurvey);
      expect(result).toEqual(newSurvey);
    });
  });

  describe('pausingSurveyMeta', () => {
    it('should throw an exception if survey is in NEW status', async () => {
      const survey = new SurveyMeta();
      survey.curStatus = { status: RECORD_STATUS.NEW, date: Date.now() };

      await expect(service.pausingSurveyMeta(survey)).rejects.toThrow(
        HttpException,
      );
    });

    it('should pause a survey and update subStatus', async () => {
      const survey = new SurveyMeta();
      survey.curStatus = { status: RECORD_STATUS.PUBLISHED, date: Date.now() };
      survey.statusList = [];

      jest.spyOn(surveyRepository, 'save').mockResolvedValue(survey);

      const result = await service.pausingSurveyMeta(survey);

      expect(survey.subStatus.status).toBe(RECORD_SUB_STATUS.PAUSING);
      expect(survey.statusList.length).toBe(1);
      expect(survey.statusList[0].status).toBe(RECORD_SUB_STATUS.PAUSING);
      expect(surveyRepository.save).toHaveBeenCalledWith(survey);
      expect(result).toEqual(survey);
    });
  });

  describe('editSurveyMeta', () => {
    it('should edit a survey meta and return it', async () => {
      const survey = new SurveyMeta();
      survey.curStatus = { status: RECORD_STATUS.PUBLISHED, date: Date.now() };
      survey.statusList = [];

      const operator = 'editor';
      const operatorId = 'editorId';

      jest.spyOn(surveyRepository, 'save').mockResolvedValue(survey);

      const result = await service.editSurveyMeta({
        survey,
        operator,
        operatorId,
      });

      expect(survey.curStatus.status).toBe(RECORD_STATUS.EDITING);
      expect(survey.statusList.length).toBe(1);
      expect(survey.statusList[0].status).toBe(RECORD_STATUS.EDITING);
      expect(survey.operator).toBe(operator);
      expect(survey.operatorId).toBe(operatorId);
      expect(surveyRepository.save).toHaveBeenCalledWith(survey);
      expect(result).toEqual(survey);
    });
  });

  describe('updateSurveyBaseInfo', () => {
    it('should update base info without changing published status', async () => {
      const survey = new SurveyMeta();
      const publishedAt = Date.now() - 1000;
      survey.title = '旧标题';
      survey.remark = '旧备注';
      survey.groupId = 'old-group';
      survey.curStatus = {
        status: RECORD_STATUS.PUBLISHED,
        date: publishedAt,
      };
      survey.statusList = [
        {
          status: RECORD_STATUS.PUBLISHED,
          date: publishedAt,
        },
      ];

      jest.spyOn(surveyRepository, 'save').mockResolvedValue(survey);

      const result = await service.updateSurveyBaseInfo({
        survey,
        title: '新标题',
        remark: '新备注',
        groupId: 'new-group',
        operator: 'editor',
        operatorId: 'editor-id',
      });

      expect(result.curStatus).toEqual({
        status: RECORD_STATUS.PUBLISHED,
        date: publishedAt,
      });
      expect(result.statusList).toEqual([
        {
          status: RECORD_STATUS.PUBLISHED,
          date: publishedAt,
        },
      ]);
      expect(result.title).toBe('新标题');
      expect(result.remark).toBe('新备注');
      expect(result.groupId).toBe('new-group');
      expect(result.operator).toBe('editor');
      expect(result.operatorId).toBe('editor-id');
      expect(surveyRepository.save).toHaveBeenCalledWith(survey);
    });
  });

  describe('deleteSurveyMeta', () => {
    it('should mark a survey as deleted', async () => {
      const surveyId = new ObjectId().toString();
      const operator = 'deleter';
      const operatorId = 'deleterId';

      jest.spyOn(surveyRepository, 'updateOne').mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
        acknowledged: true,
      });

      const result = await service.deleteSurveyMeta({
        surveyId,
        operator,
        operatorId,
      });

      expect(surveyRepository.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(surveyId) },
        {
          $set: {
            isDeleted: true,
            operator,
            operatorId,
            deletedAt: expect.any(Date),
          },
        },
      );
      expect(result.matchedCount).toBe(1);
    });
  });

  describe('recoverSurveyMeta', () => {
    it('should recover a survey', async () => {
      const surveyId = new ObjectId().toString();
      const operator = 'test';
      const operatorId = 'testId';

      jest.spyOn(surveyRepository, 'updateOne').mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
        acknowledged: true,
      });

      const result = await service.recoverSurveyMeta({
        surveyId,
        operator,
        operatorId,
      });

      expect(surveyRepository.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(surveyId) },
        {
          $set: {
            isDeleted: null,
            operator,
            operatorId,
            deletedAt: null,
          },
        },
      );
      expect(result.matchedCount).toBe(1);
    });
  });

  describe('completeDeleteSurveyMeta', () => {
    it('should complete delete a survey', async () => {
      const surveyId = new ObjectId().toString();
      const operator = 'test';
      const operatorId = 'testId';

      jest.spyOn(surveyRepository, 'updateOne').mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
        acknowledged: true,
      });

      const result = await service.completeDeleteSurveyMeta({
        surveyId,
        operator,
        operatorId,
      });

      expect(surveyRepository.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(surveyId) },
        {
          $set: {
            operator,
            operatorId,
            isCompleteDeleted: true,
          },
        },
      );
      expect(result.matchedCount).toBe(1);
    });
  });

  describe('getSurveyMetaList', () => {
    it('should return a list of survey metadata', async () => {
      const mockData = [
        { _id: 1, title: 'Survey 1' },
      ] as unknown as Array<SurveyMeta>;
      const mockCount = 1;

      jest
        .spyOn(surveyRepository, 'findAndCount')
        .mockResolvedValue([mockData, mockCount]);

      const condition = {
        pageNum: 1,
        pageSize: 10,
        userId: 'testUserId',
        username: 'testUser',
        filter: {},
        order: {},
      };

      const result = await service.getSurveyMetaList(condition);

      expect(result).toEqual({ data: mockData, count: mockCount });
      expect(surveyRepository.findAndCount).toHaveBeenCalledTimes(1);
    });

    it('should not restrict admin survey list by owner id', async () => {
      jest.spyOn(surveyRepository, 'findAndCount').mockResolvedValue([[], 0]);

      await service.getSurveyMetaList({
        pageNum: 1,
        pageSize: 10,
        userId: 'adminUserId',
        username: 'admin',
        role: USER_ROLE.ADMIN,
        filter: {},
        order: {},
      });

      expect(surveyRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            ownerId: 'adminUserId',
          }),
        }),
      );
    });

    it('should return empty result when agent has no authorized survey ids', async () => {
      const result = await service.getSurveyMetaList({
        pageNum: 1,
        pageSize: 10,
        userId: 'agentUserId',
        username: 'agent',
        role: USER_ROLE.AGENT,
        filter: {},
        order: {},
      });

      expect(result).toEqual({ data: [], count: 0 });
      expect(surveyRepository.findAndCount).not.toHaveBeenCalled();
    });

    it('should only query authorized survey ids for agent survey list', async () => {
      const surveyId = new ObjectId().toString();
      jest.spyOn(surveyRepository, 'findAndCount').mockResolvedValue([[], 0]);

      await service.getSurveyMetaList({
        pageNum: 1,
        pageSize: 10,
        userId: 'agentUserId',
        username: 'agent',
        role: USER_ROLE.AGENT,
        filter: {},
        order: {},
        surveyIdList: [surveyId],
      });

      expect(surveyRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isDeleted: { $ne: true },
            $or: [
              {
                _id: {
                  $in: [new ObjectId(surveyId)],
                },
                isDeleted: { $ne: true },
              },
            ],
          },
        }),
      );
    });

    it('should apply concrete groupId for admin personal surveys', async () => {
      jest
        .spyOn(surveyRepository, 'findAndCount')
        .mockResolvedValue([[], 0]);
      jest
        .spyOn(surveyGroupService, 'getGroupAndDescendantIds')
        .mockResolvedValue(['group-1', 'group-1-1']);

      await service.getSurveyMetaList({
        pageNum: 1,
        pageSize: 10,
        username: 'admin',
        userId: 'admin-user-id',
        role: USER_ROLE.ADMIN,
        filter: {},
        order: {},
        groupId: 'group-1',
      });

      expect(surveyRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            groupId: {
              $in: ['group-1', 'group-1-1'],
            },
            $and: [
              {
                workspaceId: { $exists: false },
              },
              {
                workspaceId: null,
              },
            ],
          }),
        }),
      );
    });

    it('should include descendant group ids in personal group count query', async () => {
      jest.spyOn(surveyRepository, 'count').mockResolvedValue(0);
      jest
        .spyOn(surveyGroupService, 'getGroupAndDescendantIds')
        .mockResolvedValue(['group-1', 'group-1-1']);

      await service.countSurveyMetaByGroupId({
        userId: 'admin-user-id',
        groupId: 'group-1',
      });

      expect(surveyRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: {
            $in: ['group-1', 'group-1-1'],
          },
        }),
      );
    });

    it('should map unclassified group to empty group query for admin personal surveys', async () => {
      jest
        .spyOn(surveyRepository, 'findAndCount')
        .mockResolvedValue([[], 0]);

      await service.getSurveyMetaList({
        pageNum: 1,
        pageSize: 10,
        username: 'admin',
        userId: 'admin-user-id',
        role: USER_ROLE.ADMIN,
        filter: {},
        order: {},
        groupId: GROUP_STATE.UNCLASSIFIED,
      });

      expect(surveyRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            $or: expect.arrayContaining([
              {
                groupId: {
                  $exists: false,
                },
              },
              {
                groupId: null,
              },
            ]),
            $and: [
              {
                workspaceId: { $exists: false },
              },
              {
                workspaceId: null,
              },
            ],
          }),
        }),
      );
    });
  });

  describe('assignAgents', () => {
    it('should assign agent ids to a survey', async () => {
      const surveyId = new ObjectId().toString();
      const agentIds = [new ObjectId().toString(), new ObjectId().toString()];

      jest.spyOn(surveyRepository, 'updateOne').mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
        acknowledged: true,
      });

      const result = await service.assignAgents({
        surveyId,
        agentIds,
        operator: 'admin',
        operatorId: 'adminUserId',
      });

      expect(surveyRepository.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(surveyId) },
        {
          $set: {
            assignedAgentIds: agentIds,
            operator: 'admin',
            operatorId: 'adminUserId',
            updatedAt: expect.any(Date),
          },
        },
      );
      expect(result.modifiedCount).toBe(1);
    });
  });

  describe('getSurveyMetaListByWorkspaceIdList', () => {
    it('should return a list of survey metadata by work space id', async () => {
      const mockData = [
        { _id: 1, title: 'Survey 1', workSpaceId: 'wk1', isDeleted: true, isCompleteDeleted: null },
      ] as unknown as Array<SurveyMeta>;

      jest
        .spyOn(surveyRepository, 'find')
        .mockResolvedValue(mockData);

        const workspaceIdList = ['wk1'];
        const isDeleted = true;

      const result = await service.getSurveyMetaListByWorkspaceIdList({workspaceIdList, isDeleted});

      expect(result).toEqual(mockData);
    });
  });

  describe('publishSurveyMeta', () => {
    it('should publish a survey and update curStatus', async () => {
      const surveyMeta = new SurveyMeta();
      surveyMeta.statusList = [];

      jest.spyOn(surveyRepository, 'save').mockResolvedValue(surveyMeta);

      const result = await service.publishSurveyMeta({ surveyMeta });

      expect(surveyMeta.curStatus.status).toBe(RECORD_STATUS.PUBLISHED);
      expect(surveyMeta.statusList.length).toBe(1);
      expect(surveyMeta.statusList[0].status).toBe(RECORD_STATUS.PUBLISHED);
      expect(surveyRepository.save).toHaveBeenCalledWith(surveyMeta);
      expect(result).toEqual(surveyMeta);
    });
  });

  describe('countSurveyMetaByWorkspaceId', () => {
    it('should return the count of surveys in a workspace', async () => {
      const workspaceId = 'workspace1';
      const mockCount = 5;

      jest.spyOn(surveyRepository, 'count').mockResolvedValue(mockCount);

      const result = await service.countSurveyMetaByWorkspaceId({
        workspaceId,
      });

      expect(result).toBe(mockCount);
      expect(surveyRepository.count).toHaveBeenCalledWith({
        workspaceId,
        isDeleted: { $ne: true },
      });
    });
  });
});
