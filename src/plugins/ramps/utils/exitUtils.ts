/**
 * Exit error class for gracefully exiting workflows
 */
export class ExitError extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'Exit'
  }
}

/**
 * Wrapper for workflow functions that handles graceful early exits via Exit
 * thrown Exit errors.
 *
 * The purpose of this is to leverage throws as a hidden control flow for
 * simpler workflow code. It is simply a try-catch wrapper to handle only Exit
 * errors gracefully and nothing else. If a workflow needs to handle other
 * errors, then use a try-catch block.
 *
 * Why not just use a try-catch block instead of this utility for Exit errors?
 * The reason is to not temp developers to use the try-catch block for handling
 * other errors when error handling typically should be handled at the top-level
 * and rarely should we be handling errors in a try-catch block within some
 * routine.
 *
 * @param fn - The workflow function to execute
 * @returns Promise that resolves when workflow completes or exits gracefully
 */
export const handleExitErrorsGracefully = async (
  fn: () => Promise<void>
): Promise<void> => {
  try {
    await fn()
  } catch (error: unknown) {
    // Handle graceful exit - don't propagate the error
    if (error instanceof ExitError) {
      console.log('Ramp workflow: Graceful exit:', error.message)
      return
    }
    // Log and re-throw all other errors to be handled up the stack
    console.error('Ramp workflow error:', error)
    throw error
  }
}
