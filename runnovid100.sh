#!/bin/bash
screen -S bbbload -dm bash -lc '
  cd ~/workspace/jitsi-loadtest-pupeter/
  TOTAL_USERS=100 CONCURRENCY=100 node index.js
'