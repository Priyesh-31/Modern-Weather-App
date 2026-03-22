const API_KEY = "b14bef75273588fe73e7ccf58e418899";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const AIR_URL = "https://api.openweathermap.org/data/2.5/air_pollution";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const geoBtn = document.getElementById("geoBtn");
const unitToggle = document.getElementById("unitToggle");

const cityNameEl = document.getElementById("cityName");
const descriptionEl = document.getElementById("description");
const temperatureEl = document.getElementById("temperature");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const aqiEl = document.getElementById("aqi");
const aqiTipEl = document.getElementById("aqiTip");
const forecastContainer = document.getElementById("forecastContainer");

const weatherIconEl = document.getElementById("weatherIcon"); // will hold OpenWeather icon
const lottieContainer = document.getElementById("lottieContainer"); // new container for lottie animations
const loadingEl = document.getElementById("loading");
const toastEl = document.getElementById("toast");

// ===== STATE =====
let currentUnit = "metric"; // "metric" = Celsius, "imperial" = Fahrenheit
let weatherAnimation = null;

//date time
function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  };
  document.getElementById("datetime").textContent = now.toLocaleString("en-US", options);
}

// refresh every second
setInterval(updateDateTime, 1000);
updateDateTime(); // run once at start


// ===== HELPERS =====
function showLoading() {
  loadingEl.classList.remove("hidden");
}
function hideLoading() {
  loadingEl.classList.add("hidden");
}
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  setTimeout(() => toastEl.classList.add("hidden"), 3000);
}
function formatTime(unix, timezoneOffset) {
  const date = new Date((unix + timezoneOffset) * 1000);
  return date.toUTCString().match(/\d{2}:\d{2}/)[0];
}
function setTheme(condition, isDay) {
  const body = document.body;
  body.className = ""; // reset theme
  if (condition.includes("cloud")) body.classList.add(isDay ? "theme--cloudy" : "cloudy-night");
  else if (condition.includes("rain")) body.classList.add(isDay ? "theme--rainy" : "rainy-night");
  else if (condition.includes("snow")) body.classList.add("theme--snowy");
  else if (condition.includes("fog") || condition.includes("mist")) body.classList.add("theme--foggy");
  else body.classList.add(isDay ? "theme--day-sunny" : "theme--night-clear");
}
function loadWeatherAnimation(weatherMain, isDay) {
  const animations = {
    Clear: isDay
      ? "https://assets8.lottiefiles.com/packages/lf20_qp1q7mct.json"
      : "https://assets8.lottiefiles.com/packages/lf20_wv6zj1ij.json",
    Clouds: "https://assets8.lottiefiles.com/packages/lf20_VAmWRg.json",
    Rain: "https://assets8.lottiefiles.com/packages/lf20_xnhb0oem.json",
    Snow: "https://assets8.lottiefiles.com/packages/lf20_YXxFQn.json",
    Mist: "https://assets8.lottiefiles.com/packages/lf20_dgj1dthh.json",
  };

  const url = animations[weatherMain] || animations.Clear;
  if (weatherAnimation) weatherAnimation.destroy();

  weatherAnimation = lottie.loadAnimation({
    container: lottieContainer,
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: url,
  });
}

// ===== FETCH FUNCTIONS =====
async function fetchWeather(query) {
  try {
    showLoading();
    const res = await fetch(
      `${WEATHER_URL}?q=${query}&appid=${API_KEY}&units=${currentUnit}`
    );
    if (!res.ok) throw new Error("City not found");
    const data = await res.json();

    renderCurrentWeather(data);
    fetchForecast(data.coord.lat, data.coord.lon);
    fetchAirQuality(data.coord.lat, data.coord.lon);
  } catch (err) {
    showToast(err.message);
  } finally {
    hideLoading();
  }
}
async function fetchWeatherByCoords(lat, lon) {
  try {
    showLoading();
    const res = await fetch(
      `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
    );
    if (!res.ok) throw new Error("Location not found");
    const data = await res.json();

    renderCurrentWeather(data);
    fetchForecast(lat, lon);
    fetchAirQuality(lat, lon);
  } catch (err) {
    showToast(err.message);
  } finally {
    hideLoading();
  }
}
async function fetchForecast(lat, lon) {
  const res = await fetch(
    `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
  );
  const data = await res.json();
  renderForecast(data.list);
}
async function fetchAirQuality(lat, lon) {
  const res = await fetch(`${AIR_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
  const data = await res.json();
  renderAQI(data.list[0].main.aqi);
}

// ===== RENDER FUNCTIONS =====
function renderCurrentWeather(data) {
  const weatherMain = data.weather[0].main;
  const description = data.weather[0].description;
  const iconCode = data.weather[0].icon; // e.g. 01d, 02n
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
  const isDay = iconCode.includes("d");

  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
  descriptionEl.textContent = description;
  temperatureEl.textContent = Math.round(data.main.temp);
  feelsLikeEl.textContent = Math.round(data.main.feels_like);
  humidityEl.textContent = data.main.humidity;
  windEl.textContent = Math.round(data.wind.speed);
  sunriseEl.textContent = formatTime(data.sys.sunrise, data.timezone);
  sunsetEl.textContent = formatTime(data.sys.sunset, data.timezone);

  // Show OpenWeather icon
  weatherIconEl.src = iconUrl;

  // Apply background + animation
  setTheme(description.toLowerCase(), isDay);
  loadWeatherAnimation(weatherMain, isDay);
}
function renderForecast(list) {
  forecastContainer.innerHTML = "";
  const daily = list.filter(item => item.dt_txt.includes("12:00:00"));
  daily.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    const temp = Math.round(item.main.temp);
    const iconCode = item.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

    const card = document.createElement("div");
    card.className = "forecast__card";
    card.innerHTML = `
      <div class="forecast__time">${day}</div>
      <img src="${iconUrl}" alt="forecast-icon">
      <div class="forecast__temp">${temp}°</div>
    `;
    forecastContainer.appendChild(card);
  });
}
function renderAQI(aqi) {
  aqiEl.textContent = aqi;
  let tip = "";
  switch (aqi) {
    case 1: tip = "Good air quality"; break;
    case 2: tip = "Fair air quality"; break;
    case 3: tip = "Moderate - Sensitive groups take care"; break;
    case 4: tip = "Poor - Avoid outdoor activities"; break;
    case 5: tip = "Very Poor - Stay indoors"; break;
  }
  aqiTipEl.textContent = tip;
}

// ===== EVENT LISTENERS =====
searchForm.addEventListener("submit", e => {
  e.preventDefault();
  fetchWeather(searchInput.value.trim());
});
geoBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => showToast("Unable to access location")
    );
  } else {
    showToast("Geolocation not supported");
  }
});
unitToggle.addEventListener("change", () => {
  currentUnit = unitToggle.checked ? "imperial" : "metric";
  if (cityNameEl.textContent !== "—") {
    fetchWeather(cityNameEl.textContent.split(",")[0]);
  }
});

// ===== INIT =====
fetchWeather("Mumbai"); // default city
