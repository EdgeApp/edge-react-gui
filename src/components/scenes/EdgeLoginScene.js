// @flow

import type { EdgeLobby } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { isIPhoneX } from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import { lobbyLogin } from '../../actions/EdgeLoginActions.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { SecondaryButton } from '../../modules/UI/components/Buttons/SecondaryButton.ui.js'
import { THEME } from '../../theme/variables/airbitz'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type StateProps = {
  error: string | null,
  isProcessing: boolean,
  lobby: EdgeLobby | null
}

type DispatchProps = {
  accept: () => void,
  decline: () => void
}

type Props = StateProps & DispatchProps

class EdgeLoginSceneComponent extends React.Component<Props> {
  renderBody() {
    let message = this.props.error
    if (!this.props.error) {
      message = s.strings.edge_description
    }
    if (!this.props.lobby && !this.props.error) {
      throw new Error('Not normal expected behavior')
    }
    if (this.props.lobby && this.props.lobby.loginRequest && this.props.lobby.loginRequest.appId === '') {
      message = sprintf(s.strings.edge_description_warning, this.props.lobby.loginRequest.displayName)
    }
    return (
      <View style={styles.body}>
        <Text style={styles.bodyText}>{message}</Text>
      </View>
    )
  }

  renderButtons() {
    if (this.props.isProcessing) {
      return (
        <View style={styles.buttonsProcessing}>
          <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
        </View>
      )
    }
    if (this.props.error) {
      return (
        <View style={styles.buttonContainer}>
          <View style={styles.buttons}>
            <SecondaryButton style={styles.cancelSolo} onPress={this.props.decline}>
              <SecondaryButton.Text>{s.strings.string_cancel_cap}</SecondaryButton.Text>
            </SecondaryButton>
          </View>
        </View>
      )
    }
    return (
      <View style={styles.buttonContainer}>
        <View style={styles.buttons}>
          <SecondaryButton style={styles.cancel} onPress={this.props.decline}>
            <SecondaryButton.Text>{s.strings.string_cancel_cap}</SecondaryButton.Text>
          </SecondaryButton>
          <PrimaryButton style={styles.submit} onPress={this.props.accept}>
            <PrimaryButton.Text>{s.strings.accept_button_text}</PrimaryButton.Text>
          </PrimaryButton>
        </View>
      </View>
    )
  }

  renderImage() {
    if (this.props.lobby && this.props.lobby.loginRequest && this.props.lobby.loginRequest.displayImageUrl) {
      return <Image style={styles.image} resizeMode="contain" source={{ uri: this.props.lobby.loginRequest.displayImageUrl }} />
    }
    return null
  }

  renderHeader() {
    let title = ''
    if (this.props.lobby && this.props.lobby.loginRequest) {
      title = this.props.lobby.loginRequest.displayName ? this.props.lobby.loginRequest.displayName : ''
    }
    if (this.props.lobby) {
      return (
        <View style={styles.header}>
          <View style={styles.headerTopShim} />
          <View style={styles.headerImageContainer}>{this.renderImage()}</View>
          <View style={styles.headerTopShim} />
          <View style={styles.headerTextRow}>
            <Text style={styles.bodyText}>{title}</Text>
          </View>
          <View style={styles.headerBottomShim} />
        </View>
      )
    }
    return <View style={styles.header} />
  }

  render() {
    if (!this.props.lobby && !this.props.error) {
      return (
        <SceneWrapper background="body">
          <View style={styles.spinnerContainer}>
            <Text style={styles.loadingTextBody}>{s.strings.edge_login_fetching}</Text>
            <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
          </View>
        </SceneWrapper>
      )
    }
    return (
      <SceneWrapper background="body">
        {this.renderHeader()}
        {this.renderBody()}
        {this.renderButtons()}
      </SceneWrapper>
    )
  }
}

const rawStyles = {
  header: {
    position: 'relative',
    flex: 3,
    flexDirection: 'column'
  },
  headerTopShim: {
    flex: 2
  },
  headerImageContainer: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  image: {
    width: 80,
    height: 80
  },
  headerTextRow: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  headerBottomShim: {
    flex: 1
  },
  body: {
    position: 'relative',
    flex: 4
  },
  buttonContainer: {
    position: 'relative',
    flex: 3,
    flexDirection: 'column',
    width: '100%',
    justifyContent: 'flex-end'
  },
  buttons: {
    marginRight: '5%',
    marginLeft: '5%',
    flexDirection: 'row',
    alignSelf: 'flex-end',
    paddingBottom: isIPhoneX ? 30 : 20
  },
  buttonsProcessing: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bodyText: {
    marginRight: '5%',
    marginLeft: '5%',
    color: THEME.COLORS.GRAY_1,
    fontSize: 18,
    textAlign: 'center',
    fontFamily: THEME.FONTS.DEFAULT
  },
  loadingTextBody: {
    color: THEME.COLORS.GRAY_1,
    fontSize: 18,
    textAlign: 'center',
    fontFamily: THEME.FONTS.DEFAULT,
    marginBottom: 20
  },
  cancel: {
    flex: 1,
    marginRight: '1.5%',
    backgroundColor: THEME.COLORS.GRAY_2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  cancelSolo: {
    flex: 1,
    backgroundColor: THEME.COLORS.GRAY_2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  submit: {
    flex: 1,
    marginLeft: '1.5%',
    backgroundColor: THEME.COLORS.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const EdgeLoginScene = connect(
  (state: RootState): StateProps => ({
    error: state.core.edgeLogin.error,
    isProcessing: state.core.edgeLogin.isProcessing,
    lobby: state.core.edgeLogin.lobby
  }),
  (dispatch: Dispatch): DispatchProps => ({
    accept() {
      dispatch(lobbyLogin())
    },
    decline() {
      Actions.pop()
    }
  })
)(EdgeLoginSceneComponent)
