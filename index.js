const { Cluster } = require('puppeteer-cluster');
const puppeteer = require('puppeteer');
const crypto = require('crypto');
const fs = require('fs');

const JOIN_URL = process.env.JOIN_URL || "https://meet.datanusantara.com/testingloadtest001";
const HEADLESS = (process.env.HEADLESS || 'true').toLowerCase() !== 'false'; // default true

const JITSI_TEST_SERVER_NAME = process.env.JITSI_TEST_SERVER_NAME || '';
const NAME_PREFIX = process.env.NAME_PREFIX || 'loadtest-';

const TOTAL_USERS = parseInt(process.env.TOTAL_USERS || '5', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5', 10);
const STAY_SECONDS = parseInt(process.env.STAY_SECONDS || '120', 10);
const VIDEO_ENABLE = process.env.VIDEO_ENABLE || false;
const VIDEO_PATH_Y4M = process.env.VIDEO_PATH_Y4M || 'output.y4m';

const AUDIO_ENABLE = process.env.AUDIO_ENABLE || false;
const AUDIO_PATH = process.env.AUDIO_PATH || 'test_audio.wav';

const RETRY_LIMIT = parseInt(process.env.RETRY_LIMIT || '2', 10);
const PER_TASK_TIMEOUT_MS = (STAY_SECONDS + 140) * 1000; // a bit over stay time
const NAV_TIMEOUT_MS = parseInt(process.env.NAV_TIMEOUT_MS || '60000', 10);
const SEL_TIMEOUT_MS = parseInt(process.env.SEL_TIMEOUT_MS || '30000', 10);

// delay antar cluster (30 detik)
const CLUSTER_RESTART_DELAY_MS = parseInt(process.env.CLUSTER_RESTART_DELAY_MS || '5000', 10);

const sessionID = crypto.randomUUID().split("-").pop();

function resolveChromiumExecutable() {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    const candidates = [
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium'
    ];
    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    // Fallback: let Puppeteer use its default (downloaded) binary
    return undefined;
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

const EXECUTABLE_PATH = resolveChromiumExecutable();
console.log('Using Chromium executable:', EXECUTABLE_PATH || '(Puppeteer default)');

const PUPPETEER_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-gpu',
    '--no-zygote',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',

    // media simulation
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    VIDEO_ENABLE ? `--use-file-for-fake-video-capture=${VIDEO_PATH_Y4M}` : null,
    AUDIO_ENABLE ? `--use-file-for-fake-audio-capture=${AUDIO_PATH}` : null,

    '--autoplay-policy=no-user-gesture-required',
    '--mute-audio',
    '--lang=en-US',
    '--window-size=800,600',
    '--js-flags=--max-old-space-size=128'
].filter(Boolean);

const main = async () => {
    console.log('=== Starting new cluster session ===');

    const cluster = await Cluster.launch({
        puppeteer,
        concurrency: Cluster.CONCURRENCY_CONTEXT, // memory-friendly
        maxConcurrency: CONCURRENCY,
        retryLimit: RETRY_LIMIT,
        retryDelay: 2000,
        timeout: PER_TASK_TIMEOUT_MS,
        monitor: true,
        puppeteerOptions: {
            headless: HEADLESS ? 'new' : false,
            executablePath: EXECUTABLE_PATH, // now using Chromium
            args: PUPPETEER_ARGS,
            defaultViewport: { width: 800, height: 600 }
        }
    });

    // Graceful shutdown khusus session ini
    const shutdown = async () => {
        try {
            console.log('Shutting down cluster...');
            await cluster.idle();   // tunggu semua task selesai
            await cluster.close();  // close semua browser
            console.log('Cluster shut down.');
        } catch (err) {
            console.error('Error during cluster shutdown:', err.message || err);
        }
    };

    // signal handler (optional, kalau kamu stop pakai Ctrl+C)
    const onSigint = async () => {
        await shutdown();
        process.exit(0);
    };
    process.once('SIGINT', onSigint);
    process.once('SIGTERM', onSigint);

    await cluster.task(async ({ page, data: { idx, name, joinUrl } }) => {
        page.setDefaultTimeout(SEL_TIMEOUT_MS);
        page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);

        await page.emulateMediaFeatures([
            { name: 'prefers-reduced-motion', value: 'reduce' }
        ]).catch(() => { });

        const realUA = await page.evaluate(() => navigator.userAgent).catch(() => null);
        if (realUA) {
            await page.setUserAgent(
                `${realUA} jitsi-LoadTest/${Math.random().toString(36).slice(2, 8)}`
            );
        }

        await page.setCacheEnabled(false).catch(() => { });

        await page.goto(joinUrl, { waitUntil: 'domcontentloaded' });

        if (VIDEO_ENABLE) {
            await page.waitForSelector('[aria-label="Start camera"]', { timeout: 5000 }).catch(() => { });
            await page.click('[aria-label="Start camera"]').catch(() => { });
        }

        if (AUDIO_ENABLE) {
            await page.waitForSelector('[aria-label="Unmute microphone"]', { timeout: 5000 }).catch(() => { });
            await page.click('[aria-label="Unmute microphone"]').catch(() => { });
        }

        // stay in room
        await sleep(STAY_SECONDS * 1000);
    });

    console.log(`Queuing ${TOTAL_USERS} users with concurrency ${CONCURRENCY}...`);
    for (let i = 0; i < TOTAL_USERS; i++) {
        const name = `${JITSI_TEST_SERVER_NAME}_${sessionID}_${NAME_PREFIX}_${i.toString().padStart(4, '0')}`;
        const joinUrl = `${JOIN_URL}#userInfo.displayName=%22${name}%22&config.prejoinConfig.enabled=false&config.notifications=[]`;
        cluster.queue({ idx: i, name, joinUrl });
    }

    // tunggu semua task selesai, lalu matikan cluster
    await shutdown();

    // lepas signal handler untuk sesi berikutnya
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigint);

    console.log('=== Cluster session complete ===');
};

// loop: hidupkan cluster, matikan, tunggu 30s, ulang lagi
(async () => {
    while (true) {
        try {
            await main();
        } catch (err) {
            console.error('Error in main():', err.message || err);
        }

        console.log(`Waiting ${CLUSTER_RESTART_DELAY_MS / 1000} seconds before recreating cluster...`);
        await sleep(CLUSTER_RESTART_DELAY_MS);
    }
})();
