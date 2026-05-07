import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';

import { SurveyGroup } from 'src/models/surveyGroup.entity';
import { SurveyMeta } from 'src/models/surveyMeta.entity';
import { ObjectId } from 'mongodb';

@Injectable()
export class SurveyGroupService {
  constructor(
    @InjectRepository(SurveyGroup)
    private readonly surveyGroupRepository: MongoRepository<SurveyGroup>,
    @InjectRepository(SurveyMeta)
    private surveyMetaRepository: MongoRepository<SurveyMeta>,
  ) {}
  create(params: { name: string; ownerId: string; parentId?: string | null }) {
    const newGroup = this.surveyGroupRepository.create({
      ...params,
    });
    return this.surveyGroupRepository.save(newGroup);
  }

  async findAllByOwnerId(ownerId: string) {
    return this.surveyGroupRepository.find({
      where: { ownerId },
      order: {
        createdAt: -1,
      },
    });
  }

  private collectDescendantGroupIdsFromList(
    groupList: SurveyGroup[],
    groupId: string,
  ) {
    const groupIdSet = new Set(groupList.map((item) => item._id.toString()));

    if (!groupIdSet.has(groupId)) {
      return [];
    }

    const childrenMap = new Map<string | null, string[]>();

    groupList.forEach((item) => {
      const parentId = item.parentId || null;
      const currentId = item._id.toString();
      const children = childrenMap.get(parentId) || [];

      children.push(currentId);
      childrenMap.set(parentId, children);
    });

    const result = new Set<string>();
    const stack = [groupId];

    while (stack.length > 0) {
      const current = stack.pop();

      if (!current || result.has(current)) {
        continue;
      }

      result.add(current);
      const children = childrenMap.get(current) || [];
      stack.push(...children);
    }

    return Array.from(result);
  }

  async getGroupAndDescendantIds(ownerId: string, groupId: string) {
    const groupList = await this.findAllByOwnerId(ownerId);
    return this.collectDescendantGroupIdsFromList(groupList, groupId);
  }

  async hasChildren(ownerId: string, groupId: string) {
    const count = await this.surveyGroupRepository.count({
      where: {
        ownerId,
        parentId: groupId,
      },
    });

    return count > 0;
  }

  async isDescendantGroup(ownerId: string, groupId: string, targetParentId: string) {
    const groupList = await this.findAllByOwnerId(ownerId);
    const descendantIds = this.collectDescendantGroupIdsFromList(groupList, groupId);

    return descendantIds.includes(targetParentId);
  }

  async findAll(userId: string, name: string, skip: number, pageSize: number) {
    const [list, total] = await this.surveyGroupRepository.findAndCount({
      skip: skip,
      take: pageSize,
      where: name
        ? { name: { $regex: name, $options: 'i' }, ownerId: userId }
        : { ownerId: userId },
      order: {
        createdAt: -1,
      },
    });
    const allList = await this.findAllByOwnerId(userId);
    return {
      total,
      list,
      allList,
    };
  }

  async findOne(id: string) {
    return this.surveyGroupRepository.findOne({
      where: {
        _id: new ObjectId(id),
      },
    });
  }

  update(id: string, updatedFields: Partial<SurveyGroup>) {
    updatedFields.updatedAt = new Date();
    return this.surveyGroupRepository.update(id, updatedFields);
  }

  async remove(id: string) {
    const query = { groupId: id };
    const update = { $set: { groupId: null } };
    await this.surveyMetaRepository.updateMany(query, update);
    return this.surveyGroupRepository.delete(id);
  }
}
