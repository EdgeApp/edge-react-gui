// @flow

import React, { type StatelessFunctionalComponent } from 'react'
import { FlatList, Image, ListRenderItemInfo, NativeModules, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'

import { useCallback } from '../types/reactHooks'

const { MessagesModule } = NativeModules

type Sticker = { name: string, source: string }

const stickers: Sticker[] = [
  { name: 'Dogecoin Cupid', source: require('../assets/images/stickers/Dogecoin-Cupid.gif') },
  { name: 'EdgeValentineCharacter', source: require('../assets/images/stickers/EdgeValentineCharacter.gif') },
  { name: 'BTC', source: require('../assets/images/stickers/HeartCandy_BTC.gif') },
  { name: 'ETH', source: require('../assets/images/stickers/HeartCandy_ETH.gif') },
  { name: 'HODLme', source: require('../assets/images/stickers/HeartCandy_HODLme.gif') },
  { name: 'ToTheMoon', source: require('../assets/images/stickers/HeartCandy_ToTheMoon.gif') },
  { name: 'ValentinesDayNotecard', source: require('../assets/images/stickers/ValentinesDayNotecard.gif') }
]

const Stickers: StatelessFunctionalComponent<any> = () => {
  const sendSticker = useCallback(async (sticker: Sticker) => {
    const { uri } = Image.resolveAssetSource(sticker.source)
    try {
      await MessagesModule.insertSticker(uri)
    } catch (error) {
      console.error(error)
    }
  }, [])

  const renderSticker = useCallback(
    (info: ListRenderItemInfo<Sticker>) => {
      return (
        <Pressable onPress={() => sendSticker(info.item)}>
          <Image source={info.item.source} style={styles.image} />
        </Pressable>
      )
    },
    [sendSticker]
  )

  const getKey = useCallback((sticker: Sticker) => {
    return sticker.name
  }, [])

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Vegtastick</Text>
      </View>
      <FlatList
        data={stickers}
        renderItem={renderSticker}
        keyExtractor={getKey}
        numColumns={4}
        showsVerticalScrollIndicator={false}
        testID="pack-details-stickers"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    borderBottomColor: '#cccccc',
    borderBottomWidth: 1,
    height: 30,
    width: '100%'
  },
  headerText: {
    color: '#34c759',
    fontSize: 20,
    fontWeight: 'bold'
  },
  image: {
    height: 90,
    width: 90
  },
  root: {
    alignItems: 'center'
  }
})

export default Stickers
