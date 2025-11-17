#!/bin/bash
config=""
#001 021 041 061 081 101 121 141 161 181 201
for i in 001 021 041 061 081 101 121 141 161 181 201; do
    config="$config -f docker-compose.$i.yaml"
done
docker compose $config up -d $@ --build --force-recreate
