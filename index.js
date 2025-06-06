// Import library baileys untuk WhatsApp API
const {
    default: makeWASocket,
    MessageType,
    MessageOptions,
    Mimetype,
    DisconnectReason,
    BufferJSON,
    AnyMessageContent,
    delay,
    fetchLatestBaileysVersion,
    isJidBroadcast,
    makeCacheableSignalKeyStore,
    MessageRetryMap,
    useMultiFileAuthState,
    msgRetryCounterMap
} = require("@whiskeysockets/baileys");

// Import library qrcode untuk generate QR code
const qrcode = require('qrcode');

// Import library pino untuk logging
const log = (pino = require("pino"));

// Konfigurasi session untuk autentikasi
const { session } = { "session": "baileys_auth_info" };

// Import library boom untuk handling error
const { Boom } = require("@hapi/boom");

// Import library path untuk manipulasi path file
const path = require('path');

// Import library fs untuk operasi file system
const fs = require('fs');

// Import library http dan https untuk server
const http = require('http');
const https = require('https');

// Import express dan middleware-nya
const express = require("express");
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require("body-parser");

// Inisialisasi express app
const app = require("express")()

// Konfigurasi file upload
app.use(fileUpload({
    createParentPath: true,
    limits: {
        fileSize: 50 * 1024 * 1024 // Batasi ukuran file maksimal 50MB
    },
    abortOnLimit: true,
    responseOnLimit: 'Ukuran file terlalu besar, maksimal 50MB'
}));

// Konfigurasi CORS yang lebih aman
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Konfigurasi untuk shared hosting
const port = process.env.PORT || 6001;
const host = process.env.HOST || '192.168.1.106';

// Setup server dan socket.io
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'], // Enable both WebSocket and polling
    pingTimeout: 60000, // Increase ping timeout to 60 seconds
    pingInterval: 25000, // Keep ping interval at 25 seconds
    allowEIO3: true,
    connectTimeout: 60000,
    maxHttpBufferSize: 1e8,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    upgradeTimeout: 60000,
    allowUpgrades: true,
    perMessageDeflate: {
        threshold: 2048
    },
    timeout: 60000,
    path: '/socket.io/',
    serveClient: false,
    cookie: false,
    allowRequest: (req, callback) => {
        callback(null, true);
    }
});

// Tambahkan middleware untuk menangani CORS di shared hosting
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Connection', 'keep-alive');
    res.header('Keep-Alive', 'timeout=60');
    next();
});

// Optimasi route untuk health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        connection: connectionState.connectionStatus,
        isAuthenticated: connectionState.isAuthenticated,
        lastConnectionTime: connectionState.lastConnectionTime,
        reconnectAttempts: connectionState.reconnectAttempts
    });
});

// Setup static file serving
app.use("/assets", express.static(__dirname + "/client/assets"));

// Route untuk halaman scan QR
app.get("/scan", (req, res) => {
    res.sendFile("./client/server.html", {
        root: __dirname,
    });
});

// Route untuk halaman utama
app.get("/", (req, res) => {
    res.sendFile("./client/server.html", {
        root: __dirname,
    });
});

// Fungsi untuk mengkapitalisasi huruf pertama setiap kata
function capital(textSound) {
    const arr = textSound.split(" ");
    for (var i = 0; i < arr.length; i++) {
        arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
    }
    const str = arr.join(" ");
    return str;
}

// Variabel global untuk socket dan QR
let sock;
let qr;
let soket;
let lastQRCode = null;
let connectionState = {
    isConnecting: false,
    lastConnectionAttempt: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    isAuthenticated: false,
    lastConnectionTime: null,
    connectionStatus: 'disconnected', // 'disconnected', 'connecting', 'connected'
    messageQueue: [] // Queue untuk menyimpan pesan yang gagal terkirim
};

// Tambahkan array template pesan untuk ping
const pingMessages = [
    // Status Sistem
    "🔄 Memeriksa koneksi sistem...",
    "📱 Status koneksi aktif",
    "✅ Sistem berjalan normal",
    "🔍 Verifikasi koneksi",
    "📶 Koneksi stabil",
    "💬 Sistem siap melayani",
    "⚡ Koneksi terkonfirmasi",
    "🌐 Jaringan terhubung",
    "📊 Status sistem normal",
    "🔐 Koneksi terverifikasi",

    // Pesan Ramah
    "👋 Halo! Sistem aktif",
    "😊 Semua berjalan baik",
    "👍 Koneksi optimal",
    "✨ Sistem berfungsi sempurna",
    "🌟 Layanan berjalan lancar",
    "💫 Koneksi prima",
    "🌈 Sistem dalam kondisi terbaik",
    "🎯 Target koneksi tercapai",
    "🎨 Sistem berwarna-warni",
    "🎭 Layanan siap 24/7",

    // Pesan Profesional
    "📈 Performa sistem optimal",
    "📉 Tidak ada gangguan",
    "📋 Status: Aktif",
    "📑 Sistem terverifikasi",
    "📝 Laporan koneksi normal",
    "📚 Database terhubung",
    "📌 Koneksi terjamin",
    "📍 Lokasi server aktif",
    "📎 Sistem terintegrasi",
    "📏 Metrik koneksi normal",

    // Pesan Teknis
    "🔧 Sistem terkalibrasi",
    "🔨 Koneksi terstruktur",
    "🔩 Jaringan terkonfigurasi",
    "⚙️ Sistem teroptimasi",
    "🔋 Daya sistem penuh",
    "🔌 Koneksi terpasang",
    "💻 Server merespons",
    "🖥️ Sistem online",
    "⌨️ Input terdeteksi",
    "🖱️ Output normal",

    // Pesan Alam
    "🌞 Sistem cerah",
    "🌙 Layanan malam aktif",
    "⭐ Koneksi bercahaya",
    "🌠 Sistem berkilau",
    "🌅 Layanan pagi aktif",
    "🌄 Sistem terbit",
    "🌊 Koneksi mengalir",
    "🌪️ Sistem berputar",
    "🌤️ Cuaca sistem cerah",
    "🌦️ Koneksi berawan",

    // Pesan Emoji
    "🎮 Sistem gaming",
    "🎲 Koneksi acak",
    "🎯 Target tercapai",
    "🎨 Sistem berwarna",
    "🎭 Layanan teater",
    "🎪 Sistem sirkus",
    "🎨 Koneksi artistik",
    "🎭 Performa panggung",
    "🎪 Layanan hiburan",
    "🎯 Akurasi tinggi",

    // Pesan Motivasi
    "💪 Sistem kuat",
    "💪 Koneksi tangguh",
    "💪 Layanan handal",
    "💪 Performa prima",
    "💪 Sistem siap",
    "💪 Koneksi mantap",
    "💪 Layanan terbaik",
    "💪 Sistem unggul",
    "💪 Koneksi hebat",
    "💪 Layanan terpercaya",

    // Pesan Teknologi
    "🤖 Sistem robotik",
    "👾 Koneksi alien",
    "🤖 Layanan AI",
    "👾 Sistem futuristik",
    "🤖 Koneksi cerdas",
    "👾 Layanan digital",
    "🤖 Sistem otomatis",
    "👾 Koneksi virtual",
    "🤖 Layanan smart",
    "👾 Sistem modern",

    // Pesan Keamanan
    "🔒 Sistem terenkripsi",
    "🔐 Koneksi aman",
    "🔑 Layanan terproteksi",
    "🔒 Sistem terjamin",
    "🔐 Koneksi terpercaya",
    "🔑 Layanan terjamin",
    "🔒 Sistem terproteksi",
    "🔐 Koneksi terenkripsi",
    "🔑 Layanan aman",
    "🔒 Sistem terjamin",

    // Pesan Status
    "📱 Sistem mobile",
    "💻 Koneksi desktop",
    "🖥️ Layanan server",
    "📱 Sistem portable",
    "💻 Koneksi laptop",
    "🖥️ Layanan cloud",
    "📱 Sistem wireless",
    "💻 Koneksi wired",
    "🖥️ Layanan hybrid",
    "📱 Sistem universal"
];

// Fungsi untuk mendapatkan pesan random
const getRandomPingMessage = () => {
    const randomIndex = Math.floor(Math.random() * pingMessages.length);
    return pingMessages[randomIndex];
};

// Fungsi untuk menyimpan state koneksi
const saveConnectionState = () => {
    try {
        const state = {
            isAuthenticated: connectionState.isAuthenticated,
            lastConnectionTime: connectionState.lastConnectionTime,
            connectionStatus: connectionState.connectionStatus
        };
        fs.writeFileSync('connection_state.json', JSON.stringify(state));
    } catch (error) {
        console.error('Error saving connection state:', error);
        // Jangan throw error, biarkan aplikasi tetap berjalan
    }
};

// Fungsi untuk memuat state koneksi
const loadConnectionState = () => {
    try {
        if (fs.existsSync('connection_state.json')) {
            const state = JSON.parse(fs.readFileSync('connection_state.json'));
            connectionState.isAuthenticated = state.isAuthenticated;
            connectionState.lastConnectionTime = state.lastConnectionTime;
            connectionState.connectionStatus = state.connectionStatus;
        }
    } catch (error) {
        console.error('Error loading connection state:', error);
        // Reset ke default state jika terjadi error
        connectionState = {
            isConnecting: false,
            lastConnectionAttempt: null,
            reconnectAttempts: 0,
            maxReconnectAttempts: 5,
            isAuthenticated: false,
            lastConnectionTime: null,
            connectionStatus: 'disconnected',
            messageQueue: []
        };
    }
};

// Fungsi untuk handle pesan yang gagal terkirim
const handleFailedMessages = async () => {
    try {
        if (!isConnected() || connectionState.messageQueue.length === 0) {
            return;
        }

        logger.info(`Processing ${connectionState.messageQueue.length} failed messages...`);
        const failedMessages = [...connectionState.messageQueue];
        connectionState.messageQueue = [];

        for (const message of failedMessages) {
            try {
                // Tambahkan delay antara setiap pesan
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Coba kirim pesan
                const result = await sock.sendMessage(message.to, message.content);
                logger.success(`Successfully sent queued message to: ${message.to}`);

                // Tunggu sebentar sebelum mencoba pesan berikutnya
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                logger.error(`Failed to send queued message to ${message.to}:`, error);

                // Jika gagal, tambahkan kembali ke queue dengan timestamp
                connectionState.messageQueue.push({
                    ...message,
                    retryCount: (message.retryCount || 0) + 1,
                    lastAttempt: Date.now()
                });

                // Jika sudah mencoba lebih dari 3 kali, hapus dari queue
                if ((message.retryCount || 0) >= 3) {
                    logger.warn(`Message to ${message.to} removed from queue after 3 failed attempts`);
                    continue;
                }
            }
        }

        // Simpan state setelah selesai memproses
        saveConnectionState();
    } catch (error) {
        logger.error('Error handling failed messages:', error);
        // Jangan throw error, biarkan aplikasi tetap berjalan
    }
};

// Setup logging system
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Konfigurasi log retention
const LOG_RETENTION_DAYS = 7; // Simpan log selama 7 hari
const LOG_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // Bersihkan log setiap 24 jam

// Fungsi untuk membersihkan log lama
const cleanupOldLogs = () => {
    try {
        const now = Date.now();
        const files = fs.readdirSync(logDir);

        files.forEach(file => {
            const filePath = path.join(logDir, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtime.getTime();
            const maxAge = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

            if (fileAge > maxAge) {
                fs.unlinkSync(filePath);
                logger.info(`Deleted old log file: ${file}`);
            }
        });
    } catch (error) {
        logger.error('Error cleaning up old logs:', error);
    }
};

// Jalankan cleanup pertama kali saat server start
cleanupOldLogs();

// Setup interval untuk cleanup otomatis
setInterval(cleanupOldLogs, LOG_CLEANUP_INTERVAL);

// Fungsi untuk format tanggal
const getTimestamp = () => {
    const now = new Date();
    return now.toISOString();
};

// In-memory log storage untuk akses cepat
const logStorage = {
    error: [],
    warn: [],
    info: [],
    success: []
};

// Batasi jumlah log yang disimpan di memory
const MAX_MEMORY_LOGS = 1000;

// Fungsi untuk menulis log ke file dan memory
const writeLog = (type, message, error = null) => {
    const timestamp = getTimestamp();
    const logFile = path.join(logDir, `${type}-${new Date().toISOString().split('T')[0]}.log`);

    let logMessage = `[${timestamp}] ${message}`;
    if (error) {
        logMessage += `\nError: ${error.message}\nStack: ${error.stack}`;
    }
    logMessage += '\n----------------------------------------\n';

    // Tulis ke file
    try {
        fs.appendFileSync(logFile, logMessage);
    } catch (err) {
        console.error('Error writing to log file:', err);
    }

    // Simpan di memory
    logStorage[type].unshift({
        timestamp,
        message,
        error: error ? {
            message: error.message,
            stack: error.stack
        } : null
    });

    // Batasi jumlah log di memory
    if (logStorage[type].length > MAX_MEMORY_LOGS) {
        logStorage[type].pop();
    }

    // Tulis ke console dengan warna
    const colors = {
        error: '\x1b[31m',
        warn: '\x1b[33m',
        info: '\x1b[36m',
        success: '\x1b[32m'
    };
    const reset = '\x1b[0m';

    console.log(`${colors[type] || ''}${logMessage}${reset}`);
};

// Export fungsi logging
const logger = {
    error: (message, error) => writeLog('error', message, error),
    warn: (message) => writeLog('warn', message),
    info: (message) => writeLog('info', message),
    success: (message) => writeLog('success', message)
};

// Tambahkan route untuk melihat log
app.get('/logs', (req, res) => {
    const type = req.query.type || 'all';
    const limit = parseInt(req.query.limit) || 100;

    let logs = [];
    if (type === 'all') {
        Object.keys(logStorage).forEach(key => {
            logs = logs.concat(logStorage[key].slice(0, limit));
        });
    } else if (logStorage[type]) {
        logs = logStorage[type].slice(0, limit);
    }

    // Sort berdasarkan timestamp terbaru
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
        status: 'success',
        data: logs
    });
});

// Route untuk melihat log file
app.get('/logs/file', (req, res) => {
    const type = req.query.type || 'error';
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const logFile = path.join(logDir, `${type}-${date}.log`);

    try {
        if (fs.existsSync(logFile)) {
            const content = fs.readFileSync(logFile, 'utf8');
            res.send(content);
        } else {
            res.status(404).json({
                status: 'error',
                message: 'Log file not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Route untuk melihat status server
app.get('/status', (req, res) => {
    const status = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        memory: process.memoryUsage(),
        connection: {
            status: connectionState.connectionStatus,
            isAuthenticated: connectionState.isAuthenticated,
            lastConnectionTime: connectionState.lastConnectionTime,
            reconnectAttempts: connectionState.reconnectAttempts
        },
        logs: {
            error: logStorage.error.length,
            warn: logStorage.warn.length,
            info: logStorage.info.length,
            success: logStorage.success.length
        }
    };

    res.json({
        status: 'success',
        data: status
    });
});

// Route untuk melihat log terbaru
app.get('/logs/latest', (req, res) => {
    const type = req.query.type || 'all';
    const limit = parseInt(req.query.limit) || 10;

    let logs = [];
    if (type === 'all') {
        Object.keys(logStorage).forEach(key => {
            logs = logs.concat(logStorage[key].slice(0, limit));
        });
    } else if (logStorage[type]) {
        logs = logStorage[type].slice(0, limit);
    }

    // Sort berdasarkan timestamp terbaru
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
        status: 'success',
        data: logs
    });
});

// Fungsi untuk koneksi ke WhatsApp
async function connectToWhatsApp() {
    try {
        logger.info('Starting WhatsApp connection...');
        const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
        let { version, isLatest } = await fetchLatestBaileysVersion();

        logger.info(`Using Baileys version: ${version}, isLatest: ${isLatest}`);

        sock = makeWASocket({
            auth: state,
            logger: log({ level: "silent" }),
            version,
            shouldIgnoreJid: jid => isJidBroadcast(jid),
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            retryRequestDelayMs: 250,
            markOnlineOnConnect: true,
            keepAliveIntervalMs: 30000,
            emitOwnEvents: true,
            generateHighQualityLinkPreview: true,
            browser: ['Chrome (Linux)', '', ''],
            getMessage: async () => {
                return { conversation: "Hello" }
            }
        });

        sock.multi = true;

        // Tambahkan error handler untuk socket
        sock.ev.on('error', async (err) => {
            logger.error('WhatsApp socket error:', err);
            if (!connectionState.isConnecting) {
                await handleReconnection();
            }
        });

        sock.ev.on('connection.update', async (update) => {
            try {
                const { connection, lastDisconnect } = update;
                logger.info(`Connection update: ${connection}`);

                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    connectionState.connectionStatus = 'disconnected';
                    logger.warn(`Connection closed with status code: ${statusCode}`);

                    if (statusCode === DisconnectReason.badSession) {
                        logger.error(`Bad Session File, Please Delete ${session} and Scan Again`);
                        await resetSession();
                    } else if (statusCode === DisconnectReason.connectionClosed ||
                        statusCode === DisconnectReason.connectionLost ||
                        statusCode === DisconnectReason.timedOut) {
                        logger.warn("Connection lost, attempting to reconnect...");
                        await handleReconnection();
                    } else if (statusCode === DisconnectReason.connectionReplaced) {
                        logger.warn("Connection Replaced, Another New Session Opened");
                        await resetSession();
                    } else if (statusCode === DisconnectReason.loggedOut) {
                        logger.error(`Device Logged Out, Please Delete ${session} and Scan Again.`);
                        await resetSession();
                    } else if (statusCode === DisconnectReason.restartRequired) {
                        logger.warn("Restart Required, Restarting...");
                        await handleReconnection();
                    } else {
                        logger.warn(`Unknown DisconnectReason: ${statusCode}`);
                        await handleReconnection();
                    }
                } else if (connection === 'open') {
                    logger.success('Connection opened successfully');
                    connectionState.reconnectAttempts = 0;
                    connectionState.isAuthenticated = true;
                    connectionState.connectionStatus = 'connected';
                    connectionState.lastConnectionTime = Date.now();

                    // Coba kirim ulang pesan yang gagal
                    await handleFailedMessages();
                }

                if (update.qr && !connectionState.isAuthenticated) {
                    qr = update.qr;
                    logger.info('New QR Code received');
                    updateQR("qr");
                } else if (!qr && update.connection !== "open" && !connectionState.isAuthenticated) {
                    logger.info('Waiting for QR Code...');
                    updateQR("loading");
                } else if (update.connection === "open") {
                    logger.success('QR Code scanned successfully');
                    updateQR("qrscanned");
                }

                saveConnectionState();
            } catch (error) {
                logger.error('Error in connection.update handler', error);
                // Coba reconnect jika terjadi error
                if (!connectionState.isConnecting) {
                    await handleReconnection();
                }
            }
        });

        sock.ev.on("creds.update", saveCreds);
        logger.success('WhatsApp connection setup completed');

    } catch (error) {
        logger.error('Error in connectToWhatsApp', error);
        connectionState.connectionStatus = 'disconnected';
        saveConnectionState();

        // Coba reconnect setelah delay
        setTimeout(async () => {
            if (!connectionState.isConnecting) {
                await handleReconnection();
            }
        }, 5000);
    }
}

// Fungsi untuk cek koneksi
const isConnected = () => {
    return sock?.user ? true : false;
};

// Optimasi fungsi handleReconnection
const handleReconnection = async () => {
    if (connectionState.isConnecting) {
        logger.info('Reconnection already in progress, skipping...');
        return false;
    }

    const now = Date.now();
    if (connectionState.lastConnectionAttempt && (now - connectionState.lastConnectionAttempt) < 5000) {
        logger.info('Too soon to attempt reconnection, skipping...');
        return false;
    }

    connectionState.isConnecting = true;
    connectionState.lastConnectionAttempt = now;
    connectionState.reconnectAttempts++;
    connectionState.connectionStatus = 'connecting';

    try {
        // Cek apakah user sudah logout
        if (sock?.user?.id) {
            try {
                // Gunakan pesan random untuk ping
                const pingMessage = getRandomPingMessage();
                await sock.sendMessage(sock.user.id, { text: pingMessage });
                logger.success('Koneksi WhatsApp masih aktif');
                connectionState.connectionStatus = 'connected';
                connectionState.isConnecting = false;
                return true;
            } catch (error) {
                logger.warn('Koneksi WhatsApp terputus, mencoba reconnect...', error);
            }
        }

        // Jika tidak terhubung atau gagal ping, lakukan reconnect
        await connectToWhatsApp();

        // Tunggu lebih lama untuk memastikan koneksi terbentuk
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Coba beberapa kali untuk memverifikasi koneksi
        let attempts = 0;
        const maxAttempts = 3;
        let lastError = null;

        while (attempts < maxAttempts) {
            try {
                if (!sock?.user?.id) {
                    logger.warn('User ID tidak tersedia, mencoba lagi...');
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                }

                // Tunggu sebentar sebelum mencoba mengirim pesan
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Gunakan pesan random untuk verifikasi
                const pingMessage = getRandomPingMessage();
                await sock.sendMessage(sock.user.id, { text: pingMessage });
                logger.success('Reconnect berhasil dan koneksi terverifikasi');
                connectionState.connectionStatus = 'connected';
                connectionState.reconnectAttempts = 0;
                connectionState.isConnecting = false;

                // Coba kirim ulang pesan yang gagal
                await handleFailedMessages();
                return true;
            } catch (error) {
                lastError = error;
                attempts++;
                logger.warn(`Percobaan verifikasi koneksi ${attempts}/${maxAttempts} gagal:`, error);

                if (attempts < maxAttempts) {
                    // Tunggu sebentar sebelum mencoba lagi
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }

        logger.error('Gagal verifikasi koneksi setelah beberapa percobaan:', lastError);
        connectionState.connectionStatus = 'disconnected';
        return false;
    } catch (error) {
        logger.error('Reconnection error:', error);
        connectionState.connectionStatus = 'disconnected';
        return false;
    } finally {
        connectionState.isConnecting = false;
        saveConnectionState();
    }
};

// Fungsi untuk mereset session
const resetSession = async () => {
    try {
        // Hapus isi folder baileys_auth_info tanpa menghapus folder utamanya
        if (fs.existsSync('baileys_auth_info')) {
            const files = fs.readdirSync('baileys_auth_info');
            for (const file of files) {
                try {
                    const filePath = path.join('baileys_auth_info', file);
                    if (fs.lstatSync(filePath).isDirectory()) {
                        fs.rmSync(filePath, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(filePath);
                    }
                } catch (error) {
                    console.error(`Error deleting file ${file}:`, error);
                }
            }
            console.log('Session contents deleted successfully');
        }

        // Reset connection state
        connectionState = {
            isConnecting: false,
            lastConnectionAttempt: null,
            reconnectAttempts: 0,
            maxReconnectAttempts: 5,
            isAuthenticated: false,
            lastConnectionTime: null,
            connectionStatus: 'disconnected',
            messageQueue: []
        };

        // Hapus file connection state
        try {
            if (fs.existsSync('connection_state.json')) {
                fs.unlinkSync('connection_state.json');
            }
        } catch (error) {
            console.error('Error deleting connection state file:', error);
        }

        // Reset QR code
        qr = null;
        lastQRCode = null;

        // Update status ke client
        soket?.emit("qrstatus", "./assets/loader.gif");
        soket?.emit("log", "Session telah direset. Silakan scan QR code baru.");

        // Reconnect dengan session baru
        await connectToWhatsApp();
    } catch (error) {
        console.error('Error resetting session:', error);
        soket?.emit("log", "Gagal mereset session. Silakan refresh halaman.");
    }
};

// Optimasi route untuk kirim pesan
app.post("/send-message", async (req, res) => {
    const pesankirim = req.body.message;
    const number = req.body.number;
    const fileDikirim = req.files;

    let numberWA;
    try {
        if (!number) {
            return res.status(500).json({
                status: false,
                response: 'Nomor WA belum disertakan!'
            });
        }

        numberWA = '62' + number.substring(1) + "@s.whatsapp.net";

        if (!isConnected()) {
            // Simpan pesan ke queue jika tidak terhubung
            connectionState.messageQueue.push({
                to: numberWA,
                content: { text: pesankirim }
            });
            return res.status(200).json({
                status: true,
                response: 'Pesan akan dikirim setelah koneksi tersedia'
            });
        }

        const exists = await sock.onWhatsApp(numberWA);
        if (!exists?.jid && !(exists && exists[0]?.jid)) {
            return res.status(500).json({
                status: false,
                response: `Nomor ${number} tidak terdaftar.`
            });
        }

        // Handle pengiriman pesan
        if (!req.files) {
            try {
                const result = await sock.sendMessage(exists.jid || exists[0].jid, { text: pesankirim });
                return res.status(200).json({
                    status: true,
                    response: result
                });
            } catch (error) {
                // Simpan pesan ke queue jika gagal
                connectionState.messageQueue.push({
                    to: exists.jid || exists[0].jid,
                    content: { text: pesankirim }
                });
                throw error;
            }
        }

        // Handle pengiriman file
        // ... existing file handling code ...

    } catch (err) {
        console.error('Error sending message:', err);
        return res.status(500).json({
            status: false,
            response: err.message || 'Error sending message'
        });
    }
});

// send group message
app.post("/send-group-message", async (req, res) => {
    //console.log(req);
    const pesankirim = req.body.message;
    const id_group = req.body.id_group;
    const fileDikirim = req.files;
    let idgroup;
    let exist_idgroup;
    try {
        if (isConnected) {
            if (!req.files) {
                if (!id_group) {
                    res.status(500).json({
                        status: false,
                        response: 'Nomor Id Group belum disertakan!'
                    });
                }
                else {
                    let exist_idgroup = await sock.groupMetadata(id_group);
                    console.log(exist_idgroup.id);
                    console.log("isConnected");
                    if (exist_idgroup?.id || (exist_idgroup && exist_idgroup[0]?.id)) {
                        sock.sendMessage(id_group, { text: pesankirim })
                            .then((result) => {
                                res.status(200).json({
                                    status: true,
                                    response: result,
                                });
                                console.log("succes terkirim");
                            })
                            .catch((err) => {
                                res.status(500).json({
                                    status: false,
                                    response: err,
                                });
                                console.log("error 500");
                            });
                    } else {
                        res.status(500).json({
                            status: false,
                            response: `ID Group ${id_group} tidak terdaftar.`,
                        });
                        console.log(`ID Group ${id_group} tidak terdaftar.`);
                    }
                }

            } else {
                //console.log('Kirim document');
                if (!id_group) {
                    res.status(500).json({
                        status: false,
                        response: 'Id Group tidak disertakan!'
                    });
                }
                else {
                    exist_idgroup = await sock.groupMetadata(id_group);
                    console.log(exist_idgroup.id);
                    //console.log('Kirim document ke group'+ exist_idgroup.subject);

                    let filesimpan = req.files.file_dikirim;
                    var file_ubah_nama = new Date().getTime() + '_' + filesimpan.name;
                    //pindahkan file ke dalam upload directory
                    filesimpan.mv('./uploads/' + file_ubah_nama);
                    let fileDikirim_Mime = filesimpan.mimetype;
                    //console.log('Simpan document '+fileDikirim_Mime);
                    if (isConnected) {
                        if (exist_idgroup?.id || (exist_idgroup && exist_idgroup[0]?.id)) {
                            let namafiledikirim = './uploads/' + file_ubah_nama;
                            let extensionName = path.extname(namafiledikirim);
                            //console.log(extensionName);
                            if (extensionName === '.jpeg' || extensionName === '.jpg' || extensionName === '.png' || extensionName === '.gif') {
                                await sock.sendMessage(exist_idgroup.id || exist_idgroup[0].id, {
                                    image: {
                                        url: namafiledikirim
                                    },
                                    caption: pesankirim
                                }).then((result) => {
                                    if (fs.existsSync(namafiledikirim)) {
                                        fs.unlink(namafiledikirim, (err) => {
                                            if (err && err.code == "ENOENT") {
                                                // file doens't exist
                                                console.info("File doesn't exist, won't remove it.");
                                            } else if (err) {
                                                console.error("Error occurred while trying to remove file.");
                                            }
                                            //console.log('File deleted!');
                                        });
                                    }
                                    res.send({
                                        status: true,
                                        message: 'Success',
                                        data: {
                                            name: filesimpan.name,
                                            mimetype: filesimpan.mimetype,
                                            size: filesimpan.size
                                        }
                                    });
                                }).catch((err) => {
                                    res.status(500).json({
                                        status: false,
                                        response: err,
                                    });
                                    console.log('pesan gagal terkirim');
                                });
                            } else if (extensionName === '.mp3' || extensionName === '.ogg') {
                                await sock.sendMessage(exist_idgroup.id || exist_idgroup[0].id, {
                                    audio: {
                                        url: namafiledikirim,
                                        caption: pesankirim
                                    },
                                    mimetype: 'audio/mp4'
                                }).then((result) => {
                                    if (fs.existsSync(namafiledikirim)) {
                                        fs.unlink(namafiledikirim, (err) => {
                                            if (err && err.code == "ENOENT") {
                                                // file doens't exist
                                                console.info("File doesn't exist, won't remove it.");
                                            } else if (err) {
                                                console.error("Error occurred while trying to remove file.");
                                            }
                                            //console.log('File deleted!');
                                        });
                                    }
                                    res.send({
                                        status: true,
                                        message: 'Success',
                                        data: {
                                            name: filesimpan.name,
                                            mimetype: filesimpan.mimetype,
                                            size: filesimpan.size
                                        }
                                    });
                                }).catch((err) => {
                                    res.status(500).json({
                                        status: false,
                                        response: err,
                                    });
                                    console.log('pesan gagal terkirim');
                                });
                            } else {
                                await sock.sendMessage(exist_idgroup.id || exist_idgroup[0].id, {
                                    document: {
                                        url: namafiledikirim,
                                        caption: pesankirim
                                    },
                                    mimetype: fileDikirim_Mime,
                                    fileName: filesimpan.name
                                }).then((result) => {
                                    if (fs.existsSync(namafiledikirim)) {
                                        fs.unlink(namafiledikirim, (err) => {
                                            if (err && err.code == "ENOENT") {
                                                // file doens't exist
                                                console.info("File doesn't exist, won't remove it.");
                                            } else if (err) {
                                                console.error("Error occurred while trying to remove file.");
                                            }
                                            //console.log('File deleted!');
                                        });
                                    }

                                    setTimeout(() => {
                                        sock.sendMessage(exist_idgroup.id || exist_idgroup[0].id, { text: pesankirim });
                                    }, 1000);

                                    res.send({
                                        status: true,
                                        message: 'Success',
                                        data: {
                                            name: filesimpan.name,
                                            mimetype: filesimpan.mimetype,
                                            size: filesimpan.size
                                        }
                                    });
                                }).catch((err) => {
                                    res.status(500).json({
                                        status: false,
                                        response: err,
                                    });
                                    console.log('pesan gagal terkirim');
                                });
                            }
                        } else {
                            res.status(500).json({
                                status: false,
                                response: `Nomor ${number} tidak terdaftar.`,
                            });
                        }
                    } else {
                        res.status(500).json({
                            status: false,
                            response: `WhatsApp belum terhubung.`,
                        });
                    }
                }
            }

            //end is connected
        } else {
            res.status(500).json({
                status: false,
                response: `WhatsApp belum terhubung.`,
            });
        }

        //end try
    } catch (err) {
        res.status(500).send(err);
    }

});

// Tambahkan route untuk reset session manual
app.post("/reset-session", async (req, res) => {
    try {
        await resetSession();
        res.status(200).json({
            status: true,
            message: "Session berhasil direset"
        });
    } catch (error) {
        console.error('Error in reset-session route:', error);
        res.status(500).json({
            status: false,
            message: "Gagal mereset session"
        });
    }
});

// Optimasi route untuk reconnect
app.post('/reconnect', async (req, res) => {
    try {
        if (connectionState.reconnectAttempts < connectionState.maxReconnectAttempts) {
            const reconnectSuccess = await handleReconnection();

            if (reconnectSuccess) {
                res.status(200).json({
                    status: true,
                    message: "Reconnect berhasil dilakukan dan koneksi terverifikasi"
                });
            } else {
                res.status(500).json({
                    status: false,
                    message: "Reconnect gagal - koneksi tidak dapat diverifikasi"
                });
            }
        } else {
            res.status(500).json({
                status: false,
                message: "Maksimum percobaan reconnect telah tercapai"
            });
        }
    } catch (error) {
        console.error('Error in reconnect route:', error);
        res.status(500).json({
            status: false,
            message: "Gagal melakukan reconnect: " + error.message
        });
    }
});

// Tambahkan event handler untuk socket.io
io.on("connection", async (socket) => {
    try {
        soket = socket;
        logger.info(`Client connected: ${socket.id}`);

        // Load state saat koneksi baru
        loadConnectionState();

        // Tambahkan error handler untuk socket
        socket.on('error', (error) => {
            logger.error('Socket error', error);
            try {
                if (socket.connected) {
                    socket.disconnect();
                }
                // Tunggu sebentar sebelum mencoba reconnect
                setTimeout(() => {
                    io.emit('reconnect_attempt');
                }, 5000);
            } catch (err) {
                logger.error('Error handling socket error:', err);
            }
        });

        // Implementasi heartbeat yang lebih robust
        let missedHeartbeats = 0;
        const MAX_MISSED_HEARTBEATS = 3;
        const HEARTBEAT_INTERVAL = 15000; // 15 detik
        const HEARTBEAT_TIMEOUT = 5000; // 5 detik timeout

        const heartbeat = setInterval(() => {
            try {
                if (socket.connected) {
                    socket.emit('ping');
                    logger.info(`Heartbeat sent to client: ${socket.id}`);

                    // Set timeout untuk menunggu pong
                    const timeout = setTimeout(() => {
                        missedHeartbeats++;
                        logger.warn(`Missed heartbeat ${missedHeartbeats}/${MAX_MISSED_HEARTBEATS} for client: ${socket.id}`);

                        if (missedHeartbeats >= MAX_MISSED_HEARTBEATS) {
                            logger.error(`Client ${socket.id} missed too many heartbeats, forcing reconnect`);
                            clearInterval(heartbeat);
                            clearTimeout(timeout);
                            socket.disconnect(true);
                            setTimeout(() => {
                                io.emit('reconnect_attempt');
                            }, 5000);
                        }
                    }, HEARTBEAT_TIMEOUT);

                    socket.once('pong', () => {
                        clearTimeout(timeout);
                        missedHeartbeats = 0;
                        logger.info(`Heartbeat received from client: ${socket.id}`);
                    });
                } else {
                    logger.warn(`Client not connected, attempting reconnect: ${socket.id}`);
                    clearInterval(heartbeat);
                    setTimeout(() => {
                        io.emit('reconnect_attempt');
                    }, 5000);
                }
            } catch (error) {
                logger.error('Heartbeat error', error);
                clearInterval(heartbeat);
            }
        }, HEARTBEAT_INTERVAL);

        // Cleanup saat disconnect
        socket.on('disconnect', (reason) => {
            logger.warn(`Client disconnected, reason: ${reason}, socket id: ${socket.id}`);
            clearInterval(heartbeat);
            missedHeartbeats = 0;

            if (reason === 'ping timeout' || reason === 'transport close' || reason === 'transport error') {
                logger.info(`Attempting to reconnect client: ${socket.id}`);
                setTimeout(() => {
                    try {
                        if (!socket.connected) {
                            io.emit('reconnect_attempt');
                            logger.info(`Reconnect attempt for client: ${socket.id}`);
                        }
                    } catch (error) {
                        logger.error('Reconnect error', error);
                        setTimeout(() => {
                            try {
                                io.emit('reconnect_attempt');
                            } catch (err) {
                                logger.error('Second reconnect attempt failed:', err);
                            }
                        }, 10000);
                    }
                }, 5000);
            }

            saveConnectionState();
        });

        // Tambahkan event handler untuk transport
        socket.on('transport', (transport) => {
            logger.info('Client transport changed to:', transport, 'socket id:', socket.id);
        });

        // Handle request reset session
        socket.on('request_reset_session', async () => {
            try {
                await resetSession();
            } catch (error) {
                logger.error('Reset session error:', error);
                socket.emit('log', 'Gagal mereset session: ' + error.message);
            }
        });

        socket.on('request_reconnect', async () => {
            try {
                if (connectionState.reconnectAttempts < connectionState.maxReconnectAttempts) {
                    await handleReconnection();
                } else {
                    socket.emit('log', 'Maximum reconnection attempts reached. Please refresh the page.');
                }
            } catch (error) {
                logger.error('Reconnect request error:', error);
                socket.emit('log', 'Gagal melakukan reconnect: ' + error.message);
            }
        });

        // Send initial state
        try {
            if (isConnected()) {
                connectionState.connectionStatus = 'connected';
                updateQR("connected");
            } else if (connectionState.isAuthenticated) {
                soket.emit("qrstatus", "./assets/loader.gif");
                soket.emit("log", "Menggunakan sesi yang tersimpan...");
                connectionState.connectionStatus = 'connecting';
            } else if (lastQRCode) {
                soket.emit("qr", lastQRCode);
                soket.emit("log", "QR Code received, please scan!");
            } else if (qr) {
                updateQR("qr");
            } else {
                soket.emit("qrstatus", "./assets/loader.gif");
                soket.emit("log", "Initializing connection...");
            }
        } catch (error) {
            logger.error('Error sending initial state:', error);
        }

        saveConnectionState();
    } catch (error) {
        logger.error('Connection handler error', error);
    }
});

// Tambahkan konfigurasi Socket.IO yang lebih robust
io.engine.on("connection_error", (err) => {
    logger.error('Connection error:', err);
    // Tunggu sebentar sebelum mencoba reconnect
    setTimeout(() => {
        io.emit('reconnect_attempt');
    }, 5000);
});

// Tambahkan event handler untuk reconnection
io.on('reconnect_attempt', () => {
    logger.info('Attempting to reconnect...');

    // Implementasi exponential backoff untuk reconnect
    const backoff = {
        min: 1000,
        max: 10000,
        jitter: 0.5,
        factor: 1.5,
        attempts: 0
    };

    const attemptReconnect = () => {
        backoff.attempts++;
        const delay = Math.min(
            backoff.max,
            backoff.min * Math.pow(backoff.factor, backoff.attempts)
        );

        // Tambahkan jitter untuk menghindari reconnect bersamaan
        const jitter = delay * backoff.jitter * (Math.random() * 2 - 1);
        const finalDelay = delay + jitter;

        logger.info(`Reconnect attempt ${backoff.attempts} scheduled in ${Math.round(finalDelay)}ms`);

        setTimeout(() => {
            try {
                io.emit('reconnect_attempt');

                // Reset backoff jika berhasil
                if (io.engine.clientsCount > 0) {
                    backoff.attempts = 0;
                    logger.success('Reconnect successful, resetting backoff');
                }
            } catch (error) {
                logger.error('Reconnect attempt failed:', error);
                if (backoff.attempts < 10) { // Batasi maksimum percobaan
                    attemptReconnect();
                } else {
                    logger.error('Maximum reconnect attempts reached');
                    backoff.attempts = 0; // Reset untuk percobaan berikutnya
                }
            }
        }, finalDelay);
    };

    attemptReconnect();
});

io.on('reconnect', () => {
    logger.success('Reconnected successfully');
    // Reset semua state koneksi
    connectionState.reconnectAttempts = 0;
    connectionState.isConnecting = false;
    saveConnectionState();
});

io.on('reconnect_error', (error) => {
    logger.error('Reconnection error:', error);
    // Tunggu sebentar sebelum mencoba reconnect lagi
    setTimeout(() => {
        io.emit('reconnect_attempt');
    }, 5000);
});

io.on('reconnect_failed', () => {
    logger.error('Failed to reconnect');
    // Tunggu lebih lama sebelum mencoba reconnect lagi
    setTimeout(() => {
        io.emit('reconnect_attempt');
    }, 10000);
});

// Tambahkan error handler untuk io
io.on('error', (error) => {
    logger.error('Socket.IO error', error);
});

// Tambahkan event handler untuk server
server.on('error', (error) => {
    logger.error('Server error', error);
    if (error.code === 'EADDRINUSE') {
        logger.warn(`Port ${port} already in use, trying to kill existing process...`);
        require('child_process').exec(`npx kill-port ${port}`, (err) => {
            if (err) {
                logger.error('Error killing port', err);
            } else {
                logger.success('Port killed, restarting server...');
                server.listen(port, host);
            }
        });
    }
});

// Optimasi fungsi updateQR
const updateQR = (data) => {
    if (!soket) return; // Prevent unnecessary operations if no socket connection

    // Tambahkan debounce untuk mencegah generate QR terlalu cepat
    if (updateQR.timeout) {
        clearTimeout(updateQR.timeout);
    }

    updateQR.timeout = setTimeout(() => {
        switch (data) {
            case "qr":
                // Hanya generate QR jika belum terautentikasi
                if (!qr || connectionState.isAuthenticated) return;

                // Tunggu sebentar sebelum generate QR
                setTimeout(() => {
                    qrcode.toDataURL(qr, {
                        errorCorrectionLevel: 'L',
                        margin: 1,
                        scale: 4
                    }, (err, url) => {
                        if (err) {
                            console.error('QR generation error:', err);
                            soket.emit("log", "Error generating QR code. Please try again.");
                            return;
                        }
                        lastQRCode = url;
                        soket.emit("qr", url);
                        soket.emit("log", "QR Code received, please scan!");
                    });
                }, 2000); // Delay 2 detik sebelum generate QR
                break;
            case "connected":
                lastQRCode = null;
                connectionState.reconnectAttempts = 0;
                connectionState.isAuthenticated = true;
                soket.emit("qrstatus", "./assets/check.svg");
                soket.emit("log", "WhatsApp terhubung!");
                break;
            case "qrscanned":
                lastQRCode = null;
                connectionState.isAuthenticated = true;
                soket.emit("qrstatus", "./assets/check.svg");
                soket.emit("log", "QR Code Telah discan!");
                break;
            case "loading":
                soket.emit("qrstatus", "./assets/loader.gif");
                soket.emit("log", "Registering QR Code, please wait!");
                break;
            default:
                break;
        }
    }, 1000); // Delay 1 detik sebelum memproses update QR
};

// Tambahkan middleware untuk menangani error
app.use((err, req, res, next) => {
    logger.error('Server error:', err);
    res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan pada server',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Tambahkan middleware untuk menangani 404
app.use((req, res) => {
    res.status(404).json({
        status: false,
        message: 'Endpoint tidak ditemukan'
    });
});

// Optimasi penanganan uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Simpan log ke file
    const errorLog = `[${new Date().toISOString()}] Uncaught Exception: ${error.message}\n${error.stack}\n`;
    fs.appendFileSync(path.join(logDir, 'uncaught-exceptions.log'), errorLog);

    // Coba reconnect jika error terkait koneksi
    if (error.message.includes('connection') || error.message.includes('socket')) {
        handleReconnection().catch(err => {
            logger.error('Error during reconnection after uncaught exception:', err);
        });
    }
});

// Optimasi penanganan unhandled rejections
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
    // Simpan log ke file
    const errorLog = `[${new Date().toISOString()}] Unhandled Rejection: ${error.message}\n${error.stack}\n`;
    fs.appendFileSync(path.join(logDir, 'unhandled-rejections.log'), errorLog);

    // Coba reconnect jika error terkait koneksi
    if (error.message.includes('connection') || error.message.includes('socket')) {
        handleReconnection().catch(err => {
            logger.error('Error during reconnection after unhandled rejection:', err);
        });
    }
});

// Handle process termination dengan lebih baik
const gracefulShutdown = async () => {
    logger.info('Shutting down gracefully...');

    try {
        // Tutup server
        server.close(() => {
            logger.info('Server closed');
        });

        // Tunggu sebentar untuk memastikan semua koneksi tertutup
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simpan state terakhir
        saveConnectionState();

        // Keluar dari proses
        process.exit(0);
    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server dengan error handling yang lebih baik
const startServer = async () => {
    try {
        // Coba koneksi ke WhatsApp
        await connectToWhatsApp();

        // Start server
        server.listen(port, host, () => {
            logger.success(`Server Berjalan pada ${host}:${port}`);
        });

        // Tambahkan error handler untuk server
        server.on('error', (error) => {
            logger.error('Server error:', error);
            if (error.code === 'EADDRINUSE') {
                logger.warn(`Port ${port} already in use, trying to kill existing process...`);
                require('child_process').exec(`npx kill-port ${port}`, (err) => {
                    if (err) {
                        logger.error('Error killing port:', err);
                    } else {
                        logger.success('Port killed, restarting server...');
                        server.listen(port, host);
                    }
                });
            }
        });
    } catch (error) {
        logger.error('Error starting server:', error);
        // Coba restart server setelah delay
        setTimeout(() => {
            startServer().catch(err => {
                logger.error('Failed to restart server:', err);
            });
        }, 5000);
    }
};

// Start server
startServer().catch(err => {
    logger.error('Fatal error starting server:', err);
});
