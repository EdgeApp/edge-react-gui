import React from 'react'
import {Button, Icon, Text} from 'native-base'
import styles from './styles'

const Tab = ({displayName, iconName, isActive, onPress}) => (
    <Button isActive={isActive}
      onPress={onPress}
      badgeValue={2}
      badgeValueStyle={styles.badgeValue}>
      <Icon isActive={isActive} name={iconName} />
      <Text style={{fontSize: 8}} >{displayName}</Text>
    </Button>
  )

export default Tab
