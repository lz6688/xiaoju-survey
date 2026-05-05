import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { USER_ROLE } from 'src/enums/user';
@Entity({ name: 'user' })
export class User extends BaseEntity {
  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  role: USER_ROLE;

  @Column()
  lastLoginAt: Date;

  @Column()
  lastLoginIp: string;

  @Column()
  lastActiveAt: Date;

  @Column()
  lastActiveIp: string;
}
