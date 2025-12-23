const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/database");
const { initBot } = require("./utils/telegramBot");
const { startFakeViewsCron } = require("./utils/fakeViews");

// Environment variables
dotenv.config();

// Database ulanish
connectDB();

// Telegram bot ishga tushirish
initBot();

// Fake views cron job ishga tushirish
startFakeViewsCron();

// Eski carlarni avtomatik yuklash
const uploadOldCars = async () => {
  try {
    const Car = require("./models/Car");
    const { postCarToChannel } = require("./utils/telegramBot");

    // Hozirgi kanal uchun yuklanmagan carlarni topish
    const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

    const cars = await Car.find({
      $and: [
        { status: "sale" },
        {
          $or: [
            { telegramPosts: { $exists: false } },
            { telegramPosts: { $size: 0 } },
            {
              telegramPosts: {
                $not: { $elemMatch: { channelId: CHANNEL_ID } },
              },
            },
          ],
        },
      ],
    }).limit(5); // Birinchi 5 ta

    if (cars.length > 0) {
      console.log(
        `📤 ${cars.length} ta car ${CHANNEL_ID} kanalga yuklanmoqda...`
      );

      for (const car of cars) {
        try {
          const postId = await postCarToChannel(car);
          if (postId) {
            console.log(`✅ ${car.brand} ${car.model} yuklandi`);
          }
          await new Promise((r) => setTimeout(r, 3000));
        } catch (err) {
          console.error(`❌ ${car.brand} ${car.model} xatolik:`, err.message);
        }
      }
    }
  } catch (error) {
    console.error("Avtomatik yuklashda xatolik:", error.message);
  }
};

// 10 soniyadan keyin yuklashni boshlash
setTimeout(uploadOldCars, 10000);

const app = express();

// CORS - Faqat belgilangan domainlar uchun
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  "https://bereket-avto.kerek.uz",
  "https://avto.kerek.uz",
  "http://bereket-avto.kerek.uz",
  "http://avto.kerek.uz",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Agar origin ruxsat etilgan ro'yxatda bo'lsa
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  } else if (origin) {
    // Development va test uchun vaqtinchalik barcha originlarga ruxsat
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    console.log(`CORS warning - allowed origin: ${origin}`);
  } else {
    // Flutter, mobile apps va boshqa origin headerisiz so'rovlar uchun
    // (Flutter http package origin headersiz yuboradi)
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Expose headers for client
  res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Body parser - 200MB gacha request qabul qilish
app.use(express.json({ limit: "200mb" }));
app.use(
  express.urlencoded({ limit: "200mb", extended: true, parameterLimit: 50000 })
);

// Static folder (rasmlar uchun)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/cars", require("./routes/carRoutes"));
app.use("/api/banners", require("./routes/bannerRoutes"));

// Asosiy yo'l
app.get("/", (req, res) => {
  res.json({ message: " avto sawda API" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Server xatosi",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishlamoqda`);
});
