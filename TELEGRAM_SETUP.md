# Telegram Bot O'rnatish Ko'rsatmasi

## 1. Telegram Bot yaratish

### BotFather orqali bot yaratish:

1. Telegram'da [@BotFather](https://t.me/BotFather) ni toping
2. `/newbot` kommandasini yuboring
3. Bot uchun nom kiriting (masalan: `Avto Kerek Bot`)
4. Bot uchun username kiriting (masalan: `avto_kerek_bot`)
5. BotFather sizga **bot token** beradi. Uni saqlang!

Token ko'rinishi: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

## 2. Bot'ni kanal administratori qilish

1. @avto_satiw kanalingizni oching
2. Kanal sozlamalarga kiring
3. "Administrators" ni tanlang
4. "Add Administrator" ni bosing
5. Bot'ingizni qidiring va qo'shing
6. Quyidagi ruxsatlarni bering:
   - ✅ Post Messages
   - ✅ Edit Messages
   - ✅ Delete Messages

## 3. .env faylni sozlash

`.env` faylda quyidagi qatorlarni to'ldiring:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz  # BotFather bergan token
TELEGRAM_CHANNEL_ID=@avto_satiw                          # Kanal username
FRONTEND_URL=https://avto.kerek.uz                        # Frontend URL
```

**Muhim:** `your_bot_token_here` ni o'z bot tokeningizga almashtiring!

## 4. Serverni qayta ishga tushirish

```bash
npm start
```

Server ishga tushganda konsolda ko'rish kerak:
```
✅ Telegram bot ishga tushdi
```

## 5. Mavjud mashinalarni kanalga yuklash

Barcha mavjud mashinalarni bir marta kanalga yuklash uchun:

```bash
node scripts/uploadExistingCarsToTelegram.js
```

Bu script:
- ✅ Hali telegram'ga yuklanmagan mashinalarni topadi
- ✅ Har birini kanalga yuklaydi
- ✅ Telegram post ID ni saqlaydi
- ✅ Progress ko'rsatadi

**Eslatma:** Script 1.5 soniyada 1 ta mashina yuklaydi (Telegram API limit)

## 6. Avtomatik ishlash

Endi barcha yangi mashinalar avtomatik telegram'ga yuklanadi:

### Yangi mashina qo'shilganda:
- ✅ Avtomat ravishda kanalga post yaratiladi
- ✅ 10 tagacha rasm yuboriladi
- ✅ To'liq ma'lumotlar bilan

### Mashina yangilanganda:
- ✅ Telegram'dagi post matni yangilanadi
- ⚠️  Rasmlar yangilanmaydi (Telegram API cheklovi)

### Mashina o'chirilganda:
- ✅ Telegram'dagi post ham o'chiriladi

## 7. Telegram Post Formati

Kanalga quyidagi formatda post yuboriladi:

```
🚗 Chevrolet Nexia

📅 Yili: 2020
📊 Probeg: 45,000 km
💰 Narxi: 95,000,000 so'm

⚙️ Korobka: Mexanika
⚡ Yoqilg'i: Metan, Benzin
🔧 Dvigatel: 1.5L
🎨 Rangi: Oq
🚙 Kuzov: Sedan

📍 Manzil: Toshkent
✨ Holati: Yaxshi

📞 Telefon: +998901234567

🔗 Batafsil ko'rish
```

## 8. Muammolarni hal qilish

### Bot ishlamayapti?

1. `.env` faylda token to'g'ri kiritilganini tekshiring
2. Bot kanalga admin qilinganini tekshiring
3. Kanal username to'g'ri yozilganini tekshiring (`@` bilan)

### Rasmlar yuklanmayapdi?

1. `uploads/` papkasi mavjudligini tekshiring
2. Rasmlar yo'li to'g'ri ekanligini tekshiring
3. Fayl ruxsatlari to'g'ri ekanligini tekshiring

### Post ID saqlanmayapti?

Database'da `telegramPostId` field mavjudligini tekshiring. Agar yo'q bo'lsa, server'ni qayta ishga tushiring.

## 9. Test qilish

Bot ishlashini test qilish uchun:

```bash
# Node console'da
const { testBot } = require('./utils/telegramBot');
testBot();
```

Natija:
```
✅ Bot ishlayapti: @avto_kerek_bot
```

## 10. Xavfsizlik

- ⚠️  `.env` faylni hech qachon git'ga commit qilmang!
- ⚠️  Bot tokenni hech kimga bermang!
- ⚠️  Token oshkor bo'lsa, BotFather orqali yangi token oling

## Yordam

Muammo bo'lsa:
1. Server loglarini tekshiring: `npm start`
2. Script loglarini tekshiring: `node scripts/uploadExistingCarsToTelegram.js`
3. Telegram Bot API dokumentatsiyasini ko'ring: https://core.telegram.org/bots/api
