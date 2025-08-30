from flask import Flask, render_template, request, jsonify
import requests
import json
from datetime import datetime
from dotenv import load_dotenv
import os

app = Flask(__name__)

load_dotenv()
API_KEY = os.getenv("API_KEY")
# OpenWeatherMap API configuration
BASE_URL = os.getenv("BASE_URL", "http://api.openweathermap.org/data/2.5")

# Sample weather data for demonstration (remove when using real API)
SAMPLE_WEATHER_DATA = {
    "london": {
        "location": "London, UK",
        "temperature": 12,
        "feels_like": 8,
        "description": "Partly cloudy",
        "humidity": 70,
        "wind_speed": 8,
        "sunrise": "05:45",
        "sunset": "18:45",
        "forecast": [
            {"day": "Sat", "icon": "☀️", "temp": 15, "desc": "Sunny"},
            {"day": "Sun", "icon": "⛅", "temp": 13, "desc": "Cloudy"},
            {"day": "Mon", "icon": "🌧️", "temp": 10, "desc": "Rainy"}
        ]
    },
    "new york": {
        "location": "New York, USA",
        "temperature": 22,
        "feels_like": 25,
        "description": "Clear sky",
        "humidity": 45,
        "wind_speed": 12,
        "sunrise": "06:15",
        "sunset": "19:30",
        "forecast": [
            {"day": "Sat", "icon": "☀️", "temp": 25, "desc": "Sunny"},
            {"day": "Sun", "icon": "☀️", "temp": 27, "desc": "Hot"},
            {"day": "Mon", "icon": "⛅", "temp": 23, "desc": "Partly cloudy"}
        ]
    },
    "tokyo": {
        "location": "Tokyo, Japan",
        "temperature": 18,
        "feels_like": 20,
        "description": "Light rain",
        "humidity": 85,
        "wind_speed": 6,
        "sunrise": "05:30",
        "sunset": "18:15",
        "forecast": [
            {"day": "Sat", "icon": "🌧️", "temp": 16, "desc": "Rainy"},
            {"day": "Sun", "icon": "⛅", "temp": 19, "desc": "Cloudy"},
            {"day": "Mon", "icon": "☀️", "temp": 22, "desc": "Sunny"}
        ]
    }
}


def get_weather_icon(description):
    """Return appropriate emoji based on weather description"""
    description = description.lower()
    if "clear" in description or "sunny" in description:
        return "☀️"
    elif "cloud" in description:
        return "⛅"
    elif "rain" in description:
        return "🌧️"
    elif "storm" in description:
        return "⛈️"
    elif "snow" in description:
        return "❄️"
    else:
        return "🌤️"


def get_weather_data(city):
    """Get weather data from OpenWeatherMap API"""
    try:
        # Current weather
        current_url = f"{BASE_URL}/weather?q={city}&appid={API_KEY}&units=metric"
        current_response = requests.get(current_url, timeout=10)

        if current_response.status_code == 200:
            current_data = current_response.json()

            # Forecast data
            forecast_url = f"{BASE_URL}/forecast?q={city}&appid={API_KEY}&units=metric"
            forecast_response = requests.get(forecast_url, timeout=10)
            forecast_data = forecast_response.json() if forecast_response.status_code == 200 else None

            # Process forecast data for next 3 days
            forecast = []
            if forecast_data and 'list' in forecast_data:
                days_of_week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                current_day = datetime.now().weekday()

                # Get forecast for next 3 days (skip today, take every 8th item for daily data)
                for i in range(1, 4):  # Next 3 days
                    forecast_index = i * 8  # Every 8th item represents ~24 hours later
                    if forecast_index < len(forecast_data['list']):
                        item = forecast_data['list'][forecast_index]
                        day_index = (current_day + i) % 7
                        forecast.append({
                            "day": days_of_week[day_index],
                            "icon": get_weather_icon(item['weather'][0]['description']),
                            "temp": int(item['main']['temp']),
                            "desc": item['weather'][0]['description'].title()
                        })

            # If forecast failed, use default data
            if not forecast:
                forecast = [
                    {"day": "Tomorrow", "icon": "⛅", "temp": int(current_data['main']['temp']) + 2, "desc": "Cloudy"},
                    {"day": "Day 2", "icon": "☀️", "temp": int(current_data['main']['temp']) + 3, "desc": "Sunny"},
                    {"day": "Day 3", "icon": "🌧️", "temp": int(current_data['main']['temp']) - 1, "desc": "Rainy"}
                ]

            return {
                "location": f"{current_data['name']}, {current_data['sys']['country']}",
                "temperature": int(current_data['main']['temp']),
                "feels_like": int(current_data['main']['feels_like']),
                "description": current_data['weather'][0]['description'].title(),
                "humidity": current_data['main']['humidity'],
                "wind_speed": int(current_data['wind']['speed'] * 3.6),  # Convert m/s to km/h
                "sunrise": datetime.fromtimestamp(current_data['sys']['sunrise']).strftime('%H:%M'),
                "sunset": datetime.fromtimestamp(current_data['sys']['sunset']).strftime('%H:%M'),
                "forecast": forecast
            }
        else:
            # If API call fails, check if it's a known city in sample data
            city_lower = city.lower()
            if city_lower in SAMPLE_WEATHER_DATA:
                return SAMPLE_WEATHER_DATA[city_lower]

    except requests.exceptions.RequestException as e:
        print(f"Network error fetching weather data: {e}")
        # Fall back to sample data if available
        city_lower = city.lower()
        if city_lower in SAMPLE_WEATHER_DATA:
            return SAMPLE_WEATHER_DATA[city_lower]
    except Exception as e:
        print(f"Error fetching weather data: {e}")

    # Default data if city not found
    return {
        "location": f"{city.title()}",
        "temperature": 20,
        "feels_like": 22,
        "description": "Partly cloudy",
        "humidity": 60,
        "wind_speed": 10,
        "sunrise": "06:00",
        "sunset": "18:00",
        "forecast": [
            {"day": "Sat", "icon": "⛅", "temp": 22, "desc": "Cloudy"},
            {"day": "Sun", "icon": "☀️", "temp": 25, "desc": "Sunny"},
            {"day": "Mon", "icon": "🌧️", "temp": 18, "desc": "Rainy"}
        ]
    }


@app.route('/')
def home():
    """Render the main page"""
    # Default weather for London
    default_weather = get_weather_data("London")
    return render_template('index.html', weather=default_weather)


@app.route('/search', methods=['POST'])
def search_weather():
    """Handle weather search requests"""
    data = request.get_json()
    city = data.get('city', '').strip()

    if not city:
        return jsonify({"error": "City name is required"}), 400

    weather_data = get_weather_data(city)
    return jsonify(weather_data)


@app.route('/api/weather/<city>')
def get_weather_api(city):
    """API endpoint for weather data"""
    weather_data = get_weather_data(city)
    return jsonify(weather_data)


@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500


if __name__ == '__main__':
    # Create templates and static directories if they don't exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)

    app.run(debug=True, host='0.0.0.0', port=5000)