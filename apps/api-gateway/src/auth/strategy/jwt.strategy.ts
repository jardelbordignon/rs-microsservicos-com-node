import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthService } from '../service/auth.service'


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] ?? '',
    })
  }

  async validate({ token }: any) {
    if (!token) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.authService.validateJwtToken(token)

    if (!user) {
      throw new UnauthorizedException('Invalid jwt token');
    }

    const { sub: userId, ...userData } = user

    return { userId, ...userData }
  }
}
