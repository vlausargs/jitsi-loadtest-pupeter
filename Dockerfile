FROM ghcr.io/puppeteer/puppeteer:24.30.0

USER root

# ENV https_proxy=http://10.15.99.1:3128
# ENV http_proxy=http://10.15.99.1:3128

# RUN apt update -y && apt install -y \
#     ca-certificates \
#     fonts-liberation \
#     libasound2 \
#     libatk-bridge2.0-0 \
#     libatk1.0-0 \
#     libc6 \
#     libcairo2 \
#     libcups2 \
#     libexpat1 \
#     libfontconfig1 \
#     libgbm1 \
#     libglib2.0-0 \
#     libgtk-3-0 \
#     libnspr4 \
#     libnss3 \
#     libpango-1.0-0 \
#     libx11-6 \
#     libx11-xcb1 \
#     libxcb1 \
#     libxcomposite1 \
#     libxcursor1 \
#     libxdamage1 \
#     libxext6 \
#     libxfixes3 \
#     libxi6 \
#     libxrandr2 \
#     libxrender1 \
#     libxss1 \
#     libxtst6 \
#     lsb-release \
#     wget \
#     xdg-utils

RUN groupadd -r cachak -g 10000 && \
    useradd -r -u 10000 -g 10000 -m -s /bin/bash cachak

RUN mkdir -p /home/cachak/workspace/jitsi-loadtest-pupeter

WORKDIR /home/cachak/workspace/jitsi-loadtest-pupeter


RUN mkdir -p /home/cachak/app

WORKDIR /home/cachak/app

RUN chown -R cachak:cachak /home/cachak

COPY --chown=cachak:cachak package* /home/cachak/app

USER cachak

# RUN npx puppeteer browsers install chrome --verbose

RUN npm install --verbose