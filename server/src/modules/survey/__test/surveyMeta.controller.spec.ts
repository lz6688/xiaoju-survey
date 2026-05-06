import { Test, TestingModule } from '@nestjs/testing';
import { SurveyMetaController } from '../controllers/surveyMeta.controller';
import { SurveyMetaService } from '../services/surveyMeta.service';
import { WorkspaceService } from 'src/modules/workspace/services/workspace.service';
import { Logger } from 'src/logger';
import { HttpException } from 'src/exceptions/httpException';
import { EXCEPTION_CODE } from 'src/enums/exceptionCode';
import { CollaboratorService } from '../services/collaborator.service';
import { UserService } from 'src/modules/auth/services/user.service';
import { ObjectId } from 'mongodb';
import { USER_ROLE } from 'src/enums/user';

jest.mock('src/guards/authentication.guard');
jest.mock('src/guards/survey.guard');
jest.mock('src/guards/workspace.guard');

describe('SurveyMetaController', () => {
  let controller: SurveyMetaController;
  let surveyMetaService: SurveyMetaService;
  let collaboratorService: CollaboratorService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SurveyMetaController],
      providers: [
        {
          provide: SurveyMetaService,
      useValue: {
        editSurveyMeta: jest.fn().mockResolvedValue(undefined),
        updateSurveyBaseInfo: jest.fn().mockResolvedValue(undefined),
        assignAgents: jest.fn().mockResolvedValue(undefined),
        getSurveyMetaList: jest
          .fn()
          .mockResolvedValue({ count: 0, data: [] }),
          },
        },
        {
          provide: Logger,
          useValue: {
            error() {},
          },
        },
        {
          provide: CollaboratorService,
          useValue: {
            getCollaboratorListByUserId: jest.fn().mockResolvedValue([]),
            getManageListByUserId: jest.fn().mockResolvedValue([]),
            getSurveyCollaboratorList: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: WorkspaceService,
          useValue: {
            getAllSurveyIdListByUserId: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: UserService,
          useValue: {
            getUserListByIds: jest.fn().mockResolvedValue([]),
          },
        }
      ],
    }).compile();

    controller = module.get<SurveyMetaController>(SurveyMetaController);
    surveyMetaService = module.get<SurveyMetaService>(SurveyMetaService);
    collaboratorService = module.get<CollaboratorService>(CollaboratorService);
    userService = module.get<UserService>(UserService);
  });

  it('should update survey meta', async () => {
    const reqBody = {
      remark: 'Test remark',
      title: 'Test title',
      surveyId: 'test-survey-id',
    };

    const survey = {
      title: '',
      remark: '',
    };

    const mockUser = {
      username: 'test-user',
      _id: new ObjectId(),
    };

    const req = {
      user: mockUser,
      surveyMeta: survey,
    };

    const result = await controller.updateMeta(reqBody, req);

    expect(surveyMetaService.updateSurveyBaseInfo).toHaveBeenCalledWith({
      title: reqBody.title,
      remark: reqBody.remark,
      groupId: null,
      operator: mockUser.username,
      operatorId: mockUser._id.toString(),
      survey,
    });

    expect(result).toEqual({ code: 200 });
  });

  it('should validate request body with Joi', async () => {
    const reqBody = {};
    const req = {
      user: {
        username: 'test-user',
      },
    };

    try {
      await controller.updateMeta(reqBody, req);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.code).toBe(EXCEPTION_CODE.PARAMETER_ERROR);
    }

    expect(surveyMetaService.updateSurveyBaseInfo).not.toHaveBeenCalled();
  });

  it('should get survey meta list', async () => {
    const queryInfo = {
      curPage: 1,
      pageSize: 10,
    };
    const userId = new ObjectId().toString();
    const req = {
      user: {
        username: 'test-user',
        _id: new ObjectId(userId),
      },
    };

    jest
      .spyOn(surveyMetaService, 'getSurveyMetaList')
      .mockImplementation(() => {
        const date = new Date().getTime();
        return Promise.resolve({
          count: 10,
      data: [
        {
          _id: new ObjectId(),
          createdAt: date,
          updatedAt: date,
          curStatus: {
            date: date,
          },
          subStatus: {
            date: date,
          },
          surveyType: 'normal',
          assignedAgentIds: [],
        },
      ],
    });
      });

    const result = await controller.getList(queryInfo, req);

    expect(result).toEqual({
      code: 200,
      data: {
        count: 10,
        data: expect.arrayContaining([
          expect.objectContaining({
            authorizedAgents: [],
            createdAt: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
            ),
            curStatus: expect.objectContaining({
              date: expect.stringMatching(
                /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
              ),
            }),
            subStatus: expect.objectContaining({
              date: expect.stringMatching(
                /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
              ),
            }),
            surveyType: 'normal',
          }),
        ]),
      },
    });

    expect(surveyMetaService.getSurveyMetaList).toHaveBeenCalledWith({
      pageNum: queryInfo.curPage,
      pageSize: queryInfo.pageSize,
      username: req.user.username,
      filter: {},
      order: {},
      surveyIdList: [],
      userId,
      workspaceId: undefined,
      role: undefined,
    });
  });

  it('should not include legacy assigned agents in authorized summaries', async () => {
    const surveyId = new ObjectId().toString();
    const agentId = new ObjectId().toString();
    const req = {
      user: {
        username: 'admin',
        _id: new ObjectId().toString(),
        role: USER_ROLE.ADMIN,
      },
    };
    jest.spyOn(surveyMetaService, 'getSurveyMetaList').mockResolvedValue({
      count: 1,
      data: [
        {
          _id: new ObjectId(surveyId),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          curStatus: { date: Date.now() },
          subStatus: { date: Date.now() },
          surveyType: 'normal',
          assignedAgentIds: [agentId],
        },
      ],
    });

    jest
      .spyOn(collaboratorService, 'getSurveyCollaboratorList')
      .mockResolvedValue([]);
    jest.spyOn(userService, 'getUserListByIds').mockResolvedValue([
      {
        _id: new ObjectId(agentId),
        username: 'agentA',
        role: USER_ROLE.AGENT,
      } as any,
    ]);

    const result = await controller.getList({ curPage: 1, pageSize: 10 }, req);

    expect(result.data.data[0]).toEqual(
      expect.objectContaining({
        authorizedAgents: [],
      }),
    );
  });

  it('should get survey meta list with filter and order', async () => {
    const queryInfo = {
      curPage: 1,
      pageSize: 10,
      filter: JSON.stringify([
        {
          comparator: '',
          condition: [{ field: 'title', value: 'hahah', comparator: '$regex' }],
        },
        {
          comparator: '',
          condition: [{ field: 'surveyType', value: 'normal' }],
        },
      ]),
      order: JSON.stringify([{ field: 'createdAt', value: -1 }]),
    };
    const userId = new ObjectId().toString();
    const req = {
      user: {
        username: 'test-user',
        _id: new ObjectId(userId),
      },
    };

    const result = await controller.getList(queryInfo, req);

    expect(result.code).toEqual(200);
    expect(surveyMetaService.getSurveyMetaList).toHaveBeenCalledWith({
      pageNum: queryInfo.curPage,
      pageSize: queryInfo.pageSize,
      username: req.user.username,
      surveyIdList: [],
      userId,
      filter: { surveyType: 'normal', title: { $regex: 'hahah' } },
      order: { createdAt: -1 },
      workspaceId: undefined,
      role: undefined,
    });
  });

  it('should pass admin role to survey meta list query', async () => {
    const queryInfo = {
      curPage: 1,
      pageSize: 10,
    };
    const userId = new ObjectId().toString();
    const req = {
      user: {
        username: 'admin',
        _id: new ObjectId(userId),
        role: USER_ROLE.ADMIN,
      },
    };

    await controller.getList(queryInfo, req);

    expect(surveyMetaService.getSurveyMetaList).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        username: 'admin',
        role: USER_ROLE.ADMIN,
      }),
    );
  });

  it('should only query authorized survey ids for agent list', async () => {
    const surveyId = new ObjectId().toString();
    const userId = new ObjectId().toString();
    const req = {
      user: {
        username: 'agentA',
        _id: new ObjectId(userId),
        role: USER_ROLE.AGENT,
      },
    };

    jest
      .spyOn(collaboratorService, 'getCollaboratorListByUserId')
      .mockResolvedValue([{ surveyId }] as any);

    await controller.getList({ curPage: 1, pageSize: 10 }, req);

    expect(collaboratorService.getCollaboratorListByUserId).toHaveBeenCalledWith({
      userId,
    });
    expect(surveyMetaService.getSurveyMetaList).toHaveBeenCalledWith(
      expect.objectContaining({
        role: USER_ROLE.AGENT,
        surveyIdList: [surveyId],
      }),
    );
  });

  it('should assign agents to a survey', async () => {
    const surveyId = new ObjectId().toString();
    const agentIds = [new ObjectId().toString()];
    const adminId = new ObjectId().toString();
    const req = {
      user: {
        username: 'admin',
        _id: new ObjectId(adminId),
        role: USER_ROLE.ADMIN,
      },
    };

    const result = await controller.assignAgents(
      {
        surveyId,
        agentIds,
      },
      req,
    );

    expect(surveyMetaService.assignAgents).toHaveBeenCalledWith({
      surveyId,
      agentIds,
      operator: 'admin',
      operatorId: adminId,
    });
    expect(result).toEqual({ code: 200 });
  });

  it('should handle Joi validation in getList', async () => {
    const invalidQueryInfo: any = {
      curPage: 'invalid',
      pageSize: 10,
    };
    const req = {
      user: {
        username: 'test-user',
        _id: new ObjectId(),
      },
    };

    try {
      await controller.getList(invalidQueryInfo, req);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.code).toBe(EXCEPTION_CODE.PARAMETER_ERROR);
    }
  });
});
