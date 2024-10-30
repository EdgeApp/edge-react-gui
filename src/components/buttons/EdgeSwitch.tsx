import React, { useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface EdgeSwitchProps {
  labelA: string
  labelB: string
  onSelectA: () => void
  onSelectB: () => void
}

export const EdgeSwitch: React.FC<EdgeSwitchProps> = (props: EdgeSwitchProps) => {
  const { labelA, labelB, onSelectA, onSelectB } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const [isASelected, setIsASelected] = useState(true)

  const handlePress = () => {
    if (isASelected) {
      onSelectB()
    } else {
      onSelectA()
    }
    setIsASelected(!isASelected)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} style={styles.touchContainer}>
        <View style={[styles.option, isASelected && styles.selectedOption]}>
          <EdgeText style={styles.label}>{labelA}</EdgeText>
        </View>
        <View style={[styles.option, !isASelected && styles.selectedOption]}>
          <EdgeText style={styles.label}>{labelB}</EdgeText>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: theme.rem(0.5)
  },
  touchContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: theme.rem(1.5),
    backgroundColor: theme.cardBaseColor,
    overflow: 'hidden'
  },
  selectedOption: {
    backgroundColor: theme.cardBaseColor,
    borderRadius: theme.rem(1.5)
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: theme.rem(2),
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {}
}))
