const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('./database');
const apiRoutes = require('./routes/api');
const { verifyPayment } = require('./payment');
const User = require('./models/user');
const bot = require('./bot');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

app.post('/robokassa/result', async (req, res) => {
  const params = req.body;
  const paymentVerified = verifyPayment(params);

  if (paymentVerified) {
    const userId = params.InvId;
    const user = await User.findById(userId);

    if (user) {
      bot.sendMessage(user.chatId, 'Оплата прошла успешно! Ваш видео урок будет доступен в личном кабинете. Хотите установить напоминание?', {
        reply_markup: {
          keyboard: [['Да', 'Нет']],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    }

    res.send('OK');
  } else {
    res.status(400).send('Ошибка проверки платежа');
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
