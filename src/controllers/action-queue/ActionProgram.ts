import { ENV } from '../../env'
import { lstrings } from '../../locales/strings'
import { ActionOp, ActionProgram, ActionProgramCompleteMessage } from './types'

// TODO: Move handling from ActionProgramUtil methods here, use this instead of
// creating individual ActionOps via ActionProgramUtil methods on the manage scenes
export async function makeActionProgram(actionOp: ActionOp, completeMessage?: ActionProgramCompleteMessage): Promise<ActionProgram> {
  const programId = Date.now().toString()

  return {
    programId,
    actionOp,
    completeMessage: completeMessage ?? {
      title: lstrings.action_display_title_complete_default,
      message: lstrings.action_display_message_complete_default
    },
    mockMode: ENV.ACTION_QUEUE.mockMode
  }
}
