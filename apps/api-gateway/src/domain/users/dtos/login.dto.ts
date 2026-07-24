import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'
import type { IAuthDto } from '@/interfaces/auth.interface'

export class LoginDto implements IAuthDto {
	@ApiProperty({
		description: 'User email',
		example: 'user@example.com',
	})
	@IsEmail()
	email: string

	@ApiProperty({
		description: 'User password',
		example: 'pwd@123',
	})
	@IsString()
	@MinLength(6)
	@MaxLength(25)
	password: string
}
