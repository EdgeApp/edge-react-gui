// @flow

import React, { Component } from 'react'
import type { Node } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { default as Modal } from 'react-native-modal'
import { styles } from './styles.js'

// CONTAINER /////////////////////////////////////////////////////////////////////////////
export type ContainerProps = {
  children: Node,
  style?: StyleSheet.Styles
}
class Container extends Component<ContainerProps> {
  render () {
    return (
      <View {...this.props} style={[styles.container, this.props.style]}>
        {this.props.children}
      </View>
    )
  }
}

// HEADER /////////////////////////////////////////////////////////////////////////////
export type HeaderProps = {
  children: Node,
  style?: StyleSheet.Styles
}
class Header extends Component<HeaderProps> {
  render () {
    return (
      <View {...this.props} style={[styles.header, this.props.style]}>
        {this.props.children}
      </View>
    )
  }
}

// ANDROID_HACK_SPACER /////////////////////////////////////////////////////////////////////////////
/*
  This spacer should be used with Icon to overcome the limitations on Android
  React Native on Android does not support 'Overflow'
  If/When React Native on Android supports 'Overflow',
    * remove the hack component
    * move the Icon component inside Modal.Container
  https://github.com/facebook/react-native/issues/6802
*/
type AndroidHackSpacerProps = {
  style?: StyleSheet.Styles
}
class AndroidHackSpacer extends Component<AndroidHackSpacerProps> {
  render () {
    return (
      <View style={styles.androidHackSpacer} />
    )
  }
}

// ICON /////////////////////////////////////////////////////////////////////////////
export type IconProps = {
  children: Node,
  style?: StyleSheet.Styles
}
class Icon extends Component<IconProps> {
  static AndroidHackSpacer = AndroidHackSpacer
  render () {
    return (
      <View {...this.props} style={[styles.icon, this.props.style]}>
        {this.props.children}
      </View>
    )
  }
}

// TITLE /////////////////////////////////////////////////////////////////////////////
type TitleProps = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Title extends Component<TitleProps> {
  render () {
    return (
      <Text style={[styles.title, this.props.style]} {...this.props}>
        {this.props.children}
      </Text>
    )
  }
}

// DESCRIPTION /////////////////////////////////////////////////////////////////////////////
export type DescriptionProps = {
  children: Node,
  style?: StyleSheet.Styles
}
class Description extends Component<DescriptionProps> {
  render () {
    return (
      <Text {...this.props} style={[styles.description, this.props.style]}>
        {this.props.children}
      </Text>
    )
  }
}

// BODY /////////////////////////////////////////////////////////////////////////////
type BodyProps = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Body extends Component<BodyProps> {
  render () {
    return (
      <View style={[styles.body, this.props.style]} {...this.props}>
        {this.props.children}
      </View>
    )
  }
}

// FOOTER /////////////////////////////////////////////////////////////////////////////
type FooterProps = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Footer extends Component<FooterProps> {
  render () {
    return (
      <View style={[styles.footer, this.props.style]} {...this.props}>
        {this.props.children}
      </View>
    )
  }
}

// Item /////////////////////////////////////////////////////////////////////////////
type ItemProps = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Item extends Component<ItemProps> {
  render () {
    return (
      <View style={[styles.item, this.props.style]} {...this.props}>
        {this.props.children}
      </View>
    )
  }
}

// INTERACTIVE_MODAL /////////////////////////////////////////////////////////////////////////////
type Props = {
  isVisible: boolean,
  children: Node,
  style?: StyleSheet.Styles
}
export class InteractiveModal extends Component<Props> {
  static Icon = Icon
  static Title = Title
  static Description = Description
  static Body = Body
  static Footer = Footer
  static Item = Item

  render () {
    const { isVisible } = this.props
    const children = React.Children.toArray(this.props.children)
    const icon = children.find(child => child.type === InteractiveModal.Icon)
    const title = children.find(child => child.type === InteractiveModal.Title)
    const body = children.find(child => child.type === InteractiveModal.Body)
    const footer = children.find(child => child.type === InteractiveModal.Footer)

    return (
      <Modal useNativeDriver hideModalContentWhileAnimating
        isVisible={isVisible}
        {...this.props}
        style={[styles.modal, this.props.style]}>
        {icon}
        <Container>
          <Icon.AndroidHackSpacer />
          <Header style={styles.header}>{title}</Header>
          <Body>{body}</Body>
          <Footer>{footer}</Footer>
        </Container>
      </Modal>
    )
  }
}

// Types ///////////////////////////////////////////////////////////////////

// type BookId = string
// type BookTitle = string
// type BookAuthor = string
// type BookRating = number
// type Book = {
//   id: BookId,
//   title: BookTitle
// }
// type BookInfo = {
//   author: BookAuthor,
//   rating: BookRating
// }
// type BookWithInfo = Book & BookInfo
//
// // Fetch ///////////////////////////////////////////////////////////////////
//
// const fetchBook = (title: BookTitle): Promise<Book> => Promise.resolve({ id: '1c82b746', title })
// const fetchAuthor = (id: BookId): Promise<BookAuthor> => Promise.resolve('qweqwe')
// const fetchRating = (id: BookId): Promise<BookRating> => Promise.resolve(123)
//
// const getBook = fetchBook
// const getAuthor = (book: Promise<Book>) => book.then(book => fetchAuthor(book.id))
// const getRating = (book: Promise<Book>) => book.then(book => fetchRating(book.id))
//
// const assembleBookWithInfo = ([book: Book, author: BookAuthor, rating: BookRating]): BookWithInfo => ({
//   ...book,
//   author,
//   rating
// })
//
// const getBookWithInfo = (title) => {
//   const book = getBook(title)
//   const author = getAuthor(book)
//   const rating = getRating(book)
//
//   return Promise.all([ book, author, rating ])
//     .then(assembleBookWithInfo)
// }
//
// getBookWithInfo('The Wealth of Nations')

/// ///////////////////////////////////////////////////////////////////////////

// Level 1
const fetchBook = title => Promise.resolve({ id: '1c82b746', title })
const fetchAuthor = id => Promise.resolve('qweqwe')
const fetchRating = id => Promise.resolve(123)

// Level 2
const getBook = fetchBook
const getAuthor = book => book.then(book => fetchAuthor(book.id))
const getRating = book => book.then(book => fetchRating(book.id))

const assembleBookWithInfo = ([book, author, rating]) => ({
  ...book,
  author,
  rating
})

// Level 3
const getBookWithInfo = (title) => {
  const book = getBook(title)
  const author = getAuthor(book)
  const rating = getRating(book)

  return Promise.all([ book, author, rating ])
    .then(assembleBookWithInfo)
}

// Level 4
getBookWithInfo('The Wealth of Nations')
