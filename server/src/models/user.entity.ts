import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { USER_ROLE, USER_STATUS } from 'src/enums/user';
@Entity({ name: 'user' })
export class User extends BaseEntity {
  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  role: USER_ROLE;

  @Column()
  status: USER_STATUS;

  @Column()
  lastLoginAt: Date;

  @Column()
  lastLoginIp: string;

  @Column()
  lastActiveAt: Date;

  @Column()
  lastActiveIp: string;
}
