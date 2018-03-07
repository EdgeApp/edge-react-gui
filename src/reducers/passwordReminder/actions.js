// @flow

const PREFIX = 'PASSWORD_REMINDER/'

export const PASSWORD_REMINDER_POSTPONED = PREFIX + 'PASSWORD_REMINDER_POSTPONED'
export const postponePasswordReminder = () => ({
  type: PASSWORD_REMINDER_POSTPONED
})
