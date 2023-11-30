import { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'

import { MinimalButton } from './MinimalButton'

const meta: Meta<typeof MinimalButton> = {
  component: MinimalButton
}

export default meta

type Story = StoryObj<typeof MinimalButton>

export const Basic: Story = {
  render: () => <MinimalButton label="Hello" />
}
