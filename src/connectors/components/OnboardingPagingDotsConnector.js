// @flow

import { connect } from 'react-redux'

// import * as Constants from '../../constants/indexConstants.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import PagingDots from '../../modules/UI/components/PagingDots/PagingDots.js'

export const mapStateToProps = (state: State) => ({
  totalItems: state.onBoarding.totalSlides,
  currentIndex: state.onBoarding.currentIndex
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
})

export default connect(mapStateToProps, mapDispatchToProps)(PagingDots)
