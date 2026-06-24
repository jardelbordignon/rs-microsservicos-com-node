export enum ERole {
	USER = 'user',
	ADMIN = 'admin',
	SELLER = 'seller',
}

export interface IUser {
	id: string
	email: string
	name: string
	role: ERole
	status: string
}

export interface IAuthDto {
	email: string
	password: string
}

export interface IAuthResponse {
	user: IUser
	accessToken: string
	sessionToken: string
	expiresIin: number
}

export interface IRegisterDto extends IAuthDto {
	name: string
	role?: ERole
}

export interface IRegisterResponse {
	userId: string
}

export interface IUserInfo extends Omit<IUser, 'id'> {
	userId: string
}

export interface IUserSession {
	valid: boolean
	user: IUser | null
}
