import { ApiProperty } from '@nestjs/swagger';
import Joi from 'joi';

export class CreateSurveyGroupDto {
  @ApiProperty({ description: '分组名称', required: true })
  name: string;

  @ApiProperty({ description: '父分组id', required: false })
  parentId?: string | null;

  static validate(data) {
    return Joi.object({
      name: Joi.string().required(),
      parentId: Joi.string().allow(null, ''),
    }).validate(data);
  }
}
