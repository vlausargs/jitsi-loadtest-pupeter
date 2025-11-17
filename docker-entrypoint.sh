#!/bin/bash
echo "Entrypoint script executed with the following environment variables:"
printenv|sort|grep -E 'TOTAL_USERS|CONCURRENCY|VIDEO_ENABLE|AUDIO_ENABLE|STAY_SECONDS|URL'
# cd /home/node/app
# npm install --verbose
TOTAL_USERS=${TOTAL_USERS} CONCURRENCY=${CONCURRENCY} VIDEO_ENABLE=${VIDEO_ENABLE} AUDIO_ENABLE=${AUDIO_ENABLE} STAY_SECONDS=${STAY_SECONDS} URL=${URL}  \
    node index.js
