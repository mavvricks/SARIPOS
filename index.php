<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Mama's Tindahan</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        body { -webkit-tap-highlight-color: transparent; font-family: 'Segoe UI', sans-serif; }
    </style>
</head>
<body class="bg-gray-100 h-screen flex overflow-hidden">

    <aside class="w-20 md:w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div class="p-4 md:p-6 text-xl md:text-2xl font-bold text-center border-b border-slate-700">
            <i class="fa-solid fa-store text-yellow-400"></i> <span class="hidden md:inline ml-2">Mama's Tindahan</span>
        </div>
        
        <nav class="flex-1 p-2 space-y-2 mt-4">
            <button id="btn-pos" onclick="nav('pos')" class="nav-btn w-full p-4 rounded-xl transition text-center md:text-left text-slate-300 hover:bg-slate-800">
                <i class="fa-solid fa-cash-register text-2xl md:mr-3"></i> <span class="hidden md:inline font-medium">POS</span>
            </button>
            <button id="btn-inventory" onclick="nav('inventory')" class="nav-btn w-full p-4 rounded-xl transition text-center md:text-left text-slate-300 hover:bg-slate-800">
                <i class="fa-solid fa-boxes-stacked text-2xl md:mr-3"></i> <span class="hidden md:inline font-medium">Inventory</span>
            </button>
            <button id="btn-analytics" onclick="nav('analytics')" class="nav-btn w-full p-4 rounded-xl transition text-center md:text-left text-slate-300 hover:bg-slate-800">
                <i class="fa-solid fa-chart-pie text-2xl md:mr-3"></i> <span class="hidden md:inline font-medium">Analytics</span>
            </button>
            <button id="btn-ai" onclick="nav('ai')" class="nav-btn w-full p-4 rounded-xl transition text-center md:text-left text-slate-300 hover:bg-slate-800 mt-4">
                <i class="fa-solid fa-robot text-2xl md:mr-3"></i> <span class="hidden md:inline font-medium">AI Advisor</span>
            </button>
        </nav>
        
        <div class="p-4 border-t border-slate-800">
            <button onclick="enterApiKey()" class="text-xs text-gray-500 hover:text-white w-full text-center flex items-center justify-center gap-2">
                <i class="fa-solid fa-key"></i> <span class="hidden md:inline">Set AI Key</span>
            </button>
        </div>
    </aside>

    <main class="flex-1 flex flex-col h-full relative overflow-hidden">
        
        <section id="pos" class="page-section h-full flex flex-col md:flex-row">
            <div class="flex-1 p-4 md:p-6 overflow-y-auto scrollbar-hide bg-gray-50">
                <div class="flex gap-2 mb-4 sticky top-0 bg-gray-50 py-2 z-10">
                    <input type="text" id="search" onkeyup="renderPOS()" placeholder="Search item..." class="flex-1 p-3 rounded-xl border shadow-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <select id="catFilter" onchange="renderPOS()" class="p-3 rounded-xl border shadow-sm bg-white">
                        <option value="All">All Categories</option>
                    </select>
                </div>
                <div id="posGrid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-20"></div>
            </div>
            <div class="h-1/3 md:h-full md:w-96 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-xl flex flex-col border-t md:border-l border-gray-200 z-20">
                <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 class="font-bold text-gray-700">Current Order</h3>
                    <button onclick="clearCart()" class="text-xs text-red-500 font-bold hover:underline">CLEAR</button>
                </div>
                <div id="cartList" class="flex-1 overflow-y-auto p-4 space-y-3"></div>
                <div class="p-4 bg-gray-50 border-t space-y-3">
                    <div class="flex justify-between text-xl font-bold text-gray-800">
                        <span>Total</span>
                        <span id="totalDisplay">₱0.00</span>
                    </div>
                    <button onclick="checkout()" class="w-full bg-green-600 active:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-95">PAY NOW</button>
                </div>
            </div>
        </section>

        <section id="inventory" class="page-section hidden h-full p-6 overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Inventory Management</h2>
                <button onclick="openModal('add')" class="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700">
                    <i class="fa-solid fa-plus mr-2"></i>Add Product
                </button>
            </div>
            <div class="bg-white rounded-xl shadow overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-gray-100 border-b text-gray-600 font-bold">
                        <tr>
                            <th class="p-4">Name</th>
                            <th class="p-4 hidden md:table-cell">Category</th>
                            <th class="p-4">Price</th>
                            <th class="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="inventoryTable"></tbody>
                </table>
            </div>
        </section>

        <section id="analytics" class="page-section hidden h-full p-6 overflow-y-auto">
            <h2 class="text-2xl font-bold mb-6 text-gray-800">Sales Dashboard</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <p class="text-gray-500 text-sm font-bold uppercase">Today's Sales</p>
                    <p id="statDaily" class="text-3xl font-bold text-gray-800 mt-1">₱0.00</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <p class="text-gray-500 text-sm font-bold uppercase">Transactions</p>
                    <p id="statCount" class="text-3xl font-bold text-gray-800 mt-1">0</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
                    <p class="text-gray-500 text-sm font-bold uppercase">Top Seller</p>
                    <p id="statTop" class="text-lg font-bold text-gray-800 mt-2 truncate">--</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-400">
                    <p class="text-gray-500 text-sm font-bold uppercase">Least Selling</p>
                    <p id="statLow" class="text-lg font-bold text-gray-800 mt-2 truncate">--</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div class="bg-white p-4 rounded-xl shadow h-96 flex flex-col">
                    <h3 class="font-bold text-gray-700 mb-2">Best Product Combinations</h3>
                    <div class="flex-1 relative w-full h-full flex items-center justify-center">
                        <canvas id="comboChart"></canvas>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-xl shadow h-96 flex flex-col">
                    <h3 class="font-bold text-gray-700 mb-2">Peak Hours (Store Activity)</h3>
                    <div class="flex-1 relative w-full h-full">
                        <canvas id="peakChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="bg-white p-4 rounded-xl shadow h-80 w-full mb-10">
                <h3 class="font-bold text-gray-700 mb-2">Daily Sales Trend</h3>
                <div class="relative w-full h-64">
                    <canvas id="salesChart"></canvas>
                </div>
            </div>
        </section>

        <section id="ai" class="page-section hidden h-full flex flex-col bg-gray-50">
            <div class="p-6 bg-white shadow-sm z-10 border-b">
                <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <i class="fa-solid fa-wand-magic-sparkles text-purple-600"></i> AI Store Advisor
                </h2>
                <p class="text-sm text-gray-500">Powered by Groq (Llama 3)</p>
            </div>
            
            <div id="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
                <div class="flex gap-3">
                    <div class="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0"><i class="fa-solid fa-robot"></i></div>
                    <div class="bg-white p-4 rounded-r-2xl rounded-bl-2xl shadow-sm border text-gray-700 max-w-[85%]">
                        Hello! I've analyzed your store data. Ask me "How can I improve sales?" or "What should I restock?"
                    </div>
                </div>
            </div>

            <div class="p-4 bg-white border-t flex gap-2">
                <input type="text" id="aiInput" placeholder="Ask your advisor..." class="flex-1 p-3 rounded-full border bg-gray-100 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition">
                <button onclick="sendToAI()" class="bg-purple-600 text-white w-12 h-12 rounded-full hover:bg-purple-700 transition flex items-center justify-center shadow-lg">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </section>

    </main>

    <div id="productModal" class="fixed inset-0 bg-black/50 hidden flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
            <div class="p-6">
                <h3 id="modalTitle" class="text-xl font-bold text-gray-800 mb-4">Edit Product</h3>
                <form id="productForm" onsubmit="saveProduct(event)">
                    <input type="hidden" id="editId">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Product Name</label>
                        <input type="text" id="editName" class="shadow-sm border rounded w-full py-3 px-4 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Category</label>
                        <select id="editCat" class="shadow-sm border rounded w-full py-3 px-4 text-gray-700 focus:ring-2 focus:ring-blue-500 bg-white outline-none"></select>
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Price (₱)</label>
                        <input type="number" id="editPrice" step="0.25" class="shadow-sm border rounded w-full py-3 px-4 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required>
                    </div>
                    <div class="flex justify-end gap-3">
                        <button type="button" onclick="closeModal()" class="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-bold transition">Cancel</button>
                        <button type="submit" class="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-md transition">Save</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        // --- DATA STATE ---
        let products = JSON.parse(localStorage.getItem('products')) || [
            { id: 1, name: 'Sardines (Mega)', cat: 'Canned', price: 24.00 },
            { id: 2, name: 'Pancit Canton', cat: 'Noodles', price: 18.00 },
            { id: 3, name: 'Marlboro Red', cat: 'Cigarettes', price: 12.00 },
            { id: 4, name: 'Kopiko Blanca', cat: 'Coffee', price: 15.00 },
            { id: 5, name: 'Skyflakes', cat: 'Biscuits', price: 8.00 },
            { id: 6, name: 'Coke Mismo', cat: 'Drinks', price: 20.00 }
        ];
        let sales = JSON.parse(localStorage.getItem('sales')) || [];
        let cart = [];
        let apiKey = localStorage.getItem('groq_key') || '';

        // --- INIT ---
        window.onload = () => {
            nav('pos');
            updateStats();
        };

        // --- NAVIGATION ---
        function nav(section) {
            document.querySelectorAll('.page-section').forEach(el => el.classList.add('hidden'));
            document.getElementById(section).classList.remove('hidden');

            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.className = "nav-btn w-full p-4 rounded-xl transition text-center md:text-left text-slate-300 hover:bg-slate-800 hover:text-white";
            });

            const activeBtn = document.getElementById('btn-' + section);
            if(activeBtn) {
                if(section === 'ai') {
                    activeBtn.className = "nav-btn w-full p-4 rounded-xl transition text-center md:text-left text-white shadow-lg bg-gradient-to-br from-purple-600 to-indigo-700";
                } else {
                    activeBtn.className = "nav-btn w-full p-4 rounded-xl transition text-center md:text-left text-white shadow-lg bg-blue-600";
                }
            }

            if(section === 'pos') renderPOS();
            if(section === 'inventory') renderInventory();
            if(section === 'analytics') updateStats();
        }

        // --- POS FUNCTIONS ---
        function renderPOS() {
            const grid = document.getElementById('posGrid');
            const search = document.getElementById('search').value.toLowerCase();
            const cat = document.getElementById('catFilter').value;
            
            const categories = ['All', ...new Set(products.map(p => p.cat))];
            const catSelect = document.getElementById('catFilter');
            if(catSelect.options.length === 1) {
                categories.forEach(c => {
                    if(c !== 'All') catSelect.innerHTML += `<option value="${c}">${c}</option>`;
                });
            }

            grid.innerHTML = '';
            products.filter(p => (cat === 'All' || p.cat === cat) && p.name.toLowerCase().includes(search))
            .forEach(p => {
                grid.innerHTML += `
                    <div onclick="addToCart(${p.id})" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition hover:shadow-md flex flex-col h-32 justify-between">
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">${p.cat}</span>
                            <h4 class="font-bold text-gray-800 leading-tight">${p.name}</h4>
                        </div>
                        <div class="text-right">
                            <span class="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm">₱${parseFloat(p.price).toFixed(2)}</span>
                        </div>
                    </div>`;
            });
        }

        function addToCart(id) {
            const p = products.find(x => x.id === id);
            const exist = cart.find(x => x.id === id);
            if(exist) exist.qty++;
            else cart.push({...p, qty: 1});
            renderCart();
        }

        function renderCart() {
            const list = document.getElementById('cartList');
            list.innerHTML = '';
            let total = 0;
            cart.forEach((item, idx) => {
                total += item.price * item.qty;
                list.innerHTML += `
                    <div class="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                        <div class="flex-1">
                            <div class="font-bold text-sm text-gray-800">${item.name}</div>
                            <div class="text-xs text-gray-500">₱${parseFloat(item.price).toFixed(2)} x ${item.qty}</div>
                        </div>
                        <div class="flex items-center gap-3">
                            <button onclick="modQty(${idx}, -1)" class="w-8 h-8 rounded-full bg-white shadow text-red-500 font-bold hover:bg-red-50">-</button>
                            <span class="font-bold w-4 text-center">${item.qty}</span>
                            <button onclick="modQty(${idx}, 1)" class="w-8 h-8 rounded-full bg-white shadow text-green-600 font-bold hover:bg-green-50">+</button>
                        </div>
                    </div>`;
            });
            document.getElementById('totalDisplay').innerText = '₱' + total.toFixed(2);
        }

        function modQty(idx, val) {
            cart[idx].qty += val;
            if(cart[idx].qty <= 0) cart.splice(idx, 1);
            renderCart();
        }

        function clearCart() { cart = []; renderCart(); }

        function checkout() {
            if(!cart.length) return alert("Cart is empty");
            const total = cart.reduce((a,b) => a + (b.price * b.qty), 0);
            sales.push({ id: Date.now(), date: new Date().toISOString(), total: total, items: cart });
            localStorage.setItem('sales', JSON.stringify(sales));
            cart = [];
            renderCart();
            alert(`Payment Success: ₱${total.toFixed(2)}`);
            updateStats();
        }

        // --- INVENTORY FUNCTIONS ---
        function renderInventory() {
            const tbody = document.getElementById('inventoryTable');
            tbody.innerHTML = '';
            products.forEach(p => {
                tbody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50 transition">
                        <td class="p-4 font-medium text-gray-800">${p.name}</td>
                        <td class="p-4 hidden md:table-cell">
                            <span class="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-bold">${p.cat}</span>
                        </td>
                        <td class="p-4 text-gray-800">₱${parseFloat(p.price).toFixed(2)}</td>
                        <td class="p-4 text-center space-x-2">
                            <button onclick="openModal('edit', ${p.id})" class="text-blue-500 p-2 hover:bg-blue-50 rounded shadow-sm transition" title="Edit">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button onclick="deleteProd(${p.id})" class="text-red-500 p-2 hover:bg-red-50 rounded shadow-sm transition" title="Delete">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>`;
            });
        }

        // --- MODAL FUNCTIONS ---
        function openModal(mode, id = null) {
            const modal = document.getElementById('productModal');
            const title = document.getElementById('modalTitle');
            const form = document.getElementById('productForm');
            const catSelect = document.getElementById('editCat');

            catSelect.innerHTML = '';
            const categories = [...new Set(products.map(p => p.cat))];
            categories.forEach(c => {
                catSelect.innerHTML += `<option value="${c}">${c}</option>`;
            });
            catSelect.innerHTML += `<option value="__new__">+ New Category...</option>`;

            if (mode === 'edit' && id) {
                title.innerText = 'Edit Product';
                const p = products.find(x => x.id === id);
                document.getElementById('editId').value = p.id;
                document.getElementById('editName').value = p.name;
                document.getElementById('editPrice').value = p.price;
                catSelect.value = p.cat;
            } else {
                title.innerText = 'Add Product';
                form.reset();
                document.getElementById('editId').value = '';
            }
            modal.classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('productModal').classList.add('hidden');
        }

        function saveProduct(e) {
            e.preventDefault();
            const id = document.getElementById('editId').value;
            const name = document.getElementById('editName').value;
            const price = parseFloat(document.getElementById('editPrice').value);
            let cat = document.getElementById('editCat').value;

            if (cat === '__new__') cat = prompt("Enter new category name:") || 'Uncategorized';

            if (id) {
                const index = products.findIndex(p => p.id == id);
                if (index !== -1) products[index] = { id: parseInt(id), name, price, cat };
            } else {
                const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
                products.push({ id: newId, name, price, cat });
            }

            localStorage.setItem('products', JSON.stringify(products));
            closeModal();
            renderInventory();
            renderPOS();
        }

        function deleteProd(id) {
            if(confirm("Are you sure you want to delete this item?")) {
                products = products.filter(p => p.id !== id);
                localStorage.setItem('products', JSON.stringify(products));
                renderInventory();
                renderPOS();
            }
        }

        // --- ADVANCED ANALYTICS ---
        let salesChart, comboChart, peakChart;

        function updateStats() {
            const today = new Date().toISOString().split('T')[0];
            const daily = sales.filter(s => s.date.startsWith(today)).reduce((a,b) => a + b.total, 0);
            
            // 1. Item Frequencies
            const itemCounts = {};
            sales.forEach(s => s.items.forEach(i => itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty));
            const sortedItems = Object.entries(itemCounts).sort((a,b) => b[1] - a[1]);
            const top = sortedItems.length ? `${sortedItems[0][0]} (${sortedItems[0][1]})` : "--";
            
            // 2. Least Selling
            const allProductNames = products.map(p => p.name);
            const soldNames = Object.keys(itemCounts);
            const unsold = allProductNames.filter(name => !soldNames.includes(name));
            let lowSeller = "--";
            if (unsold.length > 0) {
                lowSeller = unsold[0] + " (0)"; 
            } else if (sortedItems.length > 0) {
                const last = sortedItems[sortedItems.length - 1];
                lowSeller = `${last[0]} (${last[1]})`;
            }

            // Update DOM
            document.getElementById('statDaily').innerText = '₱' + daily.toFixed(2);
            document.getElementById('statCount').innerText = sales.length;
            document.getElementById('statTop').innerText = top;
            document.getElementById('statLow').innerText = lowSeller;

            // --- CHARTS ---
            // 1. Daily Sales Bar Chart
            const ctxSales = document.getElementById('salesChart').getContext('2d');
            if(salesChart) salesChart.destroy();
            
            const labels = [], data = [];
            for(let i=6; i>=0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const dStr = d.toISOString().split('T')[0];
                labels.push(dStr.slice(5)); 
                data.push(sales.filter(s => s.date.startsWith(dStr)).reduce((a,b) => a + b.total, 0));
            }

            salesChart = new Chart(ctxSales, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{ label: 'Sales (₱)', data: data, backgroundColor: '#3b82f6', borderRadius: 6 }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });

            // 2. Best Combo Pie Chart
            const pairCounts = {};
            sales.forEach(s => {
                if(s.items.length > 1) {
                    const names = s.items.map(i => i.name).sort();
                    for(let i=0; i<names.length; i++) {
                        for(let j=i+1; j<names.length; j++) {
                            const pair = names[i] + " + " + names[j];
                            pairCounts[pair] = (pairCounts[pair] || 0) + 1;
                        }
                    }
                }
            });
            const sortedPairs = Object.entries(pairCounts).sort((a,b) => b[1] - a[1]).slice(0, 5); // Top 5
            
            const ctxCombo = document.getElementById('comboChart').getContext('2d');
            if(comboChart) comboChart.destroy();

            // FIXED: Legend Position to 'bottom'
            if (sortedPairs.length > 0) {
                comboChart = new Chart(ctxCombo, {
                    type: 'doughnut',
                    data: {
                        labels: sortedPairs.map(p => p[0]),
                        datasets: [{
                            data: sortedPairs.map(p => p[1]),
                            backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
                            borderWidth: 0
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        plugins: { 
                            legend: { 
                                position: 'bottom', // Moves legend to bottom
                                labels: { 
                                    padding: 20, 
                                    boxWidth: 12,
                                    font: { size: 10 }
                                } 
                            } 
                        } 
                    }
                });
            }

            // 3. Peak Hour Line Graph
            const hourCounts = new Array(24).fill(0);
            sales.forEach(s => {
                const h = new Date(s.date).getHours();
                hourCounts[h]++;
            });
            
            const hourLabels = hourCounts.map((_, i) => i === 0 ? '12am' : (i===12 ? '12pm' : (i>12 ? (i-12)+'pm' : i+'am')));
            
            const ctxPeak = document.getElementById('peakChart').getContext('2d');
            if(peakChart) peakChart.destroy();

            peakChart = new Chart(ctxPeak, {
                type: 'line',
                data: {
                    labels: hourLabels,
                    datasets: [{
                        label: 'Orders',
                        data: hourCounts,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: { x: { ticks: { maxTicksLimit: 8 } }, y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        }

        // --- AI ADVISOR (GROQ - FAST & FREE) ---
        function enterApiKey() {
            const key = prompt("Enter your Groq API Key (gsk_...):");
            if(key) {
                localStorage.setItem('groq_key', key);
                apiKey = key;
                alert("Key Saved! Try asking the AI now.");
            }
        }

        async function sendToAI() {
            if(!apiKey) return enterApiKey();
            const input = document.getElementById('aiInput');
            const txt = input.value;
            if(!txt) return;

            const chat = document.getElementById('chatContainer');
            chat.innerHTML += `<div class="flex gap-3 justify-end"><div class="bg-blue-600 text-white p-4 rounded-l-2xl rounded-br-2xl max-w-[85%] shadow-md text-sm">${txt}</div></div>`;
            input.value = '';
            chat.scrollTop = chat.scrollHeight;

            // Prepare Data Context
            const todaySales = document.getElementById('statDaily').innerText;
            const topSeller = document.getElementById('statTop').innerText;

            const contextText = `Today's Sales: ${todaySales}. Top Seller: ${topSeller}.`;
            
            const systemPrompt = `You are a friendly Filipino business consultant for "Mama's Tindahan" (Sari-sari store). 
            Store Data: ${contextText}.
            User Question: "${txt}"
            Answer briefly, practically, and in an encouraging tone.`;

            // Loading
            const loadDiv = document.createElement('div');
            loadDiv.innerHTML = '<div class="text-xs text-gray-400 text-center animate-pulse mt-2">Thinking...</div>';
            chat.appendChild(loadDiv);

            try {
                // Using Llama 3 on Groq
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: txt }
                        ],
                        model: "llama3-8b-8192"
                    })
                });

                const data = await response.json();
                loadDiv.remove();

                if(data.error) throw new Error(data.error.message);
                const reply = data.choices[0].message.content;

                chat.innerHTML += `
                    <div class="flex gap-3">
                        <div class="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0"><i class="fa-solid fa-robot"></i></div>
                        <div class="bg-white p-4 rounded-r-2xl rounded-bl-2xl shadow-sm border text-gray-700 max-w-[85%] leading-relaxed text-sm">
                            ${reply}
                        </div>
                    </div>`;
            } catch (err) {
                loadDiv.remove();
                alert("Error: " + err.message);
            }
            chat.scrollTop = chat.scrollHeight;
        }
    </script>
</body>
</html>
