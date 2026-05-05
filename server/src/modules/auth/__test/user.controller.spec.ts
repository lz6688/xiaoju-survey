import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { GetUserListDto } from '../dto/getUserList.dto';
import { Authentication } from 'src/guards/authentication.guard';
import { HttpException } from 'src/exceptions/httpException';
import { EXCEPTION_CODE } from 'src/enums/exceptionCode';
import { User } from 'src/models/user.entity';
import { USER_ROLE, USER_STATUS } from 'src/enums/user';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            getUserListByUsername: jest.fn(),
            getAgentList: jest.fn(),
            createAgent: jest.fn(),
            updateAgentStatus: jest.fn(),
            deleteAgent: jest.fn(),
            updateActiveAudit: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(Authentication)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  describe('getUserList', () => {
    it('should return a list of users', async () => {
      const mockUserList = [
        { _id: '1', username: 'user1', role: USER_ROLE.AGENT },
        { _id: '2', username: 'user2', role: USER_ROLE.ADMIN },
      ];

      jest
        .spyOn(userService, 'getUserListByUsername')
        .mockResolvedValue(mockUserList as unknown as User[]);

      const queryInfo: GetUserListDto = {
        username: 'testuser',
        pageIndex: 1,
        pageSize: 10,
      };
      GetUserListDto.validate = jest
        .fn()
        .mockReturnValue({ value: queryInfo, error: null });

      const result = await userController.getUserList(queryInfo);

      expect(result).toEqual({
        code: 200,
        data: mockUserList.map((item) => ({
          userId: item._id,
          username: item.username,
          role: item.role,
        })),
      });
    });

    it('should throw an HttpException if validation fails', async () => {
      const queryInfo: GetUserListDto = {
        username: 'testuser',
        pageIndex: 1,
        pageSize: 10,
      };
      const validationError = new Error('Validation failed');

      GetUserListDto.validate = jest
        .fn()
        .mockReturnValue({ value: null, error: validationError });

      await expect(userController.getUserList(queryInfo)).rejects.toThrow(
        new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR),
      );
    });
  });

  describe('getUserInfo', () => {
    it('should return current user info with role', async () => {
      const userId = '60c72b2f9b1e8a5f4b123456';
      const result = await userController.getUserInfo({
        user: {
          _id: userId,
          username: 'agentUser',
          role: USER_ROLE.AGENT,
        },
      });

      expect(result).toEqual({
        code: 200,
        data: {
          userId,
          username: 'agentUser',
          role: USER_ROLE.AGENT,
        },
      });
    });
  });

  describe('agent management', () => {
    it('should create an agent account', async () => {
      const agentId = '60c72b2f9b1e8a5f4b123456';
      jest.spyOn(userService, 'createAgent').mockResolvedValue({
        _id: agentId,
        username: 'agentUser',
        role: USER_ROLE.AGENT,
      } as unknown as User);

      const result = await userController.createAgent({
        username: 'agentUser',
        password: 'agent123',
      }, {
        user: {
          role: USER_ROLE.ADMIN,
        },
      });

      expect(userService.createAgent).toHaveBeenCalledWith({
        username: 'agentUser',
        password: 'agent123',
      });
      expect(result).toEqual({
        code: 200,
        data: {
          userId: agentId,
          username: 'agentUser',
          role: USER_ROLE.AGENT,
        },
      });
    });

    it('should return agent account list', async () => {
      const agentId = '60c72b2f9b1e8a5f4b123456';
      const queryInfo: GetUserListDto = {
        username: '',
        pageIndex: 1,
        pageSize: 10,
      };
      GetUserListDto.validate = jest
        .fn()
        .mockReturnValue({ value: queryInfo, error: null });
      jest.spyOn(userService, 'getAgentList').mockResolvedValue([
        {
          _id: agentId,
          username: 'agentUser',
          role: USER_ROLE.AGENT,
          status: USER_STATUS.ACTIVE,
          lastLoginAt: new Date('2026-05-05T09:00:00.000Z'),
          lastLoginIp: '203.0.113.7',
          lastActiveAt: new Date('2026-05-05T09:30:00.000Z'),
          lastActiveIp: '203.0.113.8',
        } as unknown as User,
      ]);

      const result = await userController.getAgentList(queryInfo, {
        user: {
          role: USER_ROLE.ADMIN,
        },
      });

      expect(userService.getAgentList).toHaveBeenCalledWith({
        username: '',
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        code: 200,
        data: [
          {
            userId: agentId,
            username: 'agentUser',
            role: USER_ROLE.AGENT,
            status: USER_STATUS.ACTIVE,
            lastLoginAt: new Date('2026-05-05T09:00:00.000Z'),
            lastLoginIp: '203.0.113.7',
            lastActiveAt: new Date('2026-05-05T09:30:00.000Z'),
            lastActiveIp: '203.0.113.8',
          },
        ],
      });
    });

    it('should update agent status', async () => {
      jest.spyOn(userService, 'updateAgentStatus').mockResolvedValue(undefined);

      const result = await userController.updateAgentStatus(
        {
          userId: '60c72b2f9b1e8a5f4b123456',
          status: USER_STATUS.DISABLED,
        },
        {
          user: {
            role: USER_ROLE.ADMIN,
          },
        },
      );

      expect(userService.updateAgentStatus).toHaveBeenCalledWith({
        userId: '60c72b2f9b1e8a5f4b123456',
        status: USER_STATUS.DISABLED,
      });
      expect(result).toEqual({ code: 200 });
    });

    it('should delete agent account', async () => {
      jest.spyOn(userService, 'deleteAgent').mockResolvedValue(undefined);

      const result = await userController.deleteAgent(
        {
          userId: '60c72b2f9b1e8a5f4b123456',
        },
        {
          user: {
            role: USER_ROLE.ADMIN,
          },
        },
      );

      expect(userService.deleteAgent).toHaveBeenCalledWith({
        userId: '60c72b2f9b1e8a5f4b123456',
      });
      expect(result).toEqual({ code: 200 });
    });
  });
});
