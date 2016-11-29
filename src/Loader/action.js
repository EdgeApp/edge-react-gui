export const LOADING_ON    	= 'LOADING_ON'                                                                                                        
export const LOADING_OFF  	= 'LOADING_OFF'                                                                                                        

export function openLoading() {
	return {
		type: LOADING_ON
	}
}

export function closeLoading() {
	return {
		type: LOADING_OFF
	}
}
