#!/bin/bash

rn-nodeify --hack 
rm -rf ./node_modules/bcoin/.babelrc ./node_modules/edge-currency-bitcoin/node_modules/bcoin/.babelrc
rm -rf ./node_modules/bccoin/.babelrc ./node_modules/edge-currency-bitcoin/node_modules/bccoin/.babelrc
rm -rf ./node_modules/lcoin/.babelrc ./node_modules/edge-currency-bitcoin/node_modules/lcoin/.babelrc
