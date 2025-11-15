#!/bin/bash
screen -S bbbload -dm bash -lc '
  cd ~/workspace/jitsi-loadtest-pupeter/
  TOTAL_USERS=20 CONCURRENCY=20 node index.js
'