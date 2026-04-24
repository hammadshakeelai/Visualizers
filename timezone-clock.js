// List of major timezones
const TIMEZONES = [
    // Americas
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'America/Toronto',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'America/Buenos_Aires',
    
    // Europe
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Amsterdam',
    'Europe/Rome',
    'Europe/Athens',
    'Europe/Moscow',
    'Europe/Istanbul',
    
    // Asia
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Bangkok',
    
    // Pacific
    'Pacific/Auckland',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Fiji',
];

const DEFAULT_TIMEZONES = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];

// State management
let selectedTimezones = [];

// DOM elements
const clocksContainer = document.getElementById('clocks-container');
const timezoneModal = document.getElementById('timezone-modal');
const timezoneList = document.getElementById('timezone-list');
const timezoneSearch = document.getElementById('timezone-search');
const addTimezoneBtn = document.getElementById('add-timezone-btn');
const resetBtn = document.getElementById('reset-btn');
const modalCloseBtn = document.getElementById('modal-close');

// Initialize
function init() {
    loadTimezones();
    renderClocks();
    setInterval(updateClocks, 1000);
    attachEventListeners();
}

function attachEventListeners() {
    addTimezoneBtn.addEventListener('click', openModal);
    resetBtn.addEventListener('click', resetClocks);
    modalCloseBtn.addEventListener('click', closeModal);
    timezoneSearch.addEventListener('input', filterTimezones);
    timezoneModal.addEventListener('click', (e) => {
        if (e.target === timezoneModal) closeModal();
    });
}

function loadTimezones() {
    const saved = localStorage.getItem('selectedTimezones');
    selectedTimezones = saved ? JSON.parse(saved) : DEFAULT_TIMEZONES;
}

function saveTimezones() {
    localStorage.setItem('selectedTimezones', JSON.stringify(selectedTimezones));
}

function openModal() {
    timezoneModal.classList.add('active');
    renderTimezoneList(TIMEZONES);
    timezoneSearch.value = '';
    timezoneSearch.focus();
}

function closeModal() {
    timezoneModal.classList.remove('active');
}

function filterTimezones() {
    const query = timezoneSearch.value.toLowerCase();
    const filtered = TIMEZONES.filter(tz => 
        tz.toLowerCase().includes(query)
    );
    renderTimezoneList(filtered);
}

function renderTimezoneList(timezones) {
    timezoneList.innerHTML = timezones.map(tz => `
        <div class="timezone-item" onclick="addTimezone('${tz}')">
            ${tz}
        </div>
    `).join('');
}

function addTimezone(timezone) {
    if (!selectedTimezones.includes(timezone)) {
        selectedTimezones.push(timezone);
        saveTimezones();
        renderClocks();
        closeModal();
    }
}

function removeTimezone(timezone) {
    selectedTimezones = selectedTimezones.filter(tz => tz !== timezone);
    saveTimezones();
    renderClocks();
}

function resetClocks() {
    selectedTimezones = [...DEFAULT_TIMEZONES];
    saveTimezones();
    renderClocks();
}

function renderClocks() {
    if (selectedTimezones.length === 0) {
        clocksContainer.innerHTML = `
            <div class="empty-state">
                <p>📍 No time zones selected</p>
                <p>Click "+ Add Time Zone" to get started!</p>
            </div>
        `;
        return;
    }

    clocksContainer.innerHTML = selectedTimezones.map(timezone => {
        const time = getTimeInTimezone(timezone);
        return `
            <div class="clock">
                <button class="clock-remove" onclick="removeTimezone('${timezone}')">×</button>
                <div class="clock-timezone">${timezone.replace(/_/g, ' ')}</div>
                <div class="clock-time">${time.time}</div>
                <div class="clock-date">${time.date}</div>
                <div class="clock-offset">${time.offset}</div>
            </div>
        `;
    }).join('');
}

function updateClocks() {
    const clocks = document.querySelectorAll('.clock-time');
    clocks.forEach((clock, index) => {
        const timezone = selectedTimezones[index];
        const time = getTimeInTimezone(timezone);
        clock.textContent = time.time;
    });
}

function getTimeInTimezone(timezone) {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        const dateFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

        const now = new Date();
        const time = formatter.format(now);
        const date = dateFormatter.format(now);

        // Calculate UTC offset
        const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const offsetMs = tzDate - utcDate;
        const offsetHours = offsetMs / (1000 * 60 * 60);
        const sign = offsetHours >= 0 ? '+' : '';
        const offset = `UTC ${sign}${offsetHours.toFixed(0).padStart(2, '0')}:00`;

        return { time, date, offset };
    } catch (error) {
        console.error(`Invalid timezone: ${timezone}`, error);
        return { time: '--:--:--', date: '--', offset: 'UTC' };
    }
}

// Start the app
window.addEventListener('DOMContentLoaded', init);