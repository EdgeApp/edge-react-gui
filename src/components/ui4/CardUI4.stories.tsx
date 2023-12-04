import { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'

import { EdgeText } from '../themed/EdgeText'
import { CardUi4 } from './CardUi4'

const meta: Meta<typeof CardUi4> = {
  component: CardUi4
}

export default meta

type Story = StoryObj<typeof CardUi4>

export const Basic: Story = {
  render: () => (
    <CardUi4>
      <EdgeText>Hello</EdgeText>
    </CardUi4>
  )
}
