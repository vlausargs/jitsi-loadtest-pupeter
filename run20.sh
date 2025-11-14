#!/bin/bash
screen -S bbbload -dm bash -lc '
  cd ~/workspace/jitsi-loadtest-pupeter/
  TOTAL_USERS=20 CONCURRENCY=20 VIDEO_ENABLE=true AUDIO_ENABLE=true node index1.js
'