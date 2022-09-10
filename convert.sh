set -e

for x in $(find src -name '*.js' | grep -v index.flow.js); do
  echo Converting $x
  tsname=$(echo $x | sed s/js$/ts/)
  cat $x |
    # Change `+x` to `readonly x`:
    sed -E 's/^ *[+](\[?[_a-zA-Z0-9]+)/readonly \1/' |

    # Fix exact types:
    sed -e 's/{|/{/' |
    sed -e 's/|}/}/' |

    # Fix differently-named types:
    sed -e 's/mixed/unknown/g' |
    sed -e 's/\| void/| undefined/g' |
    sed -e 's/ Iterator</ IterableIterator</g' |
    sed -e 's/TimeoutID/ReturnType<typeof setTimeout>/g' |
    sed -e 's/React\.Node/React.ReactNode/g' |

    # Fix utility types:
    sed -E 's/\$Call<([^,]*)[^>]*>/ReturnType<\1>/' |
    sed -E 's/\$Keys<([^>]*)>/keyof \1/' |
    sed -E 's/\$PropertyType<([^,]*),([^>]*)>/\1[\2]/' |
    sed -e 's/$Shape</Partial</' |

    # Specific problems:
    sed -e "s/<Buttons: {/<Buttons extends {/" |

    # Fix `import type` syntax:
    sed -e 's/import type/import/' |
    sed -E 's/type ([_a-zA-Z0-9]+)($|,| [^=])/\1\2/g' |

    # We aren't JS anymore:
    sed -e 's!// $FlowFixMe!// @ts-expect-error!' |
    sed -e 's!// @flow!!' |
    sed -e "s/[.]js'$/'/" > $tsname

  if cat $x | grep -q -E '</|/>'; then
    mv $tsname ${tsname}x
  fi
  rm $x
done

#(cd ../../; yarn fix)
#git add src
#git rm convert.sh
#git commit -m "x (cd packages/edge-login-ui-rn; ./convert.sh)" --no-verify
