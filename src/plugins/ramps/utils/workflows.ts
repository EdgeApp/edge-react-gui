/**
 * Generic workflow type definition
 */
export type Workflow<Utils> = (utils: Utils) => Promise<void>

/**
 * Exit error class for gracefully exiting workflows
 */
export class Exit extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'Exit'
  }
}

/**
 * Wrapper for workflow functions that handles graceful exits
 * @param fn - The workflow function to execute
 * @returns Promise that resolves when workflow completes or exits gracefully
 */
export const withWorkflow = async (fn: () => Promise<void>): Promise<void> => {
  try {
    await fn()
  } catch (error) {
    // Handle graceful exit - don't propagate the error
    if (error instanceof Exit) {
      return
    }
    // Re-throw all other errors to be handled up the stack
    throw error
  }
}
