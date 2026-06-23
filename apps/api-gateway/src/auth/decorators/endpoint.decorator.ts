import {
	applyDecorators,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Patch,
	Post,
	Put,
} from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'

const methods = { Get, Post, Put, Patch, Delete } as const

type EndpointOptions = {
	path?: string
	type: keyof typeof methods

	summary: string

	responses: {
		status: HttpStatus
		description: string
	}[]

	throttle?: {
		name: 'short' | 'medium' | 'large'
		limit?: number
		ttl?: number
	}
}

export function Endpoint(options: EndpointOptions) {
	return applyDecorators(
		methods[options.type](options.path),

		HttpCode(options.responses[0].status),

		ApiOperation({
			summary: options.summary,
		}),

		...(options.responses ?? []).map((response) => ApiResponse(response)),

		...(options.throttle
			? [
					Throttle({
						[options.throttle.name]: {
							limit: options.throttle.limit,
							ttl: options.throttle.ttl,
						},
					}),
				]
			: []),
	)
}
