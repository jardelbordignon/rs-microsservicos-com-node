import {
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { Observable } from 'rxjs'

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

		const isPublic = this.reflector.getAllAndOverride<boolean>(
			'isPublic',
			targets,
		)

		if (isPublic) {
			return true
		}

		return super.canActivate(context)
	}

	handleRequest(err: any, user: any, _info: any) {
		if (err || !user) throw err || new UnauthorizedException()

		return user
	}
}
