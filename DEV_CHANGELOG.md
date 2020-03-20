# edge-react-gui

## 1.12.0

- Add priority setting for exchange rate providers
- Fix white screen crash on settings screen
- Upgrade edge-login-ui-rn to v0.6.8
  - Added auto-scroll on terms and conditions screen
- Upgrade edge-currency-accountbased to v0.6.7
  - Add response error checking to fetch() calls
  - Fixed crash when Etherscan API returned text rather than a number by adding decimal and hex regex to response validation
