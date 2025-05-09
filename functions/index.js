const functions = require("firebase-functions");
const axios = require("axios");
const pug = require("pug");
const path = require("path");
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
