 export const NEXT_BUTTON_HIDE = 'NEXT_BUTTON_HIDE'
 export const NEXT_BUTTON_SHOW = 'NEXT_BUTTON_SHOW'

 export function showNextButton () {
   return {
     type: NEXT_BUTTON_SHOW
   }
 }

 export function hideNextButton () {
   return {
     type: NEXT_BUTTON_HIDE
   }
 }
