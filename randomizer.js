const DEFAULT_ITEMS = [
    { name: "Shot Glass", rarity: "Superior", quantity: 3 },
    { name: "Wine Tumbler", rarity: "Superior", quantity: 5 },
    { name: "Rally Rock", rarity: "Superior", quantity: 3 },
    { name: "TIOA Quest Coin", rarity: "Superior", quantity: 20 },
    { name: "Rally Coffee Mug", rarity: "Epic", quantity: 2 },
    { name: "TIOA Travel Cup", rarity: "Rare", quantity: 1 },
    { name: "Rally Sticker", rarity: "Uncommon", quantity: 50 },
    { name: "TIOA Logo Sticker", rarity: "Common", quantity: 20 },
    { name: "Chocolate Coin", rarity: "Common", quantity: 20 }
];

const DEFAULT_PERCENTAGES = {
    Superior: 5,
    Epic: 10,
    Rare: 15,
    Uncommon: 30,
    Common: 40
};

const RARITY_ORDER = ["Superior", "Epic", "Rare", "Uncommon", "Common"];

let items = [];
let percentages = {};

function initData() {
    const storedItems = localStorage.getItem('tioa_loot_items');
    if (storedItems) {
        items = JSON.parse(storedItems);
    } else {
        items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
        saveItems();
    }

    const storedPercentages = localStorage.getItem('tioa_loot_percentages');
    if (storedPercentages) {
        percentages = JSON.parse(storedPercentages);
    } else {
        percentages = JSON.parse(JSON.stringify(DEFAULT_PERCENTAGES));
        savePercentages();
    }

    renderAll();
    attachEventListeners();
}

function saveItems() {
    localStorage.setItem('tioa_loot_items', JSON.stringify(items));
}

function savePercentages() {
    localStorage.setItem('tioa_loot_percentages', JSON.stringify(percentages));
}

function resetToDefaults() {
    if (confirm("Are you sure you want to reset all items and percentages to their default values? All current quantities will be lost.")) {
        items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
        percentages = JSON.parse(JSON.stringify(DEFAULT_PERCENTAGES));
        saveItems();
        savePercentages();
        renderAll();
    }
}

function rollForLoot() {
    // 1. Check if ANY items are left at all
    const totalItemsLeft = items.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);
    if (totalItemsLeft <= 0) {
        alert("The loot table is completely empty! Better add some more gear.");
        return null;
    }

    // 2. Roll a number 1-100 to determine initial tier
    const roll = Math.floor(Math.random() * 100) + 1;
    let targetRarity = null;
    let currentThreshold = 0;

    // We check from the bottom up (or top down, depending on how we stack)
    // Let's stack them: Superior(5) -> Epic(15) -> Rare(30) -> Uncommon(60) -> Common(100)
    for (const rarity of RARITY_ORDER) {
        const chance = parseInt(percentages[rarity] || 0);
        if (chance === 0) continue;
        currentThreshold += chance;
        if (roll <= currentThreshold) {
            targetRarity = rarity;
            break;
        }
    }

    // Fallback if something weird happened with percentages not equaling 100
    if (!targetRarity) targetRarity = RARITY_ORDER[RARITY_ORDER.length - 1];

    // 3. Select an item, falling back to lower tiers if empty
    let selectedItem = null;
    let rarityIndex = RARITY_ORDER.indexOf(targetRarity);

    while (rarityIndex < RARITY_ORDER.length) {
        const currentRarity = RARITY_ORDER[rarityIndex];
        // Get all items in this rarity that have quantity > 0
        const availableItems = items.filter(i => i.rarity === currentRarity && i.quantity > 0);

        if (availableItems.length > 0) {
            // Pick a random item from this tier
            const randomIndex = Math.floor(Math.random() * availableItems.length);
            selectedItem = availableItems[randomIndex];
            break; // Found an item!
        }

        // Tier is empty, drop down to the next lower tier
        console.log(`No items left in ${currentRarity}, falling back...`);
        rarityIndex++;
    }

    // 4. Update quantity and save
    if (selectedItem) {
        selectedItem.quantity -= 1;
        saveItems();
        return selectedItem;
    } else {
        // This should only happen if lower tiers are empty but higher tiers had items,
        // which implies logic gap. Let's do a global fallback just in case.
        const anyAvailable = items.filter(i => i.quantity > 0);
        if (anyAvailable.length > 0) {
            const randomIndex = Math.floor(Math.random() * anyAvailable.length);
            selectedItem = anyAvailable[randomIndex];
            selectedItem.quantity -= 1;
            saveItems();
            return selectedItem;
        }
        return null;
    }
}

// UI Rendering Functions
function renderAll() {
    renderInventoryTable();
    renderSettingsForms();
}

function renderInventoryTable() {
    const container = document.getElementById('inventory-table-container');
    if (!container) return;

    let html = `<table>
        <thead>
            <tr>
                <th>Item Name</th>
                <th>Rarity</th>
                <th>Qty</th>
                <th>Base Chance</th>
            </tr>
        </thead>
        <tbody>`;

    // Group items by rarity for display
    RARITY_ORDER.forEach(rarity => {
        const rarityItems = items.filter(i => i.rarity === rarity);
        const chance = percentages[rarity] || 0;

        rarityItems.forEach((item, index) => {
            html += `<tr class="${rarity.toLowerCase()}">
                <td>${item.name}</td>
                <td><span class="rarity">${rarity}</span></td>
                <td><strong>${item.quantity}</strong></td>
                ${index === 0 ? `<td rowspan="${rarityItems.length}">${chance}%</td>` : ''}
            </tr>`;
        });
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function renderSettingsForms() {
    // Percentages form
    const pForm = document.getElementById('percentages-form');
    if (pForm) {
        let pHtml = '';
        RARITY_ORDER.forEach(rarity => {
            pHtml += `<div class="settings-row">
                <label style="width: 100px;">${rarity}:</label>
                <input type="number" id="perc-${rarity}" value="${percentages[rarity] || 0}" min="0" max="100">
                <span>%</span>
            </div>`;
        });
        pForm.innerHTML = pHtml;
    }

    // Items form
    const iForm = document.getElementById('items-form');
    if (iForm) {
        let iHtml = '';
        items.forEach((item, index) => {
            iHtml += `<div class="settings-row" data-index="${index}">
                <input type="text" class="edit-item-name" value="${item.name}" placeholder="Item Name">
                <select class="edit-item-rarity">
                    ${RARITY_ORDER.map(r => `<option value="${r}" ${item.rarity === r ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
                <input type="number" class="edit-item-qty" value="${item.quantity}" min="0" style="width:60px;" title="Quantity">
                <button class="action-btn btn-small btn-danger remove-item-btn" data-index="${index}">X</button>
            </div>`;
        });
        iForm.innerHTML = iHtml;

        // Re-attach remove listeners
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                items.splice(idx, 1);
                renderSettingsForms(); // re-render just the form
            });
        });
    }
}

function attachEventListeners() {
    // Roll Button
    const rollBtn = document.getElementById('roll-btn');
    if (rollBtn) {
        rollBtn.addEventListener('click', () => {
            const wonItem = rollForLoot();
            if (wonItem) {
                const resultArea = document.getElementById('result-area');
                const resultName = document.getElementById('result-name');
                const resultRarity = document.getElementById('result-rarity');
                const resultRemaining = document.getElementById('result-remaining');

                resultName.innerText = wonItem.name;
                resultRarity.innerText = wonItem.rarity;
                resultRarity.className = `rarity-badge ${wonItem.rarity.toLowerCase()}`;
                resultRemaining.innerText = wonItem.quantity;

                resultArea.style.display = 'block';

                // Re-render inventory to show updated quantity
                renderInventoryTable();
                renderSettingsForms();
            }
        });
    }

    // Copy Result
    const copyBtn = document.getElementById('copy-result-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const name = document.getElementById('result-name').innerText;
            const rarity = document.getElementById('result-rarity').innerText;
            const textToCopy = `Congratulations! You won a [ ${name} ] (${rarity} rarity)!`;

            navigator.clipboard.writeText(textToCopy).then(() => {
                const origText = copyBtn.innerText;
                copyBtn.innerText = '✅ Copied!';
                setTimeout(() => { copyBtn.innerText = origText; }, 2000);
            });
        });
    }

    // Toggle Settings
    const toggleBtn = document.getElementById('toggle-settings-btn');
    const settingsArea = document.getElementById('settings-area');
    if (toggleBtn && settingsArea) {
        toggleBtn.addEventListener('click', () => {
            if (settingsArea.style.display === 'none' || settingsArea.style.display === '') {
                settingsArea.style.display = 'block';
                toggleBtn.innerText = 'Hide Settings';
            } else {
                settingsArea.style.display = 'none';
                toggleBtn.innerText = '⚙️ Edit Loot Table';
            }
        });
    }

    // Save Percentages
    const savePercBtn = document.getElementById('save-percentages-btn');
    if (savePercBtn) {
        savePercBtn.addEventListener('click', () => {
            let total = 0;
            RARITY_ORDER.forEach(rarity => {
                const val = parseInt(document.getElementById(`perc-${rarity}`).value) || 0;
                percentages[rarity] = val;
                total += val;
            });
            if (total !== 100) {
                alert(`Warning: Percentages currently total ${total}%, not 100%. The randomizer will still work but odds may be skewed.`);
            }
            savePercentages();
            renderInventoryTable();
            alert('Percentages saved!');
        });
    }

    // Add Item
    const addItemBtn = document.getElementById('add-item-btn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            items.push({ name: "New Item", rarity: "Common", quantity: 1 });
            renderSettingsForms();
        });
    }

    // Save Items
    const saveItemsBtn = document.getElementById('save-items-btn');
    if (saveItemsBtn) {
        saveItemsBtn.addEventListener('click', () => {
            const rows = document.querySelectorAll('#items-form .settings-row');
            const newItems = [];
            rows.forEach(row => {
                const name = row.querySelector('.edit-item-name').value;
                const rarity = row.querySelector('.edit-item-rarity').value;
                const qty = parseInt(row.querySelector('.edit-item-qty').value) || 0;
                if (name.trim() !== '') {
                    newItems.push({ name, rarity, quantity: qty });
                }
            });
            items = newItems;
            saveItems();
            renderAll();
            alert('Items saved!');
        });
    }

    // Reset Defaults
    const resetBtn = document.getElementById('reset-defaults-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetToDefaults);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initData);
