const functions = require("firebase-functions");
const axios = require("axios");
const pug = require("pug");
const path = require("path");
const admin = require('firebase-admin');
admin.initializeApp();

const cors = require("cors")({
  origin: [
    "https://htmxfinal-ead24.web.app",
    "https://us-central1-htmxfinal-ead24.cloudfunctions.net",
    "https://weather-lju7fjbs4a-uc.a.run.app",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:5001"
  ],
  allowedHeaders: [
    "Content-Type",
    "HX-Current-Url",
    "HX-Boosted",
    "HX-History-Restore-Request",
    "HX-Trigger",
    "HX-Request",
    "HX-Target",
    "HX-Trigger-Name",
    "HX-Prompt"
  ]
});



const db = admin.firestore();
const API_KEY = "31f7bb09b9c18597cb8d22156cb4a92e";

exports.weather = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const city = req.query.city || "London";

    try {
      const geoRes = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
      );

      if (!geoRes.data.length) {
        return res.status(404).send("City not found");
      }

      const { lat, lon, name } = geoRes.data[0];

      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );

      const data = {
        city: name,
        temp: weatherRes.data.main.temp,
        condition: weatherRes.data.weather[0].main,
        description: weatherRes.data.weather[0].description,
        icon: weatherRes.data.weather[0].icon
      };

      let html;
      try {
        
        const viewPath = path.join(__dirname, "views", "weather.pug");
        html = pug.renderFile(viewPath, data);
      } catch (renderErr) {
        console.error("Pug render error:", renderErr.message);
        return res.status(500).send("Template render error");
      }

      res.set("Access-Control-Allow-Origin", "*"); 
      res.send(html);
    } catch (err) {
      console.error("Error fetching weather:", err.message);
      res.status(500).send("Weather fetch error");
    }
  });
});

exports.logWeather = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const city = req.query.city || 'Missoula';
    const weatherApiKey = '31f7bb09b9c18597cb8d22156cb4a92e'; 
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}`;

    try {
      const response = await fetch(weatherApiUrl);
      const weatherData = await response.json();

      // Log the weather data to databsae
      const db = admin.firestore();
      await db.collection('weatherLogs').add(weatherData);

      res.status(200).json(weatherData); // Respond with the weather data
    } catch (error) {
      console.error('Error fetching weather data:', error);
      res.status(500).send('Error fetching weather data');
    }
  });
});
