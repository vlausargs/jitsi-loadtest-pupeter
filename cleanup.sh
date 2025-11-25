#!/bin/bash
# NAME="bbbload"
# for id in $(screen -ls | awk -v n="$NAME" '$0 ~ n {print $1}'); do
#   screen -S "$id" -X quit
#   sleep 0.5
#   screen -S "$id" -X quit
# done
/usr/bin/pkill -TERM chrome || true

/usr/bin/pkill -9 -f 'node .*index\.js'

exit 0