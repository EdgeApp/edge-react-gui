#! /bin/bash
path=../src/modules/UI/scenes/${1}
capitalizedName=$1
camelCaseName="${capitalizedName}"
actionConstant=$2

sudo chmod -R 777 $path

sudo mkdir $path

sed "s/MyDexOrders/${1}/g;s/myDexOrders/${camelCaseName}/g;s/MY_DEX_ORDER/${2}/g" variables.json > newVariables.json

for filename in ./*.mustache; do
  adjustedFilename=${filename//MyComponent/$1}
  finalizedFilename=${adjustedFilename//mustache/js}
  mustache newVariables.json $filename > ${path}/$finalizedFilename
done

