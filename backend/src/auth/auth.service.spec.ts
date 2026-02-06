import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user-role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed',
    role: UserRole.PARTICIPANT,
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      validatePassword: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user on valid credentials', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      usersService.validatePassword!.mockResolvedValue(true);
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      usersService.validatePassword!.mockResolvedValue(false);
      await expect(service.validateUser('test@example.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      await expect(service.validateUser('nonexistent@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return access_token and user', async () => {
      const result = await service.login(mockUser as any);
      expect(result).toEqual({
        access_token: 'token',
        user: {
          id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.PARTICIPANT,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: UserRole.PARTICIPANT,
      });
    });
  });

  describe('register', () => {
    it('should create user and return token', async () => {
      usersService.create!.mockResolvedValue(mockUser);
      const result = await service.register('test@example.com', 'Test', 'password');
      expect(usersService.create).toHaveBeenCalledWith(
        'test@example.com',
        'Test',
        'password',
        UserRole.PARTICIPANT,
      );
      expect(result.access_token).toBe('token');
    });
  });
});
