import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { User } from 'src/models/user.entity';
import { HttpException } from 'src/exceptions/httpException';
import { EXCEPTION_CODE } from 'src/enums/exceptionCode';
import { hash256 } from 'src/utils/hash256';
import { ObjectId } from 'mongodb';
import { USER_ROLE, USER_STATUS } from 'src/enums/user';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: MongoRepository<User>,
  ) {}

  private normalizeUser<T extends User | null | undefined>(user: T): T {
    if (user) {
      if (!user.role) {
        user.role = USER_ROLE.AGENT;
      }
      if (!user.status) {
        user.status = USER_STATUS.ACTIVE;
      }
    }
    return user;
  }

  async createUser(userInfo: {
    username: string;
    password: string;
    role?: USER_ROLE;
  }): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { username: userInfo.username },
    });

    if (existingUser) {
      throw new HttpException('该用户已存在', EXCEPTION_CODE.USER_EXISTS);
    }

    const newUser = this.userRepository.create({
      username: userInfo.username,
      password: hash256(userInfo.password),
      role: userInfo.role || USER_ROLE.AGENT,
      status: USER_STATUS.ACTIVE,
    });

    return this.userRepository.save(newUser);
  }

  async createAgent(userInfo: {
    username: string;
    password: string;
  }): Promise<User> {
    return this.createUser({
      ...userInfo,
      role: USER_ROLE.AGENT,
    });
  }

  async ensureDefaultAdmin() {
    const adminUser = this.normalizeUser(
      await this.userRepository.findOne({
        where: { username: 'admin' },
      }),
    );

    if (!adminUser) {
      const newUser = this.userRepository.create({
        username: 'admin',
        password: hash256('admin'),
        role: USER_ROLE.ADMIN,
        status: USER_STATUS.ACTIVE,
      });
      return this.userRepository.save(newUser);
    }

    let shouldSave = false;
    if (adminUser.role !== USER_ROLE.ADMIN) {
      adminUser.role = USER_ROLE.ADMIN;
      shouldSave = true;
    }
    if (adminUser.status !== USER_STATUS.ACTIVE) {
      adminUser.status = USER_STATUS.ACTIVE;
      shouldSave = true;
    }
    if (shouldSave) {
      return this.userRepository.save(adminUser);
    }

    return adminUser;
  }

  async getUser(userInfo: {
    username: string;
    password: string;
  }): Promise<User | undefined> {
    const user = await this.userRepository.findOne({
      where: {
        username: userInfo.username,
        password: hash256(userInfo.password), // Please handle password hashing here
      },
    });

    return this.normalizeUser(user);
  }

  async getUserByUsername(username) {
    const user = await this.userRepository.findOne({
      where: {
        username: username,
      },
    });

    return this.normalizeUser(user);
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: {
        _id: new ObjectId(id),
      },
    });

    return this.normalizeUser(user);
  }

  async getUserListByUsername({ username, skip, take }) {
    const list = await this.userRepository.find({
      where: {
        username: new RegExp(username),
      },
      skip,
      take,
      select: ['_id', 'username', 'createdAt', 'role'],
    });
    return list.map((item) => this.normalizeUser(item));
  }

  async getAgentList({ username, skip, take }) {
    const where: Record<string, any> = {
      role: USER_ROLE.AGENT,
    };
    if (username) {
      where.username = new RegExp(username);
    }

    const list = await this.userRepository.find({
      where,
      skip,
      take,
      select: [
        '_id',
        'username',
        'createdAt',
        'role',
        'status',
        'lastLoginAt',
        'lastLoginIp',
        'lastActiveAt',
        'lastActiveIp',
      ],
      order: {
        createdAt: -1,
      },
    });
    return list.map((item) => this.normalizeUser(item));
  }

  async updateLoginAudit({
    userId,
    ip,
  }: {
    userId: string;
    ip: string;
  }) {
    const now = new Date();
    return this.userRepository.updateOne(
      {
        _id: new ObjectId(userId),
      },
      {
        $set: {
          lastLoginAt: now,
          lastLoginIp: ip,
          lastActiveAt: now,
          lastActiveIp: ip,
        },
      },
    );
  }

  async updateActiveAudit({
    userId,
    ip,
  }: {
    userId: string;
    ip: string;
  }) {
    return this.userRepository.updateOne(
      {
        _id: new ObjectId(userId),
      },
      {
        $set: {
          lastActiveAt: new Date(),
          lastActiveIp: ip,
        },
      },
    );
  }

  async getUserListByIds({ idList }) {
    const list = await this.userRepository.find({
      where: {
        _id: {
          $in: idList.map((item) => new ObjectId(item)),
        },
      },
      select: ['_id', 'username', 'createdAt', 'role'],
    });
    return list.map((item) => this.normalizeUser(item));
  }

  async updateAgentStatus({
    userId,
    status,
  }: {
    userId: string;
    status: USER_STATUS;
  }) {
    return this.userRepository.updateOne(
      {
        _id: new ObjectId(userId),
        role: USER_ROLE.AGENT,
      },
      {
        $set: {
          status,
        },
      },
    );
  }

  async deleteAgent({ userId }: { userId: string }) {
    return this.userRepository.deleteOne({
      _id: new ObjectId(userId),
      role: USER_ROLE.AGENT,
    });
  }

  async changePassword({
    userId,
    oldPassword,
    newPassword,
  }: {
    userId: string;
    oldPassword: string;
    newPassword: string;
  }) {
    const user = await this.userRepository.findOne({
      where: {
        _id: new ObjectId(userId),
      },
    });

    if (!user || user.password !== hash256(oldPassword)) {
      throw new HttpException(
        '用户名或密码错误',
        EXCEPTION_CODE.USER_PASSWORD_WRONG,
      );
    }

    user.password = hash256(newPassword);
    await this.userRepository.save(user);
  }
}
