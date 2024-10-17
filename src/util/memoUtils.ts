import { gt } from 'biggystring'
import { asMaybe } from 'cleaners'
import { EdgeMemo, EdgeMemoOption } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../locales/strings'
import { asBase16 } from './cleaners/asHex'
import { asIntegerString } from './cleaners/asIntegerString'

/**
 * Checks a memo against a memo option.
 * Returns `undefined` if valid, or an error string if invalid.
 */
export function getMemoError(memo: EdgeMemo, option: EdgeMemoOption): string | undefined {
  if (option.type === 'text' && option.maxLength != null && memo.value.length > option.maxLength) {
    return sprintf(lstrings.memo_error_text_too_long_s, option.maxLength)
  }

  if (option.type === 'number') {
    const value = asMaybe(asIntegerString)(memo.value)
    if (value == null) {
      return lstrings.memo_error_number
    }
    if (option.maxValue != null && gt(value, option.maxValue)) {
      return sprintf(lstrings.memo_error_number_value_s, option.maxValue)
    }
  }

  if (option.type === 'hex') {
    const value = asMaybe(asBase16)(memo.value)
    if (value == null) {
      return lstrings.memo_error_hex
    }
    if (option.maxBytes != null && value.length > option.maxBytes) {
      return sprintf(lstrings.memo_error_hext_too_long_s, option.maxBytes)
    }
    if (option.minBytes != null && value.length < option.minBytes) {
      return sprintf(lstrings.memo_error_hext_too_short_s, option.minBytes)
    }
  }
}

export function getMemoLabel(memoName: string = 'memo'): string {
  return memoLabels[memoName] ?? memoName
}

export function getMemoTitle(memoName: string = 'memo'): string {
  return memoTitles[memoName] ?? memoName
}

const memoLabels: { [name: string]: string } = {
  'destination tag': lstrings.memo_destination_tag_label,
  op_return: lstrings.memo_op_return_label,
  note: lstrings.memo_note_label,
  memo: lstrings.memo_memo_label
}

const memoTitles: { [name: string]: string } = {
  'destination tag': lstrings.memo_destination_tag_title,
  op_return: lstrings.memo_op_return_title,
  note: lstrings.memo_note_title,
  memo: lstrings.memo_memo_title
}
