#!/bin/bash
screen -S bbbload -dm bash -lc '
  cd ~/workspace/jitsi-loadtest-pupeter/
  TOTAL_USERS=20 CONCURRENCY=20 VIDEO_ENABLE=true STAY_SECONDS=3000  node index.js
'
