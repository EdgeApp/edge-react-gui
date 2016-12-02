export const NAVIGATOR_NEXT    		= 'NAVIGATOR_NEXT'                                                                                                        
export const NAVIGATOR_PREVIOUS 	= 'NAVIGATOR_PREVIOUS'                                                                                                        

export function navigatorPush() {
	return {
		type: NAVIGATOR_NEXT
	}
}

export function navigatorPop() {
	return {
		type: NAVIGATOR_PREVIOUS
	}
}
