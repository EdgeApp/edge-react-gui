# edge-react-gui

## 1.12.0

- Upgrade edge-currency-accountbased to v0.6.7
  - Add response error checking to fetch() calls
  - Fixed crash when Etherscan API returned text rather than a number by adding decimal and hex regex to response validation
