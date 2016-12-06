export const OPEN_LOG_IN            = 'OPEN_LOG_IN'                                                                                                        
export const CLOSE_LOG_IN           = 'CLOSE_LOG_IN'                                                                                                        
export const OPEN_LOG_IN_USING_PIN  = 'OPEN_LOG_IN_USING_PIN'                                                                                                        
export const CLOSE_LOG_IN_USING_PIN = 'CLOSE_LOG_IN_USING_PIN'                                                                                                        
export const LOG_IN_USERNAME        = 'LOG_IN_USERNAME'                                                                                                        
export const LOG_IN_PASSWORD        = 'LOG_IN_PASSWORD'                                                                                                        
export const LOG_IN_PIN             = 'LOG_IN_PIN'                                                                                                        

export function openLogin() {
  return {
    type: OPEN_LOG_IN
  }
}

export function closeLogin() {
  return {
    type: CLOSE_LOG_IN
  }
}

export function openLoginUsingPin() {
  return {
    type: OPEN_LOG_IN_USING_PIN
  }
}

export function closeLoginUsingPin() {
  return {
    type: CLOSE_LOG_IN_USING_PIN
  }
}

export function loginUsername(data) {
  return {
    type: LOG_IN_USERNAME,
    data
  }
}

export function loginPassword(data) {
  return {
    type: LOG_IN_PASSWORD,
    data
  }
}

export function loginPIN(data) {
  return {
    type: LOG_IN_PIN,
    data
  }
}
