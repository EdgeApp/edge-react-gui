import { asObject, asOptional, asString } from 'cleaners'

import { ENV } from '../env'

const asIpApi = asObject({
  countryCode: asOptional(asString)
})

export const getCountryCodeByIp = async (): Promise<string | undefined> => {
  const apiKey = ENV.IP_API_KEY ?? ''

  try {
    const reply = await fetch(`https://pro.ip-api.com/json/?key=${apiKey}`)
    const { countryCode } = asIpApi(await reply.json())
    return countryCode
  } catch (e: any) {
    console.warn(`getCountryCodeByIp() failed: ${String(e)}`)
    return undefined
  }
}
