const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/database");

// Environment variables
dotenv.config();

// Database ulanish
connectDB();

const app = express();

// CORS - Eng oddiy va ishonchli konfiguratsiya
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Body parser - 200MB gacha request qabul qilish
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true, parameterLimit: 50000 }));

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

app.get("/clear-ads", async (req, res) => {
  const Car = require("./models/Banner");
  try {
    await Car.deleteMany({});
    res.json({ success: true, message: "Barcha avtomobillar o'chirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Xatolik yuz berdi" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishlamoqda`);
});
