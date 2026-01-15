import * as React from 'react'
import { Fragment } from 'react'
import { ScrollView } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { EdgeCard } from '../cards/EdgeCard'
import { SectionHeader } from '../common/SectionHeader'
import { EdgeRow } from '../rows/EdgeRow'
import { EdgeModal } from './EdgeModal'

interface Props {
  bridge: AirshipBridge<void>

  /** The sections data to display in the modal. */
  sections: DataSheetSection[]

  /** The title of the modal. */
  title?: string
}

export interface DataSheetSection {
  /** The title of the section. */
  title?: string

  /** The rows of the section. */
  rows: DataSheetRow[]
}

export interface DataSheetRow {
  /** The title or label of the row. */
  title: string

  /** The body text of the row. */
  body: string
}

export const DataSheetModal: React.FC<Props> = (props: Props) => {
  const { bridge, sections, title } = props

  const handleCancel = (): void => {
    bridge.resolve(undefined)
  }

  return (
    <EdgeModal bridge={bridge} title={title} onCancel={handleCancel}>
      <ScrollView scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
        {sections.map((section, index) => (
          <Fragment key={index + (section.title ?? '')}>
            {section.title == null ? null : (
              <SectionHeader leftTitle={section.title} />
            )}
            <EdgeCard>
              {section.rows.map((row, index) => (
                <EdgeRow
                  key={index + row.title}
                  title={row.title}
                  body={row.body}
                />
              ))}
            </EdgeCard>
          </Fragment>
        ))}
      </ScrollView>
    </EdgeModal>
  )
}
