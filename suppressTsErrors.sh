set -e

node -r sucrase/register suppressTsErrors.ts script
yarn fix

git add src
git rm suppressTsErrors.ts
git commit -m "x ./suppressTsErrors.sh" --no-verify
