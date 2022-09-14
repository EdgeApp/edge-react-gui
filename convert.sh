set -e

files="index.js $(find src -name '*.js' | grep -v injectThisInWebView.js | grep -v rolledUp.js | grep -v bridge.js | grep -v corePluginBundle.js)"
for x in $files; do
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
    sed -e 's/React[.$]StatelessFunctionalComponent/React.FunctionComponent/g' |
    sed -e 's/ Object / any /g' |

    # Fix utility types:
    sed -E 's/\$Call<([^,]*)[^>]*>/ReturnType<\1>/' |
    sed -E 's/\$Keys<([^>]*)>/keyof \1/' |
    sed -E 's/\$ElementType<([^,]*),([^>]*)>/\1[\2]/' |
    sed -E 's/\$PropertyType<([^,]*),([^>]*)>/\1[\2]/' |
    sed -E 's/$Exact<([^>]*)>/\1/' |
    sed -e 's/$Shape</Partial</' |

    # Mark `catch` statements with `any`:
    sed -E 's/} catch \(([^)]*)\) {/} catch (\1: any) {/' |

    # Fix `import type` syntax:
    sed -e 's/import type/import/' |
    sed -E 's/type ([_a-zA-Z0-9]+)($|,| [^=])/\1\2/g' |

    # Put back any "type" strings we removed incorrectly:
    sed -e 's/const of/const type of/' |
    sed -e 's/the of action/the type of action/' |

    # Remove shims:
    sed -e 's!.*// @ts-delete!!' |

    # We aren't JS anymore:
    sed -e 's!// $FlowFixMe!// @ts-expect-error!' |
    sed -e 's!// @flow!!' |
    sed -e "s/[.]js'$/'/" > $tsname

  if cat $x | grep -q -E '</|/>'; then
    mv $tsname ${tsname}x
  fi
  rm $x
done

yarn fix
git add index.ts src
git rm index.js convert.sh
git commit -m "x ./convert.sh" --no-verify
