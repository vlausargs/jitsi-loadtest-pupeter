#!/bin/bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

source ~/.bashrc

nvm install lts/jod
nvm use lts/jod
nvm alias default lts/jod