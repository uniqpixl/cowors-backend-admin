import { vi, beforeEach, afterEach } from 'vitest'

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5001'
process.env.NODE_ENV = 'test'

// Mock global fetch
globalThis.fetch = vi.fn()

// Mock console methods to reduce noise in tests
const originalConsole = console
globalThis.console = {
  ...originalConsole,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

// Mock Date.now for consistent testing
const mockDateNow = vi.fn(() => 1640995200000) // 2022-01-01T00:00:00.000Z
const OriginalDate = Date
globalThis.Date = class extends OriginalDate {
  static now = mockDateNow
  constructor(...args: any[]) {
    if (args.length === 0) {
      super(mockDateNow())
    } else {
      super(...args)
    }
  }
} as any

// Mock crypto for UUID generation
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    })
  },
  writable: true
})

// Mock AbortController
globalThis.AbortController = class AbortController {
  signal = {
    aborted: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onabort: null,
    reason: undefined
  }
  abort = vi.fn((reason?: any) => {
    this.signal.aborted = true
    this.signal.reason = reason
  })
}

// Mock performance for timing tests
globalThis.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn()
} as any

// Setup and teardown hooks
beforeEach(() => {
  vi.clearAllMocks()
  mockDateNow.mockReturnValue(1640995200000)
})

afterEach(() => {
  vi.restoreAllMocks()
})