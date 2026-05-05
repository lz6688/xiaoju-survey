import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';

import { ChannelService } from '../services/channel.service';
import { Channel } from 'src/models/channel.entity';
import { CHANNEL_STATUS } from 'src/enums/channel';

describe('ChannelService', () => {
  let service: ChannelService;
  let channelRepository: MongoRepository<Channel>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelService,
        {
          provide: getRepositoryToken(Channel),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            update: jest.fn(),
            updateOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChannelService>(ChannelService);
    channelRepository = module.get<MongoRepository<Channel>>(
      getRepositoryToken(Channel),
    );
  });

  it('should filter survey channels by owner when owner id is provided', async () => {
    jest.spyOn(channelRepository, 'find').mockResolvedValue([]);

    await service.findAllBySurveyId('surveyId', 'agentUserId');

    expect(channelRepository.find).toHaveBeenCalledWith({
      where: {
        surveyId: 'surveyId',
        ownerId: 'agentUserId',
        isDeleted: {
          $ne: true,
        },
      },
      order: {
        _id: -1,
      },
      select: ['_id', 'status', 'name', 'ownerId', 'createdAt'],
    });
  });

  it('should update only owned channels when owner id is provided', async () => {
    const channelId = new ObjectId().toString();
    jest.spyOn(channelRepository, 'update').mockResolvedValue(undefined);

    await service.update({
      id: channelId,
      channel: { name: 'new name' },
      operatorId: 'agentUserId',
      ownerId: 'agentUserId',
    });

    expect(channelRepository.update).toHaveBeenCalledWith(
      {
        _id: new ObjectId(channelId),
        ownerId: 'agentUserId',
      },
      {
        name: 'new name',
        operatorId: 'agentUserId',
        updatedAt: expect.any(Date),
      },
    );
  });

  it('should delete only owned channels when owner id is provided', async () => {
    const channelId = new ObjectId().toString();
    jest.spyOn(channelRepository, 'updateOne').mockResolvedValue({
      modifiedCount: 1,
    } as any);

    await service.delete(channelId, {
      operatorId: 'agentUserId',
      ownerId: 'agentUserId',
    });

    expect(channelRepository.updateOne).toHaveBeenCalledWith(
      {
        _id: new ObjectId(channelId),
        ownerId: 'agentUserId',
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: expect.any(Date),
          operatorId: 'agentUserId',
        },
      },
    );
  });

  it('should preserve status update logic for owned channels', async () => {
    const channelId = new ObjectId().toString();
    const channel = {
      _id: new ObjectId(channelId),
      ownerId: 'agentUserId',
      status: CHANNEL_STATUS.RECYCLING,
    } as unknown as Channel;

    jest.spyOn(channelRepository, 'findOne').mockResolvedValue(channel);
    jest.spyOn(channelRepository, 'save').mockResolvedValue({
      ...channel,
      status: CHANNEL_STATUS.PAUSE,
    } as Channel);

    await service.updateStatus({
      id: channelId,
      status: CHANNEL_STATUS.PAUSE,
      operatorId: 'agentUserId',
      ownerId: 'agentUserId',
    });

    expect(channelRepository.findOne).toHaveBeenCalledWith({
      where: {
        ownerId: 'agentUserId',
        _id: new ObjectId(channelId),
        isDeleted: {
          $ne: true,
        },
      },
    });
  });
});
