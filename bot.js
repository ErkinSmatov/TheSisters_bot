const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('./database');
const User = require('./models/user');
const config = require("config");
const { createInvoice } = require('./payment');

const TELEGRAM_BOT_TOKEN = config.get('telegramBotToken');
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const packageDetails = [
    { key: '1', amount: 3550, name: 'Тариф #1 - 3550тг', description: '1 видео урок\n«Гипнотело» - учимся пластичности', photo: './assets/kurs1.jpg' },
    { key: '2', amount: 5055, name: 'Тариф #2 - 5055тг', description: '2 видео урока\n«Гипнотело» учимся пластичности\n«Попа Движ» учимся танцевать папой', photo: './assets/kurs2.jpg' },
    { key: '3', amount: 7077, name: 'Тариф #3 - 7077тг', description: '2 видео урока + 🎁подарочные уроки\n«Гипнотело» учимся пластичности\n«Попа Движ» учимся танцевать папой\n++\n🎁подарочный урок "Упругая попа"\n🎁подарочный урок "Для плоского живота"', photo: './assets/kurs3.jpg' }
];
const lessonsPhoto = [
    {
        type: 'photo',
        media: './assets/kurs1.jpg',
        caption: '«Гипнотело» учимся пластичности'
    },
    {
        type: 'photo',
        media: './assets/kurs2.jpg',
        caption: '«Попа Движ» учимся танцевать папой'
    },
    {
        type: 'photo',
        media: './assets/kurs3.jpg',
        caption: 'Урок упругая попа'
    },
    {
        type: 'photo',
        media: './assets/kurs4.jpg',
        caption: 'Урок для плоского животика'
    }
];

const validOptions = ['/start', '/help', 'Список уроков', 'Мои курсы', 'Просмотреть тарифы', 'Связаться с оператором', 'Помощь', '< Назад'];
const userStates = {};
const targetChatId = '463784455';
const KaspiQR = config.get('KaspiQR');
const AlinaTG = config.get('AlinaTG');

async function updateUserAndCreateInvoice(chatId, name, phone, selectedPackage) {
    try {
        const userDoc = await User.findOneAndUpdate(
            { chatId },
            { name, phone, $push: { package: selectedPackage.name } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // const invoice = createInvoice({
        //     userId: userDoc._id,
        //     amount: selectedPackage.amount,
        //     description: selectedPackage.description
        // });

        return { userDoc };
    } catch (error) {
        throw new Error('Ошибка при сохранении пользователя и создании инвойса: ' + error.message);
    }
}

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await User.findOne({ chatId });
    userStates[chatId] = 'ready';
    if (user) {
        bot.sendMessage(chatId, `Рад видеть снова, ${user.name}! Чем могу помочь?`, {
            reply_markup: {
                keyboard: [['Список уроков', 'Мои курсы'], ['Просмотреть тарифы'], ['Связаться с оператором']], //, ['Связаться с оператором'], ['Помощь']
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } else {
        bot.sendMessage(chatId, `Привет! Добро пожаловать на online Amazonka v2.0 ❤️\nДавайте выберем из меню снизу чем я могу вам помочь?`, {
            reply_markup: {
                keyboard: [['Список уроков', 'Просмотреть тарифы'], ['Связаться с оператором', 'Помощь']], //, ['Связаться с оператором'], ['Помощь']
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === 'Мои курсы') {
        const user = await User.findOne({ chatId });

        if (user) {
            if (!Array.isArray(user.package) || user.package.length === 0) {
                bot.sendMessage(chatId, 'У вас пока нет приобретённых курсов.');
            } else {
                const courses = user.package.join('\n');
                bot.sendMessage(chatId, `Ваши приобретённые курсы:\n${courses}`);
            }
        } else {
            bot.sendMessage(chatId, 'Сначала зарегистрируйтесь в боте.');
        }
    } else if (text === 'Список уроков') {
        await bot.sendMediaGroup(chatId, lessonsPhoto).then(() => {
            bot.sendMessage(chatId, 'Для приобретения уроков просмотрите наш список тарифов', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Просмотреть тарифы', callback_data: 'tarifs' }]
                    ]
                }
            });
        }).catch(error => {
            console.error('Ошибка при отправке группы медиа:', error);
            bot.sendMessage(chatId, 'Произошла ошибка при отправке группы медиа. Пожалуйста, попробуйте снова.');
        });
    } else if (text === 'Просмотреть тарифы') {
        const packageButtons = packageDetails.map((item) => {
            return [{ text: item.name, callback_data: `package_${item.key}` }];
        });

        await bot.sendMessage(chatId, 'Выберите один из тарифов для просмотра подробной информации:\n- Уроки длятся 8 минут\n- Подарочные уроки по 4 минуты', {
            reply_markup: {
                inline_keyboard: packageButtons
            }
        });
    } else if (text === 'Связаться с оператором') {
        bot.sendMessage(chatId, 'Вы можете связаться с нашим оператором для получения дополнительной помощи.', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Написать', url: AlinaTG }]
                ]
            },
        });
    } else if (text === 'Помощь') {
        userStates[chatId] = 'help';
        bot.sendMessage(chatId, `Выберите интересующий вас вопрос`, {
            reply_markup: {
                keyboard: [['Подробнее о тарифах', 'Подробнее об уроках'], ['Польза уроков', 'Связаться с оператором'], ['< Назад']],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } else if (text === 'Подробнее о тарифах') {
        bot.sendMessage(chatId, config.get('TarifHelp'), {
            reply_markup: {
                keyboard: [['Подробнее о тарифах', 'Подробнее об уроках'], ['Польза уроков', 'Связаться с оператором'], ['< Назад']],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } else if (text === 'Подробнее об уроках') {
        bot.sendMessage(chatId, config.get('LessonsHelp'), {
            reply_markup: {
                keyboard: [['Подробнее о тарифах', 'Подробнее об уроках'], ['Польза уроков', 'Связаться с оператором'], ['< Назад']],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } else if (text === 'Польза уроков') {
        bot.sendMessage(chatId, config.get('HelpfulHelp'), {
            reply_markup: {
                keyboard: [['Подробнее о тарифах', 'Подробнее об уроках'], ['Польза уроков', 'Связаться с оператором'], ['< Назад']],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } else if (text === '< Назад') {
        userStates[chatId] = 'ready';
        bot.sendMessage(chatId, `Надеюсь я смог ответить на ваши вопросы`, {
            reply_markup: {
                keyboard: [['Список уроков', 'Просмотреть тарифы'], ['Связаться с оператором', 'Помощь']], //, ['Связаться с оператором'], ['Помощь']
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } else if (msg.photo || msg.document) {
        // Пересылаем фото
        const from = msg.from;
        const existingUser = await User.findOne({ chatId });
        await bot.forwardMessage(targetChatId, chatId, msg.message_id)
            .then(async () => {
                const userLink = from.username ? `https://t.me/${from.username}` : null;
                const userInfo = `
Чек отправлен пользователем:
ChatId: ${from.id}
Имя: ${from.first_name}
Фамилия: ${from.last_name || ''}
Username: @${from.username || ''}
Тлефон: ${existingUser.phone || ''}
Тариф: ${existingUser.package[existingUser.package.length - 1]}
${userLink ? `Ссылка на чат: [Перейти в чат](${userLink})` : 'Ссылка на чат недоступна, так как у пользователя нет username.'}`;
                // Отправляем информацию об отправителе
                await bot.sendMessage(targetChatId, userInfo, { parse_mode: 'Markdown' });
                await bot.sendMessage(chatId, 'Спасибо за покупку, оператор получил ваше сообщение(чек), скоро вам отправять ссылку на канал с уроками', {
                    reply_markup: {
                        keyboard: [['Список уроков', 'Просмотреть тарифы'], ['Связаться с оператором', 'Помощь']],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                });
            })
            .catch(error => {
                console.error('Ошибка при пересылке изображения:', error);
            });
    } else if (userStates[chatId] === 'ready' && !validOptions.includes(text)) {
        await bot.sendMessage(chatId, `Извените, я не совсем понимаю, может напишите нашему оператору или выберите пункт из меню снизу`, {
            reply_markup: {
                keyboard: [['Список уроков', 'Просмотреть тарифы'], ['Связаться с оператором', 'Помощь']],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }
});

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    if (data.startsWith('package_')) {
        const packageId = data.split('_')[1];
        const selectedPackage = packageDetails[packageId - 1];

        if (selectedPackage) {
            await bot.sendPhoto(chatId, selectedPackage.photo, {
                caption: `<b>${selectedPackage.name}</b>\n\n${selectedPackage.description}`,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Назад', callback_data: 'back' }, { text: 'Купить', callback_data: `buy_${packageId}` }]
                    ]
                }
            });
        } else {
            bot.sendMessage(chatId, 'Неправильный выбор пакета. Пожалуйста, выберите снова.');
        }
    } else if (data === 'back') {
        bot.deleteMessage(chatId, messageId);
    } else if (data.startsWith('buy_')) {
        const packageId = data.split('_')[1];
        const selectedPackage = packageDetails[packageId - 1];
        const existingUser = await User.findOne({ chatId });

        if (existingUser) {
            try {
                const { userDoc } = await updateUserAndCreateInvoice(chatId, existingUser.name, existingUser.phone, selectedPackage);
                await bot.sendMessage(chatId, `1) Пожалуйста, совершите оплату через Kaspi по ссылке ниже`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Kaspi', url: KaspiQR }]
                        ]
                    }
                });
                await bot.sendMessage(chatId, `2) Cкиньте сюда чек об оплате`, {
                    disable_notification: true,
                });
                await bot.sendMessage(chatId, `3) После мы отправим ссылку для вступление в телеграмм канал`, {
                    disable_notification: true,
                });
                setTimeout(async () => {
                    await bot.sendMessage(chatId, `_* уроки без обратной связи_\n_* сумма не возвратная_\n_* видео у вас остается навсегда_`, {
                        disable_notification: true,
                        parse_mode: 'Markdown'
                    });
                }, 3000)
            } catch (error) {
                console.error(error.message);
                bot.sendMessage(chatId, 'Произошла ошибка при сохранении ваших данных. Пожалуйста, попробуйте снова.');
            }
        } else if (selectedPackage) {
            userStates[chatId] = 'registration';
            bot.sendMessage(chatId, 'Пожалуйста, введите ваше имя:');
            bot.once('message', (msg) => {
                const name = msg.text;
                bot.sendMessage(chatId, 'Пожалуйста, введите ваш номер телефона:');
                bot.once('message', async (msg) => {
                    const phone = msg.text;

                    try {
                        const { userDoc } = await updateUserAndCreateInvoice(chatId, name, phone, selectedPackage);
                        await bot.sendMessage(chatId, `1) Пожалуйста, совершите оплату через Kaspi по ссылке ниже`, {
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: 'Kaspi', url: KaspiQR }]
                                ]
                            }
                        });
                        await bot.sendMessage(chatId, `2) Cкиньте сюда чек об оплате`, {
                            disable_notification: true,
                        });
                        await bot.sendMessage(chatId, `3) После мы отправим ссылку для вступление в телеграмм канал`, {
                            disable_notification: true,
                        });
                        setTimeout(async () => {
                            await bot.sendMessage(chatId, `_* уроки без обратной связи_\n_* сумма не возвратная_\n_* видео у вас остается навсегда_`, {
                                disable_notification: true,
                                parse_mode: 'Markdown'
                            });
                        }, 3000)
                        userStates[chatId] = 'ready';
                    } catch (error) {
                        console.error(error.message);
                        bot.sendMessage(chatId, 'Произошла ошибка при сохранении ваших данных. Пожалуйста, попробуйте снова.');
                    }
                });
            });
        }
    } else if (data === 'tarifs') {
        const packageButtons = packageDetails.map((item) => {
            return [{ text: item.name, callback_data: `package_${item.key}` }];
        });

        await bot.sendMessage(chatId, 'Выберите один из тарифов для просмотра подробной информации:\n- Уроки длятся 8 минут\n- Подарочные уроки по 4 минуты', {
            reply_markup: {
                inline_keyboard: packageButtons
            }
        });
    }
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Вы можете связаться с нашим оператором для получения дополнительной помощи.', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Написать', url: AlinaTG }]
            ]
        },
    });
});

module.exports = bot;
