export type EdgeVaultLogContext = Record<string, unknown>

export interface EdgeVaultLogger {
  debug: (message: string, context?: EdgeVaultLogContext) => void
  info: (message: string, context?: EdgeVaultLogContext) => void
  warn: (message: string, context?: EdgeVaultLogContext) => void
  error: (error: unknown, context?: EdgeVaultLogContext) => void
}

export const edgeVaultLogger: EdgeVaultLogger = {
  debug: (_message, _context) => {
    // TODO: Route debug logs through the shared logging utility
  },
  info: (_message, _context) => {
    // TODO: Route info logs through the shared logging utility
  },
  warn: (_message, _context) => {
    // TODO: Route warning logs through the shared logging utility
  },
  error: (_error, _context) => {
    // TODO: Route error logs through the shared logging utility
  }
}
