#!/bin/bash
screen -S bbbload -dm bash -lc '
  cd ~/workspace/jitsi-loadtest-pupeter/
  TOTAL_USERS=40 CONCURRENCY=40 node index.js
'