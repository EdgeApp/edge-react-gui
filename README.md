# airbitz-react-gui
Airbitz React Native GUI

## Troubleshooting

- Since this library depends upon the `airbitz-txlib-shitcoin` and `airbitz-core-js` libraries, make sure that those repositories are up to date (ideally with top-level folder a sibling of the airbitz-react-gui folder, and execute the `copy-core.sh` file from within the `airbitz-react-gui` folder. This shell file should copy over the two libraries into your node_modules folder.
- If you are having issues with reducers not showing changes in state, make sure you are importing the action name constants (eg `UPDATE_WALLETS_LIST`) from the correct files, especially if there are multiple files from which you are importing.
