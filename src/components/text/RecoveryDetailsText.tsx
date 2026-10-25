import * as React from 'react'

import { BoldText, Paragraph } from '../themed/EdgeText'

interface Props {
  // Text from `EdgeAccount.getDisplayPrivateKey`:
  text: string
}

/**
 * Shows a wallet's seed phrase and keys, bolding label lines.
 *
 * Plugins format labelled keys as a line ending in a colon,
 * such as "Seed Phrase:" or "Private Key:", with the value on the next line.
 */
export const RecoveryDetailsText: React.FC<Props> = props => {
  const { text } = props
  const lines = text.split('\n')

  return (
    <Paragraph>
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {index > 0 ? '\n' : null}
          {isLabelLine(lines, index) ? <BoldText>{line}</BoldText> : line}
        </React.Fragment>
      ))}
    </Paragraph>
  )
}

function isLabelLine(lines: string[], index: number): boolean {
  const next = lines[index + 1]
  return lines[index].endsWith(':') && next != null && next !== ''
}
