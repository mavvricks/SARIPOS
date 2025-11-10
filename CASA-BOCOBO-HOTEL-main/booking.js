document.addEventListener('DOMContentLoaded', () => {
    // --- Data & Configuration ---
    const roomData = [
        { id: 1, name: 'Petite Single (PS)', price: 2182.50, img: 'https://s3.ap-south-1.amazonaws.com/buzz.beconf.test/casa-bocobo-hotel/casa-bocobo-hotel-rooms-0-2.jpg?_cache=1678698597' },
        { id: 2, name: 'Petite Double (PD)', price: 2182.50, img: 'https://s3.ap-south-1.amazonaws.com/buzz.beconf.test/casa-bocobo-hotel/casa-bocobo-hotel-rooms-1-0.jpg?_cache=1678242282' },
        { id: 3, name: 'Standard Twin (ST)', price: 2362.50, img: 'https://s3.ap-south-1.amazonaws.com/buzz.beconf.test/casa-bocobo-hotel/casa-bocobo-hotel-rooms-2-2.jpg?_cache=1678698666' },
        { id: 4, name: 'Standard King (SK)', price: 2362.50, img: 'https://s3.ap-south-1.amazonaws.com/buzz.beconf.test/casa-bocobo-hotel/casa-bocobo-hotel-rooms-3-2.jpg?_cache=1678242345' },
        { id: 5, name: 'Superior Double (SD)', price: 2632.50, img: 'https://s3.ap-south-1.amazonaws.com/buzz.beconf.test/casa-bocobo-hotel/casa-bocobo-hotel-rooms-4-0.jpg?_cache=1678242404' },
        { id: 6, name: 'Superior Twin (SUP2)', price: 2632.50, img: 'https://s3.ap-south-1.amazonaws.com/buzz.beconf.test/casa-bocobo-hotel/casa-bocobo-hotel-rooms-5-0.jpg?_cache=1678242493' },
        { id: 7, name: 'Superior Family Room (SUPF)', price: 2812.50, img: 'https://s3.ap-south-1.amazonaws.com/buzz.beconf.test/casa-bocobo-hotel/casa-bocobo-hotel-rooms-6-0.jpg?_cache=1678242527' },
        { id: 8, name: 'Superior King (SUPK)', price: 2812.50, img: 'https://s3.ap-south-1.amazonaws.com/buzz.beconf.test/casa-bocobo-hotel/casa-bocobo-hotel-rooms-6-0.jpg?_cache=1678242527' },
        { id: 9, name: 'Deluxe Twin (DLX2B)', price: 2992.50, img: 'https://s3.ap-south-1.amazonaws.com/buzz.beconf.test/casa-bocobo-hotel/casa-bocobo-hotel-rooms-7-0.jpg?_cache=1678413324' },
        { id: 10, name: 'Deluxe King (DLXK)', price: 3352.50, img: 'https://s3.ap-south-1.amazonaws.com/buzz.beconf.test/casa-bocobo-hotel/casa-bocobo-hotel-rooms-8-0.jpg?_cache=1678242160' },
        { id: 11, name: 'Executive Suite (EXEC)', price: 3532.50, img: 'https://s3.ap-south-1.amazonaws.com/buzz.beconf.test/casa-bocobo-hotel/casa-bocobo-hotel-rooms-9-0.jpg?_cache=1678242160' },
        { id: 12, name: 'Loft (LOF)', price: 4000.00, img: 'https://s3.ap-south-1.amazonaws.com/buzz.beconf.test/casa-bocobo-hotel/casa-bocobo-hotel-rooms-10-2.jpg?_cache=1678702081' }
    ];

    const supportedCurrencies = {
        'PHP': { symbol: '₱', format: (val) => `₱${val.toFixed(2)}` },
        'USD': { symbol: '$', format: (val) => `$${val.toFixed(2)}` },
        'EUR': { symbol: '€', format: (val) => `€${val.toFixed(2)}` },
        'JPY': { symbol: '¥', format: (val) => `¥${val.toFixed(0)}` },
        'GBP': { symbol: '£', format: (val) => `£${val.toFixed(2)}` },
        'AUD': { symbol: 'A$', format: (val) => `A$${val.toFixed(2)}` },
        'CAD': { symbol: 'C$', format: (val) => `C$${val.toFixed(2)}` }
    };

    let currencyRates = {};

    // --- DOM Elements ---
    const bookingForm = document.getElementById('booking-form');
    const fullNameEl = document.getElementById('full-name');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');
    const consentCheckbox = document.getElementById('consent-checkbox');
    const currencyBtn = document.getElementById('currency-switcher-btn');
    const currencyDropdown = document.getElementById('currency-switcher-dropdown');
    const selectedCurrencyLabel = document.getElementById('selected-currency-label');
    
    const checkinDateEl = document.getElementById('checkin-date');
    const checkoutDateEl = document.getElementById('checkout-date');
    const adultsEl = document.getElementById('adults');
    const childrenEl = document.getElementById('children');
    const roomSelectionEl = document.getElementById('room-selection');
    
    // Get the add-ons section by its new ID
    const addonsSectionEl = document.getElementById('addons-section');
    
    const confirmBtn = document.getElementById('confirm-booking-btn');
    
    const findRefInput = document.getElementById('find-ref-number');
    const findBookingBtn = document.getElementById('find-booking-btn');
    
    const confirmModal = document.getElementById('confirmation-modal');
    const receiptModal = document.getElementById('receipt-modal');
    const bookingDetailsModal = document.getElementById('booking-details-modal');
    const cancelConfirmModal = document.getElementById('cancel-confirm-modal');
    
    const viewReceiptBtn = document.getElementById('view-receipt-btn');
    const closeConfirmBtn = document.getElementById('close-confirm-btn');
    const closeReceiptBtn = document.getElementById('close-receipt-btn');
    const downloadReceiptBtn = document.getElementById('download-receipt-btn');
    const cancelReservationBtn = document.getElementById('cancel-reservation-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const nevermindCancelBtn = document.getElementById('nevermind-cancel-btn');
    const allCloseBtns = document.querySelectorAll('.close-modal');

    // --- State Management ---
    let bookingState = { currency: 'PHP' };
    let bookingToCancel = null;

    // --- Helper Functions ---
    const formatCurrency = (amountInPHP) => {
        const selectedCurrency = bookingState.currency || 'PHP';
        const rateInfo = currencyRates[selectedCurrency];

        if (!rateInfo) {
            return `₱${amountInPHP.toFixed(2)}`;
        }
        
        return rateInfo.format(amountInPHP * rateInfo.rate);
    };

    const setupScrollAnimations = () => { const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.1 }); document.querySelectorAll('.fade-in-section').forEach(section => observer.observe(section)); };
    
    function initializeDatepickers() {
        const today = new Date();
        const minDate = today.toISOString().split('T')[0];
        checkinDateEl.setAttribute('min', minDate);
        
        checkinDateEl.addEventListener('change', () => {
            const checkinDate = new Date(checkinDateEl.value);
            const nextDay = new Date(checkinDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const minCheckoutDate = nextDay.toISOString().split('T')[0];
            checkoutDateEl.setAttribute('min', minCheckoutDate);
            if (checkoutDateEl.value <= checkinDateEl.value) { checkoutDateEl.value = minCheckoutDate; }
            updateBookingState();
        });
    }

    // --- Currency API & Dropdown Logic ---
    async function fetchCurrencyRates() {
        try {
            const response = await fetch('https://open.er-api.com/v6/latest/PHP');
            if (!response.ok) throw new Error('Failed to fetch rates');
            
            const data = await response.json();
            
            currencyRates = {};
            for (const code of Object.keys(supportedCurrencies)) {
                if (data.rates[code]) {
                    currencyRates[code] = {
                        rate: data.rates[code],
                        format: supportedCurrencies[code].format
                    };
                }
            }
            currencyRates['PHP'] = { rate: 1, format: supportedCurrencies['PHP'].format };

            populateCurrencyDropdown();

        } catch (error) {
            console.error('Error fetching currency rates:', error);
            currencyDropdown.innerHTML = '<li class="error-rates">Failed to load rates.</li>';
            
            currencyRates = {
                'PHP': { rate: 1, format: supportedCurrencies['PHP'].format },
                'USD': { rate: 0.017, format: supportedCurrencies['USD'].format }
            };
            populateCurrencyDropdown();
        }
    }

    function populateCurrencyDropdown() {
        currencyDropdown.innerHTML = '';

        Object.keys(currencyRates).forEach(code => {
            const li = document.createElement('li');
            li.dataset.currency = code;
            li.textContent = `${code} (${supportedCurrencies[code].symbol})`;
            
            li.addEventListener('click', () => {
                bookingState.currency = code;
                selectedCurrencyLabel.textContent = `${code} (${supportedCurrencies[code].symbol})`;
                currencyDropdown.classList.remove('show');
                updateBookingState();
            });
            currencyDropdown.appendChild(li);
        });
    }

    // --- Core Rendering Functions ---
    const displayRooms = () => {
        roomSelectionEl.innerHTML = '';
        if (!bookingState.checkin || !bookingState.checkout) {
            roomSelectionEl.innerHTML = `<p class="loading-text">Please select your dates to view available rooms.</p>`;
            return;
        }
        roomData.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card';
            card.dataset.roomId = room.id;
            card.innerHTML = `<img src="${room.img}" alt="${room.name}"><div class="room-details"><h4>${room.name}</h4><p class="room-price">${formatCurrency(room.price)} <span>/ night</span></p></div>`;
            card.addEventListener('click', () => selectRoom(room.id));
            roomSelectionEl.appendChild(card);
        });
    };

    const selectRoom = (roomId) => {
        bookingState.selectedRoom = roomData.find(r => r.id === roomId);
        document.querySelectorAll('.room-card').forEach(card => card.classList.remove('selected'));
        document.querySelector(`.room-card[data-room-id='${roomId}']`).classList.add('selected');
        
        // Unlock the add-ons section when a room is selected
        addonsSectionEl.classList.remove('disabled');

        updateSummary();
    };
    
    function updateSummary() {
        const { checkin, checkout, adults, selectedRoom } = bookingState;
        document.getElementById('summary-checkin').textContent = checkin ? new Date(checkin).toLocaleDateString() : '--';
        document.getElementById('summary-checkout').textContent = checkout ? new Date(checkout).toLocaleDateString() : '--';
        document.getElementById('summary-guests').textContent = `${adults} Adult(s), ${parseInt(childrenEl.value)} Child(ren)`;
        document.getElementById('summary-room-name').textContent = selectedRoom ? selectedRoom.name : 'Not selected';
        
        let roomCostPHP = 0, nights = 0;
        if (checkin && checkout && selectedRoom) {
            nights = Math.max(1, Math.round(Math.abs((new Date(checkin) - new Date(checkout)) / 864e5)));
            roomCostPHP = nights * selectedRoom.price;
        }
        document.getElementById('summary-nights-text').textContent = `Room Subtotal (${nights} nights):`;
        document.getElementById('summary-room-cost').textContent = formatCurrency(roomCostPHP);
        
        const addons = Array.from(document.querySelectorAll('.addon-card input:checked')).map(cb => parseFloat(cb.getAttribute('data-price-php')));
        let addonsCostPHP = addons.reduce((total, price) => total + price, 0);
        document.getElementById('summary-addons-cost').textContent = formatCurrency(addonsCostPHP);
        
        bookingState.totalCost = roomCostPHP + addonsCostPHP;
        document.getElementById('summary-total-cost').textContent = formatCurrency(bookingState.totalCost);
        validateForm();

        // Control the disabled state of the add-ons section
        // This runs every time the summary updates
        if (bookingState.selectedRoom) {
            addonsSectionEl.classList.remove('disabled');
        } else {
            addonsSectionEl.classList.add('disabled');
        }
    }
    
    function updateBookingState() {
        bookingState = {
            ...bookingState,
            checkin: checkinDateEl.value,
            checkout: checkoutDateEl.value,
            adults: parseInt(adultsEl.value),
            consentGiven: consentCheckbox.checked,
            guestDetails: {
                fullName: fullNameEl.value.trim(),
                email: emailEl.value.trim(),
                phone: phoneEl.value.trim()
            }
        };

        if (bookingState.checkin && bookingState.checkout) {
            displayRooms();
            if (bookingState.selectedRoom) {
                const card = document.querySelector(`.room-card[data-room-id='${bookingState.selectedRoom.id}']`);
                if (card) card.classList.add('selected');
            }
        }
        updateSummary();
    }
    
    function validateForm() {
        const { checkin, checkout, selectedRoom, consentGiven, guestDetails } = bookingState;
        const nights = (new Date(checkout) - new Date(checkin)) / 864e5;
        const isGuestInfoValid = guestDetails.fullName !== '' && guestDetails.email.includes('@') && guestDetails.phone.length > 5;
        confirmBtn.disabled = !(checkin && checkout && nights > 0 && selectedRoom && consentGiven && isGuestInfoValid);
    }

    function resetForm() {
        bookingForm.reset();
        bookingState = { currency: 'PHP' };
        selectedCurrencyLabel.textContent = `PHP (${supportedCurrencies['PHP'].symbol})`;
        
        document.querySelectorAll('.room-card').forEach(card => card.classList.remove('selected'));
        
        // Make sure add-ons are re-disabled on form reset
        addonsSectionEl.classList.add('disabled');
        
        updateBookingState();
    }

    // --- Booking Creation & Receipt Functions ---
    function showConfirmation() {
        const { selectedRoom, checkin, checkout, totalCost, guestDetails } = bookingState;
        const referenceNumber = `CBH-${Date.now().toString().slice(-6)}`;
        bookingState.referenceNumber = referenceNumber;
        
        const formattedTotal = formatCurrency(totalCost);
        const bookingData = { 
            ref: referenceNumber, 
            name: guestDetails.fullName, 
            room: selectedRoom.name, 
            checkin: checkin, 
            checkout: checkout, 
            total: formattedTotal,
            totalRaw: totalCost
        };
        localStorage.setItem(`booking_${referenceNumber}`, JSON.stringify(bookingData));

        document.getElementById('ref-number').textContent = referenceNumber;
        document.getElementById('receipt-name').textContent = guestDetails.fullName;
        document.getElementById('receipt-room').textContent = selectedRoom.name;
        document.getElementById('receipt-checkin').textContent = new Date(checkin).toLocaleDateString();
        document.getElementById('receipt-checkout').textContent = new Date(checkout).toLocaleDateString();
        document.getElementById('receipt-total').textContent = formattedTotal;
        
        confirmModal.classList.add('show');
    }

    async function handleDownloadReceipt() {
        const receiptArea = document.getElementById('receipt-capture-area');
        const referenceNumber = bookingState.referenceNumber || 'receipt';
        downloadReceiptBtn.textContent = 'Saving...';
        downloadReceiptBtn.disabled = true;
        try {
            const canvas = await html2canvas(receiptArea, { backgroundColor: '#FFFFFF', scale: 2 });
            const imageURL = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = imageURL;
            downloadLink.download = `Casa-Bocobo-Receipt-${referenceNumber}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } catch (error) {
            console.error('Error generating receipt image:', error);
            console.error('Sorry, there was an error generating the receipt image.');
        } finally {
            downloadReceiptBtn.textContent = 'Download Receipt';
            downloadReceiptBtn.disabled = false;
        }
    }

    // --- Find & Cancel Booking Functions ---
    function findBooking() {
        const refNumber = findRefInput.value.trim().toUpperCase();
        if (!refNumber) {
            console.error('Please enter a reference number.');
            return;
        }

        const bookingDataString = localStorage.getItem(`booking_${refNumber}`);
        if (!bookingDataString) {
            console.error('Reservation not found. Please check your reference number.');
            return;
        }

        const bookingData = JSON.parse(bookingDataString);
        bookingToCancel = bookingData.ref;

        document.getElementById('details-ref').textContent = bookingData.ref;
        document.getElementById('details-name').textContent = bookingData.name;
        document.getElementById('details-room').textContent = bookingData.room;
        document.getElementById('details-checkin').textContent = new Date(bookingData.checkin).toLocaleDateString();
        document.getElementById('details-checkout').textContent = new Date(bookingData.checkout).toLocaleDateString();
        document.getElementById('details-total').textContent = bookingData.total;

        const checkinDate = new Date(bookingData.checkin);
        const today = new Date();
        const hoursUntilCheckin = (checkinDate.getTime() - today.getTime()) / (1000 * 60 * 60);
        const statusEl = document.getElementById('cancellation-status');
        if (hoursUntilCheckin >= 24) {
            statusEl.textContent = "You are eligible for free cancellation.";
            statusEl.className = "status-safe";
        } else {
            statusEl.textContent = "Your booking is within 24 hours of check-in. A penalty may apply.";
            statusEl.className = "status-penalty";
        }
        
        bookingDetailsModal.classList.add('show');
    }

    function confirmCancellation() {
        if (!bookingToCancel) return;
        localStorage.removeItem(`booking_${bookingToCancel}`);
        cancelConfirmModal.classList.remove('show');
        bookingToCancel = null;
        findRefInput.value = '';
        console.log('Your reservation has been successfully cancelled.');
    }

    // --- Event Listeners ---
    [checkinDateEl, checkoutDateEl, adultsEl, childrenEl, consentCheckbox, fullNameEl, emailEl, phoneEl].forEach(el => {
        el.addEventListener('change', updateBookingState);
        el.addEventListener('keyup', updateBookingState);
    });
    document.querySelectorAll('.addon-card input').forEach(checkbox => checkbox.addEventListener('change', updateBookingState));
    confirmBtn.addEventListener('click', (e) => { e.preventDefault(); if (!confirmBtn.disabled) showConfirmation(); });
    
    findBookingBtn.addEventListener('click', findBooking);
    cancelReservationBtn.addEventListener('click', () => {
        bookingDetailsModal.classList.remove('show');
        cancelConfirmModal.classList.add('show');
    });
    confirmCancelBtn.addEventListener('click', confirmCancellation);
    nevermindCancelBtn.addEventListener('click', () => {
        cancelConfirmModal.classList.remove('show');
        bookingToCancel = null;
        bookingDetailsModal.classList.add('show');
    });

    viewReceiptBtn.addEventListener('click', () => {
        confirmModal.classList.remove('show');
        receiptModal.classList.add('show');
    });
    downloadReceiptBtn.addEventListener('click', handleDownloadReceipt);
    closeConfirmBtn.addEventListener('click', () => {
        confirmModal.classList.remove('show');
        resetForm();
    });
    closeReceiptBtn.addEventListener('click', () => {
        receiptModal.classList.remove('show');
        resetForm();
    });
    allCloseBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').classList.remove('show');
        });
    });

    currencyBtn.addEventListener('click', () => {
        currencyDropdown.classList.toggle('show');
    });

    window.addEventListener('click', (e) => {
        if (!e.target.closest('.currency-switcher-container')) {
            currencyDropdown.classList.remove('show');
        }
    });
    
    // --- Initialization ---
    fetchCurrencyRates();
    initializeDatepickers();
    
    // Disable add-ons on initial load
    addonsSectionEl.classList.add('disabled');
    
    updateBookingState();
    setupScrollAnimations();
});