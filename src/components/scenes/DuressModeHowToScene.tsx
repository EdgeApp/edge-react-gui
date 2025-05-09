import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { parseMarkdown } from '../../util/parseMarkdown'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { SceneContainer } from '../layout/SceneContainer'
import { EdgeText } from '../themed/EdgeText'

interface Props extends EdgeAppSceneProps<'duressModeHowTo'> {}

export const DuressModeHowToScene = (props: Props) => {
  const { navigation } = props

  const handleDone = useHandler(() => {
    navigation.goBack()
  })

  return (
    <SceneWrapper scroll>
      <SceneContainer headerTitle={lstrings.how_duress_mode_works}>
        <EdgeCard>{parseMarkdown(lstrings.how_duress_mode_works_description_md)}</EdgeCard>

        <CardHeadingText>{lstrings.how_duress_mode_return_to_normal_title}</CardHeadingText>
        <EdgeCard>{parseMarkdown(lstrings.how_duress_mode_return_to_normal_description_md)}</EdgeCard>

        <CardHeadingText>{lstrings.how_duress_mode_add_funds_to_account_title}</CardHeadingText>
        <EdgeCard>{parseMarkdown(lstrings.how_duress_mode_add_funds_to_account_description_md)}</EdgeCard>

        <CardHeadingText>{lstrings.how_duress_mode_when_to_use_title}</CardHeadingText>
        <EdgeCard>{parseMarkdown(lstrings.how_duress_mode_when_to_use_description_md)}</EdgeCard>

        <ButtonsView
          layout="column"
          primary={{
            label: lstrings.string_done_cap,
            onPress: handleDone
          }}
        />
      </SceneContainer>
    </SceneWrapper>
  )
}

const CardHeadingText = styled(EdgeText)(theme => ({
  marginHorizontal: theme.rem(0.5)
}))
