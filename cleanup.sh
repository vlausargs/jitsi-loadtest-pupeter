#!/bin/bash
NAME="bbbload"
for id in $(screen -ls | awk -v n="$NAME" '$0 ~ n {print $1}'); do
  screen -S "$id" -X quit
  sleep 0.5
  screen -S "$id" -X quit
done
pkill -TERM chrome || true

pkill -9 -f 'node .*index\.js'