import {
  Controller,
  Get,
  Query,
  HttpCode,
  UseGuards,
  Request,
  Body,
  Post,
} from '@nestjs/common';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Authentication } from 'src/guards/authentication.guard';

import { EXCEPTION_CODE } from 'src/enums/exceptionCode';
import { HttpException } from 'src/exceptions/httpException';

import { UserService } from '../services/user.service';
import { GetUserListDto } from '../dto/getUserList.dto';
import { USER_ROLE, USER_STATUS } from 'src/enums/user';

@ApiTags('user')
@ApiBearerAuth()
@Controller('/api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  private ensureAdmin(req) {
    if (req.user?.role !== USER_ROLE.ADMIN) {
      throw new HttpException('没有权限', EXCEPTION_CODE.NO_PERMISSION);
    }
  }

  @UseGuards(Authentication)
  @Get('/getUserList')
  @HttpCode(200)
  async getUserList(
    @Query()
    queryInfo: GetUserListDto,
  ) {
    const { value, error } = GetUserListDto.validate(queryInfo);
    if (error) {
      throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
    }

    const userList = await this.userService.getUserListByUsername({
      username: value.username,
      skip: (value.pageIndex - 1) * value.pageSize,
      take: value.pageSize,
    });

    return {
      code: 200,
      data: userList.map((item) => {
        return {
          userId: item._id.toString(),
          username: item.username,
          role: item.role,
        };
      }),
    };
  }

  @UseGuards(Authentication)
  @Get('/getAgentList')
  @HttpCode(200)
  async getAgentList(
    @Query()
    queryInfo: GetUserListDto,
    @Request() req,
  ) {
    this.ensureAdmin(req);
    const { value, error } = GetUserListDto.validate(queryInfo);
    if (error) {
      throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
    }

    const userList = await this.userService.getAgentList({
      username: value.username,
      skip: (value.pageIndex - 1) * value.pageSize,
      take: value.pageSize,
    });

    return {
      code: 200,
      data: userList.map((item) => {
        return {
          userId: item._id.toString(),
          username: item.username,
          role: item.role,
          status: item.status,
          lastLoginAt: item.lastLoginAt,
          lastLoginIp: item.lastLoginIp,
          lastActiveAt: item.lastActiveAt,
          lastActiveIp: item.lastActiveIp,
        };
      }),
    };
  }

  @UseGuards(Authentication)
  @Post('/createAgent')
  @HttpCode(200)
  async createAgent(
    @Body()
    payload: {
      username: string;
      password: string;
    },
    @Request() req,
  ) {
    this.ensureAdmin(req);
    const user = await this.userService.createAgent(payload);
    return {
      code: 200,
      data: {
        userId: user._id.toString(),
        username: user.username,
        role: user.role,
      },
    };
  }

  @UseGuards(Authentication)
  @Post('/updateAgentStatus')
  @HttpCode(200)
  async updateAgentStatus(
    @Body()
    payload: {
      userId: string;
      status: USER_STATUS;
    },
    @Request() req,
  ) {
    this.ensureAdmin(req);
    if (
      !payload?.userId ||
      ![USER_STATUS.ACTIVE, USER_STATUS.DISABLED].includes(payload.status)
    ) {
      throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
    }
    await this.userService.updateAgentStatus(payload);
    return {
      code: 200,
    };
  }

  @UseGuards(Authentication)
  @Post('/deleteAgent')
  @HttpCode(200)
  async deleteAgent(
    @Body()
    payload: {
      userId: string;
    },
    @Request() req,
  ) {
    this.ensureAdmin(req);
    if (!payload?.userId) {
      throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
    }
    await this.userService.deleteAgent(payload);
    return {
      code: 200,
    };
  }

  @UseGuards(Authentication)
  @Get('/getUserInfo')
  async getUserInfo(@Request() req) {
    return {
      code: 200,
      data: {
        userId: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role,
      },
    };
  }
}
