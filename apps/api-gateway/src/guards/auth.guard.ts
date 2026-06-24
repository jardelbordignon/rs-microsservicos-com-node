import {
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { Observable } from 'rxjs'
import type { IUser } from '@/interfaces/auth.interface'
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	// Reflector é utilizado para a leitura de metadados
	constructor(private readonly reflector: Reflector) {
		super()
	}

	canActivate(
		context: ExecutionContext,
	): boolean | Promise<boolean> | Observable<boolean> {
		const targets = [
			context.getHandler(), // methods
			context.getClass(), // classes
		]

		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)

		if (isPublic) {
			return true
		}

		return super.canActivate(context)
	}

	handleRequest<TUser = IUser>(
		err: Error | null,
		user: IUser | false,
		_info: unknown,
		_context: ExecutionContext,
		_status?: unknown,
	): TUser {
		if (err || !user) {
			throw err || new UnauthorizedException()
		}

		return user as TUser
	}
}
