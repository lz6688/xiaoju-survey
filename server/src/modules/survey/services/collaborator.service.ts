import { Injectable } from '@nestjs/common';
import { Collaborator } from 'src/models/collaborator.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Logger } from 'src/logger';
import { SURVEY_PERMISSION } from 'src/enums/surveyPermission';

@Injectable()
export class CollaboratorService {
  constructor(
    @InjectRepository(Collaborator)
    private readonly collaboratorRepository: MongoRepository<Collaborator>,
    private readonly logger: Logger,
  ) {}

  normalizePermissions(permissions: Array<string> = []) {
    const permissionSet = new Set<string>();

    for (const permission of permissions) {
      if (permission === SURVEY_PERMISSION.SURVEY_CONF_MANAGE) {
        permissionSet.add(SURVEY_PERMISSION.SURVEY_EDIT_MANAGE);
        permissionSet.add(SURVEY_PERMISSION.SURVEY_DELIVERY_MANAGE);
        continue;
      }
      if (permission === SURVEY_PERMISSION.SURVEY_COOPERATION_MANAGE) {
        permissionSet.add(SURVEY_PERMISSION.SURVEY_AUTH_MANAGE);
        continue;
      }
      permissionSet.add(permission);
    }

    return Array.from(permissionSet);
  }

  getDefaultAgentPermissions() {
    return [
      SURVEY_PERMISSION.SURVEY_DELIVERY_MANAGE,
      SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE,
    ];
  }

  async create({ surveyId, userId, permissions }) {
    const collaborator = this.collaboratorRepository.create({
      surveyId,
      userId,
      permissions: this.normalizePermissions(permissions),
    });
    return this.collaboratorRepository.save(collaborator);
  }

  async batchCreate({ surveyId, collaboratorList, creator, creatorId }) {
    const now = new Date();
    const res = await this.collaboratorRepository.insertMany(
      collaboratorList.map((item) => {
        return {
          ...item,
          permissions: this.normalizePermissions(item.permissions),
          surveyId,
          createdAt: now,
          updatedAt: now,
          creator,
          creatorId,
        };
      }),
    );
    return res;
  }

  async getSurveyCollaboratorList({ surveyId }) {
    const list = await this.collaboratorRepository.find({
      surveyId,
    });
    return list.map((item) => ({
      ...item,
      permissions: this.normalizePermissions(item.permissions),
    }));
  }

  async getCollaboratorListByIds({ idList }) {
    const list = await this.collaboratorRepository.find({
      _id: {
        $in: idList.map((item) => new ObjectId(item)),
      },
    });
    return list;
  }

  async getCollaborator({ userId, surveyId }) {
    const info = await this.collaboratorRepository.findOne({
      where: {
        surveyId,
        userId,
      },
    });
    if (!info) {
      return info;
    }

    info.permissions = this.normalizePermissions(info.permissions);
    return info;
  }

  async changeUserPermission({
    userId,
    surveyId,
    permissions,
    operator,
    operatorId,
  }) {
    const updateRes = await this.collaboratorRepository.updateOne(
      {
        surveyId,
        userId,
      },
      {
        $set: {
          permissions: this.normalizePermissions(permissions),
          operator,
          operatorId,
          updatedAt: new Date(),
        },
      },
    );
    return updateRes;
  }

  async deleteCollaborator({ userId, surveyId }) {
    const delRes = await this.collaboratorRepository.deleteOne({
      userId,
      surveyId,
    });
    return delRes;
  }

  async batchDelete({
    idList,
    neIdList,
    userIdList,
    surveyId,
  }: {
    idList?: Array<string>;
    neIdList?: Array<string>;
    userIdList?: Array<string>;
    surveyId: string;
  }) {
    const query: Record<string, any> = {
      surveyId,
      $or: [],
    };

    if (Array.isArray(userIdList) && userIdList.length > 0) {
      query.$or.push({
        userId: {
          $in: userIdList,
        },
      });
    }

    if (
      (Array.isArray(idList) && idList.length > 0) ||
      (Array.isArray(neIdList) && neIdList.length > 0)
    ) {
      const idQuery: Record<string, any> = {
        _id: {},
      };
      if (idList && idList.length > 0) {
        idQuery._id.$in = idList.map((item) => new ObjectId(item));
      }
      if (neIdList && neIdList.length > 0) {
        idQuery._id.$nin = neIdList.map((item) => new ObjectId(item));
      }
      query.$or.push(idQuery);
    }
    this.logger.info(JSON.stringify(query));
    const delRes = await this.collaboratorRepository.deleteMany(query);
    return delRes;
  }

  async batchDeleteBySurveyId(surveyId) {
    const delRes = await this.collaboratorRepository.deleteMany({
      surveyId,
    });
    return delRes;
  }

  updateById({ collaboratorId, permissions, operator, operatorId }) {
    return this.collaboratorRepository.updateOne(
      {
        _id: new ObjectId(collaboratorId),
      },
      {
        $set: {
          permissions: this.normalizePermissions(permissions),
          operator,
          operatorId,
          updatedAt: new Date(),
        },
      },
    );
  }

  getCollaboratorListByUserId({ userId }) {
    return this.collaboratorRepository.find({
      where: {
        userId,
      },
    }).then((list) =>
      list.map((item) => ({
        ...item,
        permissions: this.normalizePermissions(item.permissions),
      })),
    );
  }

  getManageListByUserId({ userId }) {
    return this.collaboratorRepository.find({
      where: {
        userId,
        permissions: {
          $elemMatch: {
            $in: [
              SURVEY_PERMISSION.SURVEY_COOPERATION_MANAGE,
              SURVEY_PERMISSION.SURVEY_AUTH_MANAGE,
            ],
          },
        },
      },
    }).then((list) =>
      list.map((item) => ({
        ...item,
        permissions: this.normalizePermissions(item.permissions),
      })),
    );
  }
}
