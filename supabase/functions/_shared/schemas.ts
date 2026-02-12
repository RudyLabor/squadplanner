// Zod-like validation without external dependency (Deno compatible)
// Simple runtime validation for Edge Functions

export function validateString(
  value: unknown,
  fieldName: string,
  options?: { minLength?: number; maxLength?: number }
): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`)
  }
  if (options?.minLength && value.length < options.minLength) {
    throw new Error(`${fieldName} must be at least ${options.minLength} characters`)
  }
  if (options?.maxLength && value.length > options.maxLength) {
    throw new Error(`${fieldName} must be at most ${options.maxLength} characters`)
  }
  return value
}

export function validateEmail(value: unknown, fieldName: string): string {
  const str = validateString(value, fieldName)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(str)) {
    throw new Error(`${fieldName} must be a valid email`)
  }
  return str
}

export function validateUUID(value: unknown, fieldName: string): string {
  const str = validateString(value, fieldName)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(str)) {
    throw new Error(`${fieldName} must be a valid UUID`)
  }
  return str
}

export function validateNumber(
  value: unknown,
  fieldName: string,
  options?: { min?: number; max?: number }
): number {
  const num = typeof value === 'number' ? value : Number(value)
  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a number`)
  }
  if (options?.min !== undefined && num < options.min) {
    throw new Error(`${fieldName} must be at least ${options.min}`)
  }
  if (options?.max !== undefined && num > options.max) {
    throw new Error(`${fieldName} must be at most ${options.max}`)
  }
  return num
}

export function validateBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${fieldName} must be a boolean`)
  }
  return value
}

export function validateArray<T>(
  value: unknown,
  fieldName: string,
  itemValidator?: (item: unknown, index: number) => T
): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`)
  }
  if (itemValidator) {
    return value.map((item, index) => itemValidator(item, index))
  }
  return value as T[]
}

export function validateOptional<T>(value: unknown, validator: (v: unknown) => T): T | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  return validator(value)
}

export function validateEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: T[]
): T {
  const str = validateString(value, fieldName)
  if (!allowedValues.includes(str as T)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`)
  }
  return str as T
}

export function validateUrl(value: unknown, fieldName: string): string {
  const str = validateString(value, fieldName)
  try {
    new URL(str)
    return str
  } catch {
    throw new Error(`${fieldName} must be a valid URL`)
  }
}

// Helper to validate and parse request body with custom validation
export async function validateRequestBody<T>(
  req: Request,
  validator: (body: Record<string, unknown>) => T
): Promise<T> {
  let body: Record<string, unknown>

  try {
    body = await req.json()
  } catch {
    throw new Error('Invalid JSON in request body')
  }

  if (typeof body !== 'object' || body === null) {
    throw new Error('Request body must be an object')
  }

  return validator(body)
}
