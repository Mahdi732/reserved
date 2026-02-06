import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/entities/user.entity';
import { UserRole } from '../users/user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await this.usersService.validatePassword(user, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async login(user: UserDocument) {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(
    email: string,
    name: string,
    password: string,
    role: UserRole = UserRole.PARTICIPANT,
  ) {
    const user = await this.usersService.create(email, name, password, role);
    return this.login(user);
  }
}
