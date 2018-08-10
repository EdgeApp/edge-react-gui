// @flow

import React, { Component } from 'react'
import { ScrollView, View } from 'react-native'

import Text from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui.js'
import SafeAreaView from '../../components/SafeAreaView'
import { styles } from './TermsOfServiceStyle.js'

export type TermsOfServiceOwnProps = {
}

export type TermsOfServiceProps = TermsOfServiceOwnProps

export class TermsOfServiceComponent extends Component<TermsOfServiceProps> {
  render () {
    return (
      <SafeAreaView style={styles.safeAreaView}>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <View>
            <ScrollView style={styles.scrollView}>
              <View style={styles.scrollViewContent}>
                <Text>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac porta elit. Integer consectetur cursus quam at pharetra. Etiam ac auctor risus, eget euismod libero. Sed dignissim purus vel ante luctus, eu mollis elit euismod. Donec congue imperdiet condimentum. Quisque accumsan felis vel fringilla porttitor. Donec accumsan turpis eros, ut dignissim ligula placerat eget. Pellentesque gravida, quam vitae placerat rhoncus, nibh turpis porta mauris, eu tempus lacus purus in mauris. Morbi sed ligula quis odio condimentum efficitur a ultricies tellus. Integer mollis interdum urna, at tempus enim lacinia quis.</Text>
                <Text>Nullam id lacinia libero, id euismod lectus. Nam dignissim efficitur ex, eget pretium sem ornare vel. Mauris sagittis, metus non egestas fermentum, sapien nisl finibus turpis, in tristique purus arcu a diam. Ut ut est sit amet odio pellentesque tempor non vel ligula. Praesent eu ipsum ligula. In suscipit congue risus eget rutrum. Curabitur id iaculis libero. Aenean sollicitudin vel arcu ac tempor. Suspendisse mollis viverra metus, in tincidunt erat consectetur sed. Suspendisse velit mauris, dignissim vitae porttitor eu, fringilla at quam.</Text>
                <Text>Ut ultrices efficitur est ac viverra. Curabitur quam elit, vulputate vel blandit non, porttitor nec lectus. Fusce condimentum, nulla nec convallis dictum, nisi odio pellentesque metus, vel fringilla sapien quam sollicitudin nisl. Etiam dui tellus, lobortis vel risus vitae, faucibus facilisis dolor. Mauris convallis, arcu vitae varius tincidunt, neque magna pellentesque magna, sed sollicitudin purus odio ac justo. Mauris condimentum enim dolor. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Quisque tempus commodo mauris, eget suscipit purus feugiat sit amet. Pellentesque ac pretium nisl. Nullam et facilisis nunc.</Text>
                <Text>Aenean convallis lobortis diam. Donec auctor ipsum sed elit porta, quis mattis sapien cursus. Quisque tristique purus quis nibh volutpat, tristique viverra nisi fermentum. Cras ac velit lacinia, mattis nulla eget, commodo ante. Praesent massa nisl, pellentesque auctor mi ac, auctor sagittis metus. In cursus, leo a auctor auctor, mi risus rutrum ex, a consequat lectus nisi eu leo. Proin egestas viverra ligula et fringilla. In non libero justo. Nam elementum commodo aliquam. Quisque mattis magna mi, eget luctus velit consectetur eu. Donec vel magna augue. Vivamus feugiat massa in ligula varius, vel lobortis sem ullamcorper. Maecenas in mauris vel massa bibendum scelerisque ac sit amet mi. Vivamus vel ante ac nunc rhoncus vestibulum eu semper arcu.</Text>
                <Text>Vestibulum faucibus eros sapien, nec tempus nunc semper eget. Mauris sollicitudin rhoncus orci, id vestibulum quam porta eget. Ut maximus risus sed eros auctor facilisis. Nulla sagittis interdum nisl quis pretium. Morbi porttitor quam et justo tristique lobortis. In hac habitasse platea dictumst. Praesent ut eleifend tellus. Morbi consectetur vestibulum ante, tempor dignissim libero pretium nec. Mauris aliquet risus eget maximus suscipit. Interdum et malesuada fames ac ante ipsum primis in faucibus. Suspendisse eu augue quam. Praesent tincidunt orci in ligula volutpat, a luctus magna tincidunt. Suspendisse tortor odio, dapibus vel risus quis, mollis porttitor eros. Mauris sed felis nibh. Vestibulum nisi tortor, aliquam eu mauris eget, laoreet condimentum est. Integer in sem eu ante sodales consectetur a vel nulla.</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}
