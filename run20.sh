#!/bin/bash
screen -S bbbload -dm bash -lc '
  cd ~/workspace/jitsi-loadtest-pupeter/
  env $(cat .env | grep -v '^#' | xargs) node index.js
'