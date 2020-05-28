#!/bin/sh
# Run as './scripts/find-unused-strings.sh'
# from the top-level edge-react-gui folder.

strings=$(jq -r 'keys[]' src/locales/strings/enUS.json)

for string in $strings; do
  count=$(git grep -c "$string" | grep -v src/locales/strings/ | wc -l)
  # echo $count $string
  if [ $count -le 1 ]; then
    echo unused: $string
  fi
done
