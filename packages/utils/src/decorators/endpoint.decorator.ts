import {
	applyDecorators,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Patch,
	Post,
	Put,
	Type,
} from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'

const methods = { Get, Post, Put, Patch, Delete } as const

type EndpointOptions = {
	type: keyof typeof methods
	path?: string
	body?: string | Function | Type<unknown> | [Function]

	summary: string
	description?: string

	responses?: {
		status: HttpStatus
		description: string
		schema?: object
	}[]

	throttle?: {
		name: 'short' | 'medium' | 'large'
		limit?: number
		ttl?: number
	}
}

export function Endpoint(options: EndpointOptions) {
	const { type, path, body, responses, throttle, summary, description } = options

	return applyDecorators(
		methods[type](path),
		...(body ? [ApiBody({ type: body })] : []),

		ApiOperation({ summary, description }),

		HttpCode(responses?.[0]?.status || 200),

		...(responses ?? []).map((response) => ApiResponse(response)),

		...(throttle
			? [
					Throttle({
						[throttle.name]: {
							limit: throttle.limit,
							ttl: throttle.ttl,
						},
					}),
				]
			: []),
	)
}
