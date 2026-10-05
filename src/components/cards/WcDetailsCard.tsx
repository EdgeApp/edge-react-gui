import * as React from 'react'

import { lstrings } from '../../locales/strings'
import type { WcDetails } from '../../util/walletConnectActions'
import { EdgeRow } from '../rows/EdgeRow'
import { EdgeCard } from './EdgeCard'

interface Props {
  details: WcDetails[]
}

/**
 * Lists every field a signature covers, one card per group of fields.
 */
export const WcDetailsCard: React.FC<Props> = props => {
  const { details } = props

  return (
    <>
      {details.map((section, index) =>
        section.rows.length === 0 ? null : (
          <EdgeCard key={index} sections>
            <EdgeRow title={lstrings.wc_details_title} body={section.title} />
            {section.rows.map((row, rowIndex) => (
              <EdgeRow
                key={rowIndex}
                title={row.name}
                body={row.value}
                maximumHeight="large"
              />
            ))}
          </EdgeCard>
        )
      )}
    </>
  )
}
