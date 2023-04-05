import { lstrings } from '../../locales/strings'
import { asHex } from '../../util/cleaners/asHex'
import { makePushClient } from '../../util/PushClient/PushClient'
import { filterNull } from '../../util/safeFilters'
import { ActionEffect, ActionProgram, ExecutionContext, ExecutionOutput, PushEventEffect } from './types'
import { LoginUpdatePayload, NewPushEvent, PushEventStatus } from './types/pushApiTypes'
import { BroadcastTx, PushEventState, PushMessage, PushTrigger } from './types/pushTypes'

export interface PushEventInfo {
  newPushEvent: NewPushEvent
  pushEventEffect: PushEventEffect
}

/*
Each PushEvent's trigger should be the effect of the previous ExecutionOutput:

  [ A, B, C ]
  -> [
    {trigger: initEffect, ...convertToPushEvent(A)},
    {trigger: A.effect, ...convertToPushEvent(B)},
    {trigger: B.effect, ...convertToPushEvent(C)},
  ]

The initEffect is the current effect in the program's state. This should
always be defined because the first action in the program should be run even
for new programs.

Although the last effect is not used here, but the caller may use it to
determine the final effect in the chain.
*/
export async function prepareNewPushEvents(
  context: ExecutionContext,
  program: ActionProgram,
  initEffect: ActionEffect,
  dryrunOutputs: ExecutionOutput[]
): Promise<PushEventInfo[]> {
  const { account } = context
  const { programId } = program

  // Final push message to send to the device once server has finished all events
  const pushMessage: PushMessage = {
    title: lstrings.action_queue_push_notification_title,
    body: lstrings.action_queue_push_notification_body
  }

  const pushEventInfos: PushEventInfo[] = await Promise.all(
    dryrunOutputs.map(async (output, index) => {
      const triggeringEffect = index > 0 ? dryrunOutputs[index - 1].effect : initEffect

      const callStackId = getCallStackId(output.effect)
      const eventId = `${programId}:${callStackId}`
      const broadcastTxs: BroadcastTx[] = await Promise.all(
        output.broadcastTxs.map(async executionTx => {
          const wallet = await account.waitForCurrencyWallet(executionTx.walletId)
          const { pluginId } = wallet.currencyConfig.currencyInfo
          const rawTx = asHex(executionTx.tx.signedTx)

          const broadcastTx: BroadcastTx = { pluginId, rawTx }

          return broadcastTx
        })
      )
      const trigger = await actionEffectToPushTrigger(context, triggeringEffect)

      // Assert that the given prevEffect is a convertible to a PushTrigger
      if (trigger == null) {
        throw new Error(`Unsupported effect type ${triggeringEffect.type} in conversion to PushTrigger`)
      }

      const newPushEvent: NewPushEvent = {
        eventId,
        broadcastTxs,
        // Include pushMessage only for the last event because device should only wake up when the server finishes all push events.
        pushMessage: index === dryrunOutputs.length - 1 ? pushMessage : undefined,
        trigger
      }

      const pushEventEffect: PushEventEffect = {
        type: 'push-event',
        eventId: eventId,
        effect: triggeringEffect
      }

      return {
        newPushEvent,
        pushEventEffect
      }
    })
  )

  return pushEventInfos
}

export async function checkPushEvent(context: ExecutionContext, eventId: string): Promise<boolean> {
  const { account, clientId } = context
  const pushClient = makePushClient(account, clientId)
  const loginPayload = await pushClient.getPushEvents()
  const eventStatusMap: { [eventId: string]: PushEventStatus } = loginPayload.events.reduce(
    (map, eventStatus) => ({ ...map, [eventStatus.eventId]: eventStatus }),
    {}
  )

  const status: PushEventStatus = eventStatusMap[eventId]
  const pushEventState: PushEventState = status.state
  if (status.broadcastTxErrors != null && status.broadcastTxErrors.some(error => error != null)) {
    throw new Error(`Broadcast failed for ${eventId} event:\n\t${status.broadcastTxErrors.join('\n\t')}`)
  }

  const isEffective = status != null && pushEventState === 'triggered'

  return isEffective
}

export async function effectCanBeATrigger(context: ExecutionContext, effect: ActionEffect): Promise<boolean> {
  return (await actionEffectToPushTrigger(context, effect)) != null
}

export async function uploadPushEvents(context: ExecutionContext, payload: LoginUpdatePayload): Promise<void> {
  const { account, clientId } = context
  const pushClient = makePushClient(account, clientId)
  return await pushClient.uploadPushEvents(payload)
}

async function actionEffectToPushTrigger(context: ExecutionContext, effect: ActionEffect): Promise<PushTrigger | null> {
  const { account } = context
  const UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE =
    `Unexpected null effect while converting to PushTrigger. ` + `This could be caused by a partial dryrun not properly short-circuiting.`

  switch (effect.type) {
    case 'seq': {
      const checkedEffects = filterNull(effect.childEffects)
      if (checkedEffects.length !== effect.childEffects.length) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)

      // Only check the child effect at the current opIndex
      const childEffect = checkedEffects[effect.opIndex]
      return await actionEffectToPushTrigger(context, childEffect)
    }
    case 'address-balance': {
      const { address, walletId, tokenId, aboveAmount, belowAmount } = effect
      const wallet = await account.waitForCurrencyWallet(walletId)
      const { pluginId } = wallet.currencyInfo
      return {
        type: 'address-balance',
        pluginId,
        tokenId,
        address,
        aboveAmount,
        belowAmount
      }
    }
    case 'price-level': {
      const { currencyPair, aboveRate, belowRate } = effect
      return {
        type: 'price-level',
        currencyPair,
        aboveRate,
        belowRate
      }
    }
    case 'tx-confs': {
      const { confirmations, walletId, txId } = effect
      const wallet = await account.waitForCurrencyWallet(walletId)
      const { pluginId } = wallet.currencyInfo

      return {
        type: 'tx-confirm',
        pluginId,
        confirmations,
        txid: txId
      }
    }

    case 'done': {
      return null
    }
    case 'par': {
      const checkedEffects = filterNull(effect.childEffects)
      if (checkedEffects.length !== effect.childEffects.length) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)

      // Get an array of triggers for every child effect
      const triggers: PushTrigger[] = []

      for (const effect of checkedEffects) {
        const trigger = await actionEffectToPushTrigger(context, effect)

        if (trigger == null) return null

        triggers.push(trigger)
      }

      return {
        type: 'all',
        triggers
      }
    }
    // Would this cause infinite recursion? We may never want to add conversion support for this.
    case 'push-event': {
      return null
    }
  }
}

function getCallStackId(effect: ActionEffect): string {
  const UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE =
    `Unexpected null effect while converting to CallStackId. ` + `This could be caused by a partial dryrun not properly short-circuiting.`

  switch (effect.type) {
    case 'seq': {
      const { opIndex } = effect
      return `seq_${opIndex}`
    }
    case 'par': {
      const childCallStackIds = effect.childEffects
        .map(childEffect => {
          if (childEffect === null) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)
          return getCallStackId(childEffect)
        })
        .join('_')
      return `par_${childCallStackIds}`
    }
    default:
      return effect.type
  }
}
