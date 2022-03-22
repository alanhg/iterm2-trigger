#!/usr/bin/env bash
DIR="$(dirname $0)"

/usr/local/bin/node "$DIR/iterm2-trigger.js" $1
exit 0;