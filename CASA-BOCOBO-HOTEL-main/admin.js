// Admin Dashboard Script
document.addEventListener('DOMContentLoaded', () => {
  // --- Configuration ---
  let TOTAL_ROOMS = 80; // will be replaced by inventory sum if available
  const STAFF_PER_12_ROOMS = 12; // housekeeping ratio
  const FRONTDESK_CAP_PER_SHIFT = 50; // one FD staff per N occupied rooms

  // --- DOM Elements ---
  const el = {
    kpiBookings: document.getElementById('kpi-bookings'),
    kpiOccupancy: document.getElementById('kpi-occupancy'),
    kpiRevenue: document.getElementById('kpi-revenue'),
    kpiTickets: document.getElementById('kpi-tickets'),
    kpiADR: document.getElementById('kpi-adr'),
    kpiRevPAR: document.getElementById('kpi-revpar'),
    kpiLeadTime: document.getElementById('kpi-leadtime'),
    kpiStaffHousekeeping: document.getElementById('kpi-staff-housekeeping'),
    kpiStaffFrontdesk: document.getElementById('kpi-staff-frontdesk'),
    evalMae: document.getElementById('eval-mae'),
    evalFreshness: document.getElementById('eval-freshness'),
    bookingsTableBody: document.querySelector('#bookings-table tbody'),
    ticketsTableBody: document.querySelector('#tickets-table tbody'),
    inventoryTableBody: document.querySelector('#inventory-table tbody'),
    // Pagination controls
    bookingsPrev: document.getElementById('bookings-prev'),
    bookingsNext: document.getElementById('bookings-next'),
    bookingsInfo: document.getElementById('bookings-page-info'),
    bookingsSize: document.getElementById('bookings-page-size'),
    ticketsPrev: document.getElementById('tickets-prev'),
    ticketsNext: document.getElementById('tickets-next'),
    ticketsInfo: document.getElementById('tickets-page-info'),
    ticketsSize: document.getElementById('tickets-page-size'),
    inventoryPrev: document.getElementById('inventory-prev'),
    inventoryNext: document.getElementById('inventory-next'),
    inventoryInfo: document.getElementById('inventory-page-info'),
    inventorySize: document.getElementById('inventory-page-size'),
    seedBtn: document.getElementById('seed-data-btn'),
    exportBookingsBtn: document.getElementById('export-bookings-btn')
  };

  // --- Helpers ---
  const fmtPHP = (n) => `₱${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const toISODate = (d) => new Date(d).toISOString().slice(0, 10);
  const statusClass = (s) => (s || 'New').toLowerCase().replace(/\s+/g, '-');
  const rangeDays = (daysBack, daysFwd = 0) => {
    const days = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = daysBack; i > 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    days.push(base.toISOString().slice(0, 10));
    for (let i = 1; i <= daysFwd; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  };

  const getAllLocalStorageKeys = () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    return keys;
  };

  // --- Data Access ---
  function loadBookings() {
    const keys = getAllLocalStorageKeys().filter(k => /^booking_(?!status_)/.test(k));
    const out = [];
    keys.forEach(k => {
      try {
        const val = localStorage.getItem(k);
        const obj = JSON.parse(val);
        if (obj && obj.ref) out.push(obj);
      } catch (e) {
        console.warn('Skipping invalid booking key:', k, e);
      }
    });
    return out;
  }

  function loadTickets() {
    const raw = localStorage.getItem('service_tickets');
    return raw ? JSON.parse(raw) : [];
  }

  // Inventory
  let inventory = null;
  async function loadInventory() {
    try {
      const res = await fetch('test-data/room-inventory.json');
      if (res.ok) {
        inventory = await res.json();
        const sum = Object.values(inventory).reduce((a, b) => a + Number(b || 0), 0);
        if (sum > 0) TOTAL_ROOMS = sum;
      } else {
        inventory = null;
      }
    } catch (_) {
      inventory = null;
    }
  }

  function getBookingStatus(ref) {
    return localStorage.getItem(`booking_status_${ref}`) || 'Confirmed';
  }

  function setBookingStatus(ref, status) {
    localStorage.setItem(`booking_status_${ref}`, status);
    pushNotification({ type: 'booking_status', ref, status, at: new Date().toISOString() });
  }

  function setTicketStatus(id, status) {
    const tickets = loadTickets();
    const idx = tickets.findIndex(t => t.id === id);
    if (idx >= 0) {
      tickets[idx].status = status;
      localStorage.setItem('service_tickets', JSON.stringify(tickets));
      pushNotification({ type: 'ticket_status', id, status, at: new Date().toISOString() });
    }
  }

  function pushNotification(payload) {
    const key = 'notifications';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push(payload);
    localStorage.setItem(key, JSON.stringify(list));
  }

  // --- Pagination State ---
  const pager = {
    bookings: { page: 1, size: 10 },
    tickets: { page: 1, size: 10 },
    inventory: { page: 1, size: 10 }
  };
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  // --- Metrics ---
  function isStayActiveOnDate(booking, isoDate) {
    const start = toISODate(booking.checkin);
    const end = toISODate(booking.checkout);
    return isoDate >= start && isoDate <= end && getBookingStatus(booking.ref) !== 'Cancelled';
  }

  function occupancyOn(isoDate, bookings) {
    return bookings.reduce((acc, b) => acc + (isStayActiveOnDate(b, isoDate) ? 1 : 0), 0);
  }

  function revenueOn(isoDate, bookings) {
    // Simple heuristic: attribute full booking revenue to check-in date
    return bookings.reduce((acc, b) => acc + (toISODate(b.checkin) === isoDate ? (Number(b.totalRaw) || 0) : 0), 0);
  }

  function buildSeries(days, fn) {
    const bookings = loadBookings();
    return days.map(d => fn(d, bookings));
  }

  function movingAverage(series, window = 7) {
    const out = [];
    for (let i = 0; i < series.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = series.slice(start, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      out.push(Math.round(avg));
    }
    return out;
  }

  // --- UI Renderers ---
  function renderKPIs() {
    const bookings = loadBookings();
    const tickets = loadTickets();
    const last30 = rangeDays(30);
    const today = todayISO();

    const seriesOcc = buildSeries(last30, occupancyOn);
    const seriesRev = buildSeries(last30, revenueOn);
    const occToday = seriesOcc[seriesOcc.length - 1] || 0;
    const revToday = seriesRev[seriesRev.length - 1] || 0;

    const totalBookings30d = bookings.filter(b => {
      const cIn = toISODate(b.checkin);
      return last30.includes(cIn);
    }).length;

    const openTickets = tickets.filter(t => t.status !== 'Complete').length;

    el.kpiBookings.textContent = totalBookings30d;
    el.kpiOccupancy.textContent = `${Math.round((occToday / TOTAL_ROOMS) * 100)}%`;
    el.kpiRevenue.textContent = fmtPHP(revToday);
    el.kpiTickets.textContent = openTickets;

    // ADR and RevPAR (today)
    const adrToday = occToday > 0 ? (revToday / occToday) : 0;
    const revparToday = TOTAL_ROOMS > 0 ? (revToday / TOTAL_ROOMS) : 0;
    el.kpiADR.textContent = fmtPHP(adrToday);
    el.kpiRevPAR.textContent = fmtPHP(revparToday);

    // Lead time (avg days between createdAt and check-in for upcoming bookings)
    const withCreated = bookings.filter(b => b.createdAt && new Date(b.checkin) >= new Date());
    const leadDays = withCreated.map(b => {
      const created = new Date(b.createdAt);
      const checkin = new Date(b.checkin);
      return Math.max(0, Math.round((checkin - created) / 86400000));
    });
    const leadAvg = leadDays.length ? (leadDays.reduce((a, b) => a + b, 0) / leadDays.length) : 0;
    el.kpiLeadTime.textContent = `${leadAvg.toFixed(1)} d`;
  }

  let charts = {};
  function renderCharts() {
    const last30 = rangeDays(30);
    const occSeries = buildSeries(last30, occupancyOn);
    const revSeries = buildSeries(last30, revenueOn);
    const forecastDays = rangeDays(0, 14);
    // Day-of-week seasonality forecast: average occupancy per weekday over last 30 days
    const weekdayBuckets = { 0: [],1: [],2: [],3: [],4: [],5: [],6: [] };
    last30.forEach((iso, i) => {
      const d = new Date(iso);
      const w = d.getDay();
      weekdayBuckets[w].push(occSeries[i]);
    });
    const weekdayAvg = Object.fromEntries(Object.entries(weekdayBuckets).map(([w, arr]) => {
      const avg = arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
      return [w, Math.round(avg)];
    }));
    const forecastSeries = forecastDays.map(iso => weekdayAvg[new Date(iso).getDay()] || 0);

    charts.occ = new Chart(document.getElementById('chart-occupancy'), {
      type: 'line',
      data: { labels: last30, datasets: [{ label: 'Occupied Rooms', data: occSeries, borderColor: '#F97316', tension: 0.3 }] },
      options: { responsive: true, scales: { y: { beginAtZero: true, suggestedMax: TOTAL_ROOMS } } }
    });

    charts.rev = new Chart(document.getElementById('chart-revenue'), {
      type: 'bar',
      data: { labels: last30, datasets: [{ label: 'Revenue (PHP)', data: revSeries, backgroundColor: '#10B981' }] },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    charts.fc = new Chart(document.getElementById('chart-forecast'), {
      type: 'line',
      data: { labels: forecastDays, datasets: [{ label: 'Forecast Occupancy', data: forecastSeries, borderColor: '#3B82F6', tension: 0.3 }] },
      options: { responsive: true, scales: { y: { beginAtZero: true, suggestedMax: TOTAL_ROOMS } } }
    });
  }

  function renderInventoryTable() {
    if (!el.inventoryTableBody) return;
    const bookings = loadBookings();
    const today = todayISO();
    const occupiedByType = {};
    bookings.forEach(b => {
      if (isStayActiveOnDate(b, today) && getBookingStatus(b.ref) !== 'Cancelled') {
        occupiedByType[b.room] = (occupiedByType[b.room] || 0) + 1;
      }
    });
    const types = inventory ? Object.keys(inventory) : [];
    const rows = types.map(type => {
      const total = Number(inventory[type]) || 0;
      const occ = occupiedByType[type] || 0;
      const avail = Math.max(0, total - occ);
      return { type, total, occ, avail };
    });

    // Pagination
    const totalItems = rows.length;
    const size = pager.inventory.size;
    const maxPage = Math.max(1, Math.ceil(totalItems / size));
    pager.inventory.page = clamp(pager.inventory.page, 1, maxPage);
    const start = (pager.inventory.page - 1) * size;
    const pageRows = rows.slice(start, start + size);

    el.inventoryTableBody.innerHTML = '';
    pageRows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.type}</td>
        <td>${r.total}</td>
        <td>${r.occ}</td>
        <td>${r.avail}</td>
      `;
      el.inventoryTableBody.appendChild(tr);
    });

    if (el.inventoryInfo) el.inventoryInfo.textContent = `Page ${pager.inventory.page} of ${maxPage}`;
    if (el.inventoryPrev) el.inventoryPrev.disabled = pager.inventory.page <= 1;
    if (el.inventoryNext) el.inventoryNext.disabled = pager.inventory.page >= maxPage;
  }

  function renderBookingsTable() {
    const all = loadBookings().sort((a, b) => new Date(b.checkin) - new Date(a.checkin));
    const totalItems = all.length;
    const size = pager.bookings.size;
    const maxPage = Math.max(1, Math.ceil(totalItems / size));
    pager.bookings.page = clamp(pager.bookings.page, 1, maxPage);
    const start = (pager.bookings.page - 1) * size;
    const bookings = all.slice(start, start + size);
    el.bookingsTableBody.innerHTML = '';
    bookings.forEach(b => {
      const tr = document.createElement('tr');
      const status = getBookingStatus(b.ref);
      tr.innerHTML = `
        <td>${b.ref}</td>
        <td>${b.name}</td>
        <td>${b.room}</td>
        <td>${new Date(b.checkin).toLocaleDateString()}</td>
        <td>${new Date(b.checkout).toLocaleDateString()}</td>
        <td>${fmtPHP(Number(b.totalRaw) || 0)}</td>
        <td><span class="status-pill status-${statusClass(status)}">${status}</span></td>
        <td>
          <button class="btn-small" data-action="checkin" data-ref="${b.ref}">Check-in</button>
          <button class="btn-small" data-action="checkout" data-ref="${b.ref}">Check-out</button>
          <button class="btn-small danger" data-action="cancel" data-ref="${b.ref}">Cancel</button>
        </td>
      `;
      el.bookingsTableBody.appendChild(tr);
    });

    el.bookingsTableBody.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ref = e.currentTarget.dataset.ref;
        const action = e.currentTarget.dataset.action;
        if (action === 'checkin') setBookingStatus(ref, 'Checked-in');
        if (action === 'checkout') setBookingStatus(ref, 'Checked-out');
        if (action === 'cancel') setBookingStatus(ref, 'Cancelled');
        renderKPIs();
        renderBookingsTable();
        charts.occ && charts.occ.destroy();
        charts.rev && charts.rev.destroy();
        charts.fc && charts.fc.destroy();
        renderCharts();
      });
    });

    if (el.bookingsInfo) el.bookingsInfo.textContent = `Page ${pager.bookings.page} of ${maxPage}`;
    if (el.bookingsPrev) el.bookingsPrev.disabled = pager.bookings.page <= 1;
    if (el.bookingsNext) el.bookingsNext.disabled = pager.bookings.page >= maxPage;
  }

  function renderTicketsTable() {
    const all = loadTickets().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const totalItems = all.length;
    const size = pager.tickets.size;
    const maxPage = Math.max(1, Math.ceil(totalItems / size));
    pager.tickets.page = clamp(pager.tickets.page, 1, maxPage);
    const start = (pager.tickets.page - 1) * size;
    const tickets = all.slice(start, start + size);
    el.ticketsTableBody.innerHTML = '';
    tickets.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.reference}</td>
        <td>${t.guestName || '-'}</td>
        <td>${t.category}</td>
        <td>${t.type}</td>
        <td>${new Date(t.createdAt).toLocaleString()}</td>
        <td><span class="status-pill status-${statusClass(t.status)}">${t.status || 'New'}</span></td>
        <td>
          <button class="btn-small" data-action="progress" data-id="${t.id}">In Progress</button>
          <button class="btn-small success" data-action="complete" data-id="${t.id}">Complete</button>
        </td>
      `;
      el.ticketsTableBody.appendChild(tr);
    });
    el.ticketsTableBody.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const action = e.currentTarget.dataset.action;
        if (action === 'progress') setTicketStatus(id, 'In Progress');
        if (action === 'complete') setTicketStatus(id, 'Complete');
        renderKPIs();
        renderTicketsTable();
      });
    });

    if (el.ticketsInfo) el.ticketsInfo.textContent = `Page ${pager.tickets.page} of ${maxPage}`;
    if (el.ticketsPrev) el.ticketsPrev.disabled = pager.tickets.page <= 1;
    if (el.ticketsNext) el.ticketsNext.disabled = pager.tickets.page >= maxPage;
  }

  function renderStaffRecommendations() {
    // Use forecast average to derive recommended staff
    const last30 = rangeDays(30);
    const occSeries = buildSeries(last30, occupancyOn);
    const occMA = movingAverage(occSeries, 7);
    const occAvg = Math.round(occMA[occMA.length - 1] || 0);

    const housekeeping = Math.max(2, Math.ceil(occAvg / STAFF_PER_12_ROOMS));
    const frontdesk = Math.max(2, Math.ceil(occAvg / FRONTDESK_CAP_PER_SHIFT));
    el.kpiStaffHousekeeping.textContent = `${housekeeping}`;
    el.kpiStaffFrontdesk.textContent = `${frontdesk}`;
  }

  function renderEvaluation() {
    // Simple heuristic MAE using last 14 days: compare forecast (last avg) to actual
    const last30 = rangeDays(30);
    const recent14 = last30.slice(-14);
    const occSeries = buildSeries(last30, occupancyOn);
    const occMA = movingAverage(occSeries, 7);
    const baseline = occMA[occMA.length - 1] || 0;
    const mae = recent14.reduce((sum, d, idx) => {
      const actual = occSeries[occSeries.length - 14 + idx];
      return sum + Math.abs(actual - baseline);
    }, 0) / recent14.length;
    el.evalMae.textContent = mae.toFixed(2);

    // Data freshness: minutes since last notification
    const notes = JSON.parse(localStorage.getItem('notifications') || '[]');
    const last = notes.length ? new Date(notes[notes.length - 1].at) : null;
    if (last) {
      const mins = Math.round((Date.now() - last.getTime()) / 60000);
      el.evalFreshness.textContent = `${mins} min ago`;
    } else {
      el.evalFreshness.textContent = 'No recent activity';
    }
  }

  // --- Seed & Export ---
  function seedSampleData() {
    // Create 20 random bookings within the last 30 days
    const roomTypes = [
      'Petite Single (PS)','Petite Double (PD)','Standard Twin (ST)','Standard King (SK)',
      'Superior Double (SD)','Superior Twin (SUP2)','Superior Family Room (SUPF)','Superior King (SUPK)',
      'Deluxe Twin (DLX2B)','Deluxe King (DLXK)','Executive Suite (EXEC)','Loft (LOF)'
    ];
    for (let i = 0; i < 20; i++) {
      const ref = `CBH-${Math.floor(100000 + Math.random() * 899999)}`;
      const start = new Date();
      start.setDate(start.getDate() - Math.floor(Math.random() * 28));
      const nights = Math.max(1, Math.floor(Math.random() * 5));
      const end = new Date(start);
      end.setDate(end.getDate() + nights);
      const room = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      const totalRaw = 2000 + Math.floor(Math.random() * 4000) * nights;
      const bookingData = {
        ref,
        name: `Guest ${i + 1}`,
        room,
        checkin: start.toISOString(),
        checkout: end.toISOString(),
        total: fmtPHP(totalRaw),
        totalRaw
      };
      localStorage.setItem(`booking_${ref}`, JSON.stringify(bookingData));
      setBookingStatus(ref, 'Confirmed');
    }

    // Seed a few service tickets
    const tickets = loadTickets();
    for (let i = 0; i < 6; i++) {
      const bookingRefs = loadBookings().map(b => b.ref);
      const pickRef = bookingRefs[Math.floor(Math.random() * bookingRefs.length)] || 'CBH-000000';
      tickets.push({
        id: `TICKET-${Date.now()}-${i}`,
        guestName: `Guest ${i + 1}`,
        room: '—',
        reference: pickRef,
        type: i % 2 === 0 ? 'Service' : 'Complaint',
        category: i % 2 === 0 ? 'Housekeeping' : 'Staff Service',
        details: i % 2 === 0 ? 'Fresh towels please.' : 'Delay at check-in.',
        status: 'New',
        staffAssigned: 'Pending',
        createdAt: new Date().toISOString()
      });
    }
    localStorage.setItem('service_tickets', JSON.stringify(tickets));
    renderAll();
  }

  async function seedFromFiles() {
    try {
      const [bookingsRes, ticketsRes] = await Promise.all([
        fetch('test-data/bookings-sample.json'),
        fetch('test-data/tickets-sample.json')
      ]);
      if (!bookingsRes.ok || !ticketsRes.ok) throw new Error('Sample files not found');
      const [bookingsJson, ticketsJson] = await Promise.all([
        bookingsRes.json(),
        ticketsRes.json()
      ]);

      // Seed bookings
      bookingsJson.forEach(b => {
        const ref = b.ref;
        localStorage.setItem(`booking_${ref}`, JSON.stringify(b));
        if (!localStorage.getItem(`booking_status_${ref}`)) setBookingStatus(ref, 'Confirmed');
      });

      // Seed tickets (append)
      const existing = loadTickets();
      const merged = [...existing, ...ticketsJson];
      localStorage.setItem('service_tickets', JSON.stringify(merged));

      renderAll();
      alert('Sample data seeded from test-data JSON files.');
    } catch (err) {
      console.error('Seeding from files failed, falling back to random:', err);
      seedSampleData();
      alert('Random sample data seeded.');
    }
  }

  function exportBookingsCSV() {
    const bookings = loadBookings();
    const header = ['Ref','Guest','Room','Check-in','Check-out','TotalRaw','Status'];
    const rows = bookings.map(b => [
      b.ref,
      b.name,
      b.room,
      new Date(b.checkin).toISOString(),
      new Date(b.checkout).toISOString(),
      Number(b.totalRaw) || 0,
      getBookingStatus(b.ref)
    ]);
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- Wiring ---
  function setupPagination() {
    // Bookings controls
    if (el.bookingsSize) {
      el.bookingsSize.addEventListener('change', () => {
        pager.bookings.size = Number(el.bookingsSize.value) || 10;
        pager.bookings.page = 1;
        renderBookingsTable();
      });
    }
    if (el.bookingsPrev) {
      el.bookingsPrev.addEventListener('click', () => {
        pager.bookings.page = Math.max(1, pager.bookings.page - 1);
        renderBookingsTable();
      });
    }
    if (el.bookingsNext) {
      el.bookingsNext.addEventListener('click', () => {
        pager.bookings.page = pager.bookings.page + 1;
        renderBookingsTable();
      });
    }

    // Tickets controls
    if (el.ticketsSize) {
      el.ticketsSize.addEventListener('change', () => {
        pager.tickets.size = Number(el.ticketsSize.value) || 10;
        pager.tickets.page = 1;
        renderTicketsTable();
      });
    }
    if (el.ticketsPrev) {
      el.ticketsPrev.addEventListener('click', () => {
        pager.tickets.page = Math.max(1, pager.tickets.page - 1);
        renderTicketsTable();
      });
    }
    if (el.ticketsNext) {
      el.ticketsNext.addEventListener('click', () => {
        pager.tickets.page = pager.tickets.page + 1;
        renderTicketsTable();
      });
    }

    // Inventory controls
    if (el.inventorySize) {
      el.inventorySize.addEventListener('change', () => {
        pager.inventory.size = Number(el.inventorySize.value) || 10;
        pager.inventory.page = 1;
        renderInventoryTable();
      });
    }
    if (el.inventoryPrev) {
      el.inventoryPrev.addEventListener('click', () => {
        pager.inventory.page = Math.max(1, pager.inventory.page - 1);
        renderInventoryTable();
      });
    }
    if (el.inventoryNext) {
      el.inventoryNext.addEventListener('click', () => {
        pager.inventory.page = pager.inventory.page + 1;
        renderInventoryTable();
      });
    }
  }
  function renderAll() {
    renderKPIs();
    renderCharts();
    renderBookingsTable();
    renderTicketsTable();
    renderStaffRecommendations();
    renderEvaluation();
    renderInventoryTable();
  }

  el.seedBtn.addEventListener('click', seedFromFiles);
  el.exportBookingsBtn.addEventListener('click', exportBookingsCSV);

  // Initial render
  loadInventory().then(() => {
    setupPagination();
    renderAll();
  });
});