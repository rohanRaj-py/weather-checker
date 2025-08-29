// Global variables
let isLoading = false;
let rainInterval;
let cloudAnimationInterval;

// Initialize the application
function initializeApp() {
    console.log('Weather app initialized');

    // Add event listeners
    document.getElementById('cityInput').addEventListener('keypress', handleSearchKeypress);
    document.getElementById('cityInput').addEventListener('input', handleSearchInput);

    // Add click listeners for weather card interactions
    document.getElementById('weatherCard').addEventListener('click', toggleWeatherDetails);

    // Initialize animations
    startBackgroundAnimations();

    // Update time display
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 60000); // Update every minute
}

// Handle search input keypress
function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        searchWeather();
    }
}

// Handle search input changes
function handleSearchInput(event) {
    const value = event.target.value;
    // Could add autocomplete functionality here
    console.log('Search input:', value);
}

// Main search function
async function searchWeather() {
    const cityInput = document.getElementById('cityInput');
    const city = cityInput.value.trim();

    if (!city) {
        showErrorToast('Please enter a city name');
        return;
    }

    if (isLoading) return;

    try {
        showLoading(true);
        isLoading = true;

        // Update button state
        const searchBtn = document.querySelector('.search-btn');
        const searchText = document.querySelector('.search-text');
        const searchLoading = document.querySelector('.search-loading');

        searchText.style.display = 'none';
        searchLoading.style.display = 'inline';
        searchBtn.disabled = true;

        // Make API call to Flask backend
        const response = await fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ city: city })
        });

        const data = await response.json();

        if (response.ok) {
            updateWeatherDisplay(data);
            cityInput.value = '';

            // Add success animation
            animateWeatherCard();
        } else {
            showErrorToast(data.error || 'Failed to fetch weather data');
        }

    } catch (error) {
        console.error('Search error:', error);
        showErrorToast('Unable to connect to weather service');
    } finally {
        isLoading = false;
        showLoading(false);

        // Reset button state
        const searchBtn = document.querySelector('.search-btn');
        const searchText = document.querySelector('.search-text');
        const searchLoading = document.querySelector('.search-loading');

        searchText.style.display = 'inline';
        searchLoading.style.display = 'none';
        searchBtn.disabled = false;
    }
}

// Quick search function for preset cities
async function quickSearch(city) {
    const cityInput = document.getElementById('cityInput');
    cityInput.value = city;
    await searchWeather();
}

// Update weather display with new data
function updateWeatherDisplay(data) {
    // Update location
    document.getElementById('location').textContent = data.location;

    // Update temperature
    document.getElementById('currentTemp').innerHTML = `${data.temperature}°<span class="temp-unit">C</span>`;

    // Update weather description
    document.getElementById('weatherDesc').textContent = data.description;

    // Update weather details
    document.getElementById('sunrise').textContent = data.sunrise;
    document.getElementById('sunset').textContent = data.sunset;
    document.getElementById('humidity').textContent = `${data.humidity}%`;
    document.getElementById('windSpeed').textContent = `${data.wind_speed}km/h`;

    // Update forecast
    const forecastContainer = document.getElementById('forecastDays');
    forecastContainer.innerHTML = '';

    data.forecast.forEach(day => {
        const dayCard = createDayCard(day);
        forecastContainer.appendChild(dayCard);
    });

    // Update weather icon based on description
    updateWeatherIcon(data.description);

    // Update weather time
    document.querySelector('.weather-time').textContent = 'Updated just now';

    // Add fade-in animation
    document.getElementById('weatherCard').classList.add('fade-in');
    setTimeout(() => {
        document.getElementById('weatherCard').classList.remove('fade-in');
    }, 500);
}

// Create forecast day card
function createDayCard(dayData) {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';
    dayCard.innerHTML = `
        <div class="day-name">${dayData.day}</div>
        <div class="weather-icon">${dayData.icon}</div>
        <div class="day-temp">${dayData.temp}°</div>
        <div class="day-desc">${dayData.desc}</div>
    `;

    // Add click handler
    dayCard.addEventListener('click', () => {
        dayCard.classList.add('pulse');
        setTimeout(() => {
            dayCard.classList.remove('pulse');
        }, 1000);
    });

    return dayCard;
}

// Update main weather icon
function updateWeatherIcon(description) {
    const iconElement = document.getElementById('weatherIcon');
    let icon = '🌤️'; // default

    const desc = description.toLowerCase();
    if (desc.includes('clear') || desc.includes('sunny')) {
        icon = '☀️';
    } else if (desc.includes('cloud')) {
        icon = '⛅';
    } else if (desc.includes('rain')) {
        icon = '🌧️';
    } else if (desc.includes('storm')) {
        icon = '⛈️';
    } else if (desc.includes('snow')) {
        icon = '❄️';
    } else if (desc.includes('mist') || desc.includes('fog')) {
        icon = '🌫️';
    }

    iconElement.textContent = icon;
}

// Show/hide loading overlay
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Show error toast
function showErrorToast(message) {
    const errorToast = document.getElementById('errorToast');
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.textContent = message;
    errorToast.style.display = 'flex';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideErrorToast();
    }, 5000);
}

// Hide error toast
function hideErrorToast() {
    const errorToast = document.getElementById('errorToast');
    errorToast.style.display = 'none';
}

// Toggle weather details (for mobile interaction)
function toggleWeatherDetails() {
    const weatherCard = document.getElementById('weatherCard');
    weatherCard.classList.add('pulse');

    setTimeout(() => {
        weatherCard.classList.remove('pulse');
    }, 600);
}

// Animate weather card on successful search
function animateWeatherCard() {
    const weatherCard = document.getElementById('weatherCard');

    // Add rotation animation
    weatherCard.style.transform = 'rotateY(180deg)';

    setTimeout(() => {
        weatherCard.style.transform = 'translateY(-10px)';
    }, 250);

    setTimeout(() => {
        weatherCard.style.transform = 'translateY(0)';
    }, 500);
}

// Create animated raindrops
function createRaindrop() {
    const raindrop = document.createElement('div');
    raindrop.className = 'raindrop';
    raindrop.style.left = Math.random() * 100 + 'vw';
    raindrop.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
    raindrop.style.animationDelay = Math.random() * 2 + 's';

    document.body.appendChild(raindrop);

    // Remove raindrop after animation
    setTimeout(() => {
        if (raindrop.parentNode) {
            raindrop.remove();
        }
    }, 2000);
}

// Start raindrop animation
function createRaindrops() {
    // Create raindrops periodically
    rainInterval = setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance each interval
            createRaindrop();
        }
    }, 150);
}

// Start cloud animations
function startCloudAnimations() {
    const clouds = document.querySelectorAll('.cloud');

    clouds.forEach((cloud, index) => {
        // Reset position when animation completes
        cloud.addEventListener('animationiteration', () => {
            cloud.style.left = '-150px';
        });
    });
}

// Start all background animations
function startBackgroundAnimations() {
    createRaindrops();
    startCloudAnimations();

    // Add parallax effect on mouse move
    document.addEventListener('mousemove', handleMouseParallax);
}

// Handle mouse parallax effect
function handleMouseParallax(e) {
    const clouds = document.querySelectorAll('.cloud');
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    clouds.forEach((cloud, index) => {
        const speed = (index + 1) * 0.3;
        const x = mouseX * speed * 10;
        const y = mouseY * speed * 5;

        // Apply transform without affecting the main animation
        cloud.style.filter = `blur(${speed * 0.5}px)`;
    });
}

// Update time display
function updateTimeDisplay() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    // Update the weather time if it shows current time
    const weatherTime = document.querySelector('.weather-time');
    if (weatherTime.textContent === 'Updated just now') {
        // Keep it as is for recent updates
    }
}

// Chat widget functionality
function openChat() {
    const responses = [
        "Hello! I'm your weather assistant. How can I help you today?",
        "Looking for weather in a specific city? Just type it in the search box!",
        "Want to know about tomorrow's weather? Check the 3-day forecast!",
        "Need weather advice? I can help with outfit suggestions based on the conditions!",
        "Curious about weather patterns? Ask me anything about meteorology!"
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Create a more sophisticated chat interface
    showChatMessage(randomResponse);
}

// Show chat message (could be expanded into a full chat interface)
function showChatMessage(message) {
    // For now, just show an alert, but this could be expanded
    // into a proper chat interface with a modal or sidebar

    const chatWidget = document.querySelector('.chat-widget');

    // Create temporary message bubble
    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
        position: fixed;
        bottom: 90px;
        right: 30px;
        background: white;
        padding: 15px 20px;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        max-width: 300px;
        z-index: 1000;
        animation: slideUp 0.5s ease-out;
    `;
    messageBubble.textContent = message;

    document.body.appendChild(messageBubble);

    // Remove after 5 seconds
    setTimeout(() => {
        messageBubble.remove();
    }, 5000);

    // Add click to close
    messageBubble.addEventListener('click', () => {
        messageBubble.remove();
    });
}

// Mobile menu toggle
function toggleMobileMenu() {
    const nav = document.querySelector('.nav');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');

    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    mobileMenuBtn.classList.toggle('active');
}

// Cleanup function
function cleanup() {
    if (rainInterval) {
        clearInterval(rainInterval);
    }
    if (cloudAnimationInterval) {
        clearInterval(cloudAnimationInterval);
    }
}

// Handle page visibility changes to pause/resume animations
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cleanup();
    } else {
        startBackgroundAnimations();
    }
});

// Handle window unload
window.addEventListener('beforeunload', cleanup);

// Expose functions to global scope for HTML onclick handlers
window.searchWeather = searchWeather;
window.quickSearch = quickSearch;
window.hideErrorToast = hideErrorToast;
window.openChat = openChat;
window.toggleMobileMenu = toggleMobileMenu;
window.initializeApp = initializeApp;
window.createRaindrops = createRaindrops;
window.startCloudAnimations = startCloudAnimations;