import { Test, TestingModule } from '@nestjs/testing';
import { SurveyGroupService } from '../services/surveyGroup.service';
import { SurveyGroup } from 'src/models/surveyGroup.entity';
import { SurveyMeta } from 'src/models/surveyMeta.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('SurveyGroupService', () => {
  let service: SurveyGroupService;

  const mockSurveyGroupRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockSurveyMetaRepository = {
    updateMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveyGroupService,
        {
          provide: getRepositoryToken(SurveyGroup),
          useValue: mockSurveyGroupRepository,
        },
        {
          provide: getRepositoryToken(SurveyMeta),
          useValue: mockSurveyMetaRepository,
        },
      ],
    }).compile();

    service = module.get<SurveyGroupService>(SurveyGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a survey group', async () => {
      const createParams = { name: 'Test Group', ownerId: '123', parentId: null };
      const mockSavedGroup = { ...createParams, id: '1' };

      mockSurveyGroupRepository.create.mockReturnValue(mockSavedGroup);
      mockSurveyGroupRepository.save.mockResolvedValue(mockSavedGroup);

      expect(await service.create(createParams)).toEqual(mockSavedGroup);
      expect(mockSurveyGroupRepository.create).toHaveBeenCalledWith(
        createParams,
      );
      expect(mockSurveyGroupRepository.save).toHaveBeenCalledWith(
        mockSavedGroup,
      );
    });
  });

  describe('findAll', () => {
    it('should return survey groups', async () => {
      const list = [{ id: '1', name: 'Test Group', ownerId: '123', parentId: null }];
      const total = list.length;

      mockSurveyGroupRepository.findAndCount.mockResolvedValue([list, total]);
      mockSurveyGroupRepository.find.mockResolvedValue(list);

      const result = await service.findAll('123', '', 0, 10);
      expect(result).toEqual({ total, list, allList: list });
      expect(mockSurveyGroupRepository.findAndCount).toHaveBeenCalled();
      expect(mockSurveyGroupRepository.find).toHaveBeenCalled();
    });
  });

  describe('getGroupAndDescendantIds', () => {
    it('should collect current group and all descendants', async () => {
      const rootId = 'root-id';
      const childId = 'child-id';
      const grandChildId = 'grandchild-id';

      mockSurveyGroupRepository.find.mockResolvedValue([
        {
          _id: { toString: () => rootId },
          name: 'root',
          parentId: null,
        },
        {
          _id: { toString: () => childId },
          name: 'child',
          parentId: rootId,
        },
        {
          _id: { toString: () => grandChildId },
          name: 'grandchild',
          parentId: childId,
        },
      ]);

      await expect(service.getGroupAndDescendantIds('123', rootId)).resolves.toEqual([
        rootId,
        childId,
        grandChildId,
      ]);
    });
  });

  describe('hasChildren', () => {
    it('should return true when group has children', async () => {
      mockSurveyGroupRepository.count.mockResolvedValue(1);

      await expect(service.hasChildren('123', 'group-1')).resolves.toBe(true);
      expect(mockSurveyGroupRepository.count).toHaveBeenCalledWith({
        where: {
          ownerId: '123',
          parentId: 'group-1',
        },
      });
    });
  });

  describe('isDescendantGroup', () => {
    it('should return true when target parent is current descendant', async () => {
      const rootId = 'root-id';
      const childId = 'child-id';

      mockSurveyGroupRepository.find.mockResolvedValue([
        {
          _id: { toString: () => rootId },
          name: 'root',
          parentId: null,
        },
        {
          _id: { toString: () => childId },
          name: 'child',
          parentId: rootId,
        },
      ]);

      await expect(
        service.isDescendantGroup('123', rootId, childId),
      ).resolves.toBe(true);
    });
  });

  describe('update', () => {
    it('should update a survey group', async () => {
      const id = '1';
      const updatedFields = { name: 'Updated Test Group' };

      await service.update(id, updatedFields);
      expect(mockSurveyGroupRepository.update).toHaveBeenCalledWith(id, {
        ...updatedFields,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('remove', () => {
    it('should remove a survey group', async () => {
      const id = '1';
      await service.remove(id);
      expect(mockSurveyMetaRepository.updateMany).toHaveBeenCalledWith(
        { groupId: id },
        { $set: { groupId: null } },
      );
      expect(mockSurveyGroupRepository.delete).toHaveBeenCalledWith(id);
    });
  });
});
