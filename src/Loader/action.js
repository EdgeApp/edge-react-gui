export const LOADING_ON    	= 'LOADING_ON'                                                                                                        
export const LOADING_OFF  	= 'LOADING_OFF'                                                                                                        

export function openLoading(message) {
	return {
		type: LOADING_ON,
		message
	}
}

export function closeLoading() {
	return {
		type: LOADING_OFF
	}
}
