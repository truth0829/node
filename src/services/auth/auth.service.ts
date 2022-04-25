import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService
    ) { }

  async createToken(id: number, username: string, isAdmin: boolean) {
    const expiresIn = 60 * 60 * 24 * 30;
    const secretOrKey = 'BilinStudioSecretJWT';
    const user = { username, id, isAdmin };
    const token = jwt.sign(user, secretOrKey, { expiresIn });

    return { expires_in: expiresIn, token };
  }

  async validateUser(signedUser): Promise<boolean> {
    if (signedUser && signedUser.username) {
      return Boolean(this.usersService.getUserByUsername(signedUser.username));
    }

    return false;
  }
}