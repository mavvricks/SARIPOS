// --- Data for Points of Interest with Durations and Preset Times ---
const attractions = [
    { id: 1, name: 'Rizal Park', category: 'Attraction', desc: 'A major historical urban park.', lat: 14.5826, lng: 120.9784, duration: 1.5, presetTime: '15:00' },
    { id: 2, name: 'National Museum Complex', category: 'Attraction', desc: 'Fine Arts, Anthropology, & Natural History.', lat: 14.5855, lng: 120.9806, duration: 3.0, presetTime: '10:00' },
    { id: 3, name: 'Intramuros (Walled City)', category: 'Attraction', desc: 'The historic core of Manila.', lat: 14.5905, lng: 120.9745, duration: 4.0, presetTime: '09:00' },
    { id: 4, name: 'Manila Ocean Park', category: 'Attraction', desc: 'An oceanarium and marine theme park.', lat: 14.5771, lng: 120.9736, duration: 3.5, presetTime: '13:00' },
    { id: 5, name: 'Robinsons Place Manila', category: 'Shopping', desc: 'A large shopping mall.', lat: 14.5828, lng: 120.9845, duration: 2.5, presetTime: '16:00' },
    { id: 6, name: 'Ilustrado Restaurant', category: 'Restaurant', desc: 'Filipino-Spanish cuisine in Intramuros.', lat: 14.5912, lng: 120.9749, duration: 1.5, presetTime: '12:00' },
    { id: 7, name: 'Cafe Adriatico', category: 'Restaurant', desc: 'A classic and beloved Manila bistro.', lat: 14.5779, lng: 120.9859, duration: 1.0, presetTime: '19:00' },
    { id: 8, name: 'Barbara\'s Heritage Restaurant', category: 'Restaurant', desc: 'Traditional food with cultural shows.', lat: 14.5901, lng: 120.9739, duration: 2.0, presetTime: '19:30' },
    { id: 10, name: 'Belfry Cafe', category: 'Cafe', desc: 'A quiet spot inside the Manila Cathedral.', lat: 14.5945, lng: 120.9739, duration: 1.0, presetTime: '15:00' }
];

const premadeItineraries = {
    historical: [[ { id: 3, time: '09:00', duration: 4.0 }, { id: 6, time: '13:00', duration: 1.5 }, { id: 2, time: '14:30', duration: 3.0 } ]],
    leisure: [[ { id: 5, time: '10:00', duration: 2.5 }, { id: 4, time: '14:00', duration: 3.5 }, { id: 7, time: '18:00', duration: 1.0 } ]],
};

let map;
let userPlan = [[]]; // State: [[{id, time, duration}, ...], [...]]

// --- HELPER FUNCTION FOR TIME CALCULATION ---
function calculateEndTime(startTime, durationHours) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const durationMinutes = durationHours * 60;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + durationMinutes);

    const newHours = String(date.getHours()).padStart(2, '0');
    const newMinutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${newHours}:${newMinutes}`;
}


// --- Google Map Initialization ---
async function initMap() {
    const hotelLocation = { lat: 14.5820, lng: 120.9830 };
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    map = new Map(document.getElementById("map"), { center: hotelLocation, zoom: 15, mapId: 'CASA_BOCOBO_MAP' });

    const hotelPin = new PinElement({ scale: 1.5, background: "#D97706", borderColor: "#FFFFFF", glyphColor: "#FFFFFF" });
    new AdvancedMarkerElement({ map, position: hotelLocation, title: "Casa Bocobo Hotel", content: hotelPin.element });

    attractions.forEach(attraction => {
        const marker = new AdvancedMarkerElement({ map, position: { lat: attraction.lat, lng: attraction.lng }, title: attraction.name });
        const infowindow = new google.maps.InfoWindow({ content: `<h5>${attraction.name}</h5><p>${attraction.desc}</p>` });
        marker.addListener('gmp-click', () => { infowindow.open({ anchor: marker, map }); });
    });

    renderAvailableLocations('all');
    renderItinerary();
}

// --- Rendering Functions ---
function renderAvailableLocations(filter) {
    const listEl = document.getElementById('attractions-list');
    listEl.innerHTML = '';
    const filteredAttractions = attractions.filter(attr => filter === 'all' || attr.category === filter);
    const allPlannedIds = userPlan.flat().map(item => item.id);

    filteredAttractions.forEach(attraction => {
        const isAdded = allPlannedIds.includes(attraction.id);
        const card = document.createElement('div');
        card.className = 'attraction-card';
        card.innerHTML = `<div class="card-info"><h4>${attraction.name}</h4><p>${attraction.desc}</p></div><button class="add-btn" data-id="${attraction.id}" ${isAdded ? 'disabled' : ''}>${isAdded ? 'Added' : 'Add +'}</button>`;
        listEl.appendChild(card);
    });
}

function renderItinerary() {
    const container = document.getElementById('itinerary-days-container');
    container.innerHTML = '';
    if (userPlan.length === 0 || userPlan.every(day => day.length === 0)) {
        container.innerHTML = '<p class="empty-plan-text">Your itinerary is empty. Click "Add" on any location to start planning!</p>';
        renderAvailableLocations(document.querySelector('.filter-btn.active').dataset.filter);
        return;
    }

    userPlan.forEach((day, dayIndex) => {
        day.sort((a, b) => a.time.localeCompare(b.time));
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        let dayTotalDuration = day.reduce((total, item) => total + parseFloat(item.duration), 0);
        let dayItemsHTML = day.map((item, itemIndex) => {
            const attraction = attractions.find(a => a.id === item.id);
            return `
                <div class="plan-item" data-id="${item.id}">
                    <input type="time" class="plan-item-time" value="${item.time}" data-day-index="${dayIndex}" data-item-index="${itemIndex}">
                    <div class="plan-item-details">
                        <strong>${attraction.name}</strong>
                    </div>
                    <div class="duration-control">
                        <input type="number" class="plan-item-duration" value="${item.duration}" min="0.5" step="0.5" data-day-index="${dayIndex}" data-item-index="${itemIndex}">
                        <span>hrs</span>
                    </div>
                    <button class="remove-item-btn" data-day-index="${dayIndex}" data-item-index="${itemIndex}">×</button>
                </div>`;
        }).join('');

        dayCard.innerHTML = `<div class="day-header"><h3>Day ${dayIndex + 1}</h3><button class="remove-day-btn" data-day-index="${dayIndex}">Remove Day</button></div><div class="day-plan-list">${dayItemsHTML || '<p class="empty-day-text">Add items to this day.</p>'}</div><div class="day-summary">Total Time: ~${dayTotalDuration.toFixed(1)} hours</div>`;
        container.appendChild(dayCard);
    });
    renderAvailableLocations(document.querySelector('.filter-btn.active').dataset.filter);
}

// --- Itinerary Logic ---
function addToPlan(attractionId) {
    if (userPlan.length === 0) userPlan.push([]);
    const lastDayIndex = userPlan.length - 1;
    const lastDay = userPlan[lastDayIndex];
    const attraction = attractions.find(a => a.id === attractionId);

    let newTime = attraction.presetTime;
    
    if (lastDay.length > 0) {
        const lastItem = lastDay[lastDay.length - 1];
        newTime = calculateEndTime(lastItem.time, parseFloat(lastItem.duration));
    }

    lastDay.push({ id: attractionId, time: newTime, duration: attraction.duration });
    renderItinerary();
}

function removeFromPlan(dayIndex, itemIndex) {
    userPlan[dayIndex].splice(itemIndex, 1);
    // After removing an item, we need to recalculate the times for subsequent items
    updateCascadingTimes(dayIndex, itemIndex - 1);
    renderItinerary();
}

function updateTime(dayIndex, itemIndex, newTime) {
    userPlan[dayIndex][itemIndex].time = newTime;
    // When a time is manually changed, we need to update all subsequent items
    updateCascadingTimes(dayIndex, itemIndex);
    renderItinerary();
}

function updateDuration(dayIndex, itemIndex, newDuration) {
    userPlan[dayIndex][itemIndex].duration = newDuration;
    // When a duration is changed, we also need to update all subsequent items
    updateCascadingTimes(dayIndex, itemIndex);
    renderItinerary();
}

// --- NEW CASCADING UPDATE FUNCTION ---
function updateCascadingTimes(dayIndex, startIndex) {
    const day = userPlan[dayIndex];
    // Start from the item that was changed and update everything after it
    for (let i = startIndex; i < day.length - 1; i++) {
        const currentItem = day[i];
        const nextItem = day[i + 1];
        
        // Calculate the end time of the current item and set it as the start time for the next
        nextItem.time = calculateEndTime(currentItem.time, parseFloat(currentItem.duration));
    }
}


function addDay() { userPlan.push([]); renderItinerary(); }
function removeDay(dayIndex) { if (userPlan.length > 1) userPlan.splice(dayIndex, 1); else userPlan = [[]]; renderItinerary(); }
function resetItinerary() { userPlan = [[]]; renderItinerary(); }
function loadPremadePlan(planName) { userPlan = JSON.parse(JSON.stringify(premadeItineraries[planName])); renderItinerary(); }

async function handlePrintItinerary() {
    const itineraryArea = document.getElementById('itinerary-days-container');
    const timeInputs = itineraryArea.querySelectorAll('.plan-item-time, .plan-item-duration');
    timeInputs.forEach(input => input.classList.add('print-mode'));
    
    const printBtn = document.getElementById('print-itinerary-btn');
    printBtn.textContent = 'Saving...'; printBtn.disabled = true;

    try {
        const canvas = await html2canvas(itineraryArea, { scale: 2, backgroundColor: '#F9FAFB' });
        const imageURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = imageURL;
        downloadLink.download = 'My-Manila-Itinerary.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (error) {
        console.error('Error generating itinerary image:', error);
    } finally {
        timeInputs.forEach(input => input.classList.remove('print-mode'));
        printBtn.textContent = 'Save Itinerary as Image'; printBtn.disabled = false;
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.filters').addEventListener('click', e => { if (e.target.classList.contains('filter-btn')) { document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active')); e.target.classList.add('active'); renderAvailableLocations(e.target.dataset.filter); } });
    document.querySelector('.plan-buttons').addEventListener('click', e => { if (e.target.classList.contains('plan-btn')) { loadPremadePlan(e.target.dataset.plan); } });
    document.getElementById('attractions-list').addEventListener('click', e => { if (e.target.classList.contains('add-btn')) { addToPlan(parseInt(e.target.dataset.id)); } });
    
    const daysContainer = document.getElementById('itinerary-days-container');
    daysContainer.addEventListener('click', e => {
        if (e.target.classList.contains('remove-day-btn')) { removeDay(parseInt(e.target.dataset.dayIndex)); }
        if (e.target.classList.contains('remove-item-btn')) { removeFromPlan(parseInt(e.target.dataset.dayIndex), parseInt(e.target.dataset.itemIndex)); }
    });
    daysContainer.addEventListener('change', e => {
        const dayIndex = parseInt(e.target.dataset.dayIndex);
        const itemIndex = parseInt(e.target.dataset.itemIndex);
        if (e.target.classList.contains('plan-item-time')) {
            updateTime(dayIndex, itemIndex, e.target.value);
        }
        if (e.target.classList.contains('plan-item-duration')) {
            updateDuration(dayIndex, itemIndex, parseFloat(e.target.value) || 0);
        }
    });

    document.getElementById('add-day-btn').addEventListener('click', addDay);
    document.getElementById('reset-itinerary-btn').addEventListener('click', resetItinerary);
    document.getElementById('print-itinerary-btn').addEventListener('click', handlePrintItinerary);
});
