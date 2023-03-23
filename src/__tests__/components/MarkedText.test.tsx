// TODO: Fix

// import { describe, it, expect, jest } from '@jest/globals';
// // import { asObject, asTuple, asUnknown, asValue, Cleaner } from 'cleaners'
// import React from 'react'
// import { Linking, Text } from 'react-native'

// import { EmText, LinkText, parseMarkedText } from '../../components/text/MarkedText'
// // import TestRenderer from 'react-test-renderer';

// describe('parseMarkedText', () => {
//   it('should convert asterisks to emphasized text', () => {
//     const result = parseMarkedText('I *am* emphasized')
//     const expected = (
//       <>
//         <Text key={0}>I </Text>
//         <EmText key={1}>am</EmText>
//         <Text key={2}> emphasized</Text>
//       </>
//     )
//     expect(result).toEqual(expected)
//   })

//   it('should handle unbalanced markers characters text', () => {
//     const result = parseMarkedText('I *am* emphasized. And*, I am not.')
//     const expected = (
//       <>
//         <Text key={0}>I </Text>
//         <EmText key={1}>am</EmText>
//         <Text key={2}> emphasized. And*, I am not.</Text>
//       </>
//     )
//     expect(result).toEqual(expected)
//   })

//   it('should convert links into clickable text', async () => {

//     const result = parseMarkedText('This is a [link](http://www.google.com).')
//     const expected = (
//       <>
//         <Text key={0}>This is a </Text>
//         <LinkText key={1} onPress={() => Linking.openURL('http://www.google.com')}>
//           http://www.google.com
//         </LinkText>
//         <Text key={2}>.</Text>
//       </>
//     )

//     expect(result).toEqual(expected)
//   })

//   it('should handle escaped markers characters', () => {
//     const result = parseMarkedText('I \\*am not* emphasized')
//     const expected = (
//       <>
//         <Text key={0}>I *am not* emphasized</Text>
//       </>
//     )
//     expect(result).toEqual(expected)
//   })
// })

// // TODO
// // describe('<MarkedText />', () => {
// //   it('should render correctly with emphasized text and clickable link', () => {
// //     const testStr = 'I *am* emphasized. This is a [link](http://www.google.com).'
// //     const tree = TestRenderer.create(<MarkedText>{testStr}</MarkedText>).toJSON()
// //     expect(tree).toMatchSnapshot()
// //   })

// //   it('should render correctly without any markers', () => {
// //     const testStr = 'This text has no markers.'
// //     const tree = TestRenderer.create(<MarkedText>{testStr}</MarkedText>).toJSON()
// //     expect(tree).toMatchSnapshot()
// //   })
// // })
