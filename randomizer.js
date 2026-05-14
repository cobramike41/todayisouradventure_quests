const DEFAULT_ITEMS = [
    { name: "Shot Glass", rarity: "Superior", quantity: 3, chance: 1, alwaysDrop: false },
    { name: "Wine Tumbler", rarity: "Superior", quantity: 5, chance: 1, alwaysDrop: false },
    { name: "Rally Rock", rarity: "Superior", quantity: 3, chance: 1, alwaysDrop: false },
    { name: "TIOA Quest Coin", rarity: "Superior", quantity: 20, chance: 2, alwaysDrop: false },
    { name: "Rally Coffee Mug", rarity: "Epic", quantity: 2, chance: 5, alwaysDrop: false },
    { name: "TIOA Travel Cup", rarity: "Rare", quantity: 1, chance: 5, alwaysDrop: false },
    { name: "Rally Sticker", rarity: "Uncommon", quantity: 50, chance: 10, alwaysDrop: false },
    { name: "TIOA Logo Sticker", rarity: "Common", quantity: 20, chance: 15, alwaysDrop: false },
    { name: "Chocolate Coin", rarity: "Common", quantity: 20, chance: 0, alwaysDrop: true }
];

const RARITY_ORDER = ["Superior", "Epic", "Rare", "Uncommon", "Common"];

let items = [];

function getNoPrizeChance() {
    let totalChance = 0;
    items.forEach(item => {
        if (!item.alwaysDrop && item.quantity > 0) {
            totalChance += (parseInt(item.chance) || 0);
        }
    });
    const noPrize = 100 - totalChance;
    return Math.max(0, noPrize); // Clamp to 0
}

function initData() {
    const storedItems = localStorage.getItem('tioa_loot_items');
    if (storedItems) {
        items = JSON.parse(storedItems);
        // Migration for older data structure
        let needsSave = false;
        items.forEach(item => {
            if (typeof item.chance === 'undefined') { item.chance = 0; needsSave = true; }
            if (typeof item.alwaysDrop === 'undefined') { item.alwaysDrop = false; needsSave = true; }
        });
        if (needsSave) saveItems();
    } else {
        items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
        saveItems();
    }

    // Clean up old percentages if they exist
    localStorage.removeItem('tioa_loot_percentages');

    renderAll();
    attachEventListeners();
}

function saveItems() {
    localStorage.setItem('tioa_loot_items', JSON.stringify(items));
}

function resetToDefaults() {
    if (confirm("Are you sure you want to reset all items and percentages to their default values? All current quantities will be lost.")) {
        items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
        saveItems();
        renderAll();
    }
}

function rollForLoot() {
    // 1. Gather pools
    const regularItems = items.filter(i => !i.alwaysDrop && i.quantity > 0);
    const alwaysDropItems = items.filter(i => i.alwaysDrop && i.quantity > 0);

    // Check if anything can be rolled at all (including No Prize fallback)
    if (regularItems.length === 0 && getNoPrizeChance() === 0 && alwaysDropItems.length === 0) {
        alert("The loot table is completely empty! Better add some more gear.");
        return null;
    }

    // 2. Roll a number 1-100
    const roll = Math.floor(Math.random() * 100) + 1;
    let currentThreshold = 0;
    let selectedItem = null;

    for (const item of regularItems) {
        const chance = parseInt(item.chance) || 0;
        if (chance === 0) continue;
        currentThreshold += chance;
        if (roll <= currentThreshold) {
            selectedItem = item;
            break;
        }
    }

    // If the roll exceeded all regular items' chances, it falls into "No Prize" territory
    // (selectedItem remains null)

    // 3. Update quantities
    if (selectedItem) {
        selectedItem.quantity -= 1;
    }

    const droppedItemsAwarded = [];
    alwaysDropItems.forEach(item => {
        item.quantity -= 1;
        droppedItemsAwarded.push(item);
    });

    saveItems();

    return {
        item: selectedItem, // Can be null if "No Prize" won
        alwaysDropped: droppedItemsAwarded
    };
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
                <th>Chance</th>
            </tr>
        </thead>
        <tbody>`;

    // Group items by rarity for display
    RARITY_ORDER.forEach(rarity => {
        const rarityItems = items.filter(i => i.rarity === rarity);

        rarityItems.forEach((item) => {
            const chanceDisplay = item.alwaysDrop ? '<span style="color:var(--color-sunset-red); font-weight:bold;">Always Drops</span>' : `${item.chance}%`;
            const opacity = item.quantity === 0 ? '0.5' : '1';

            html += `<tr class="${rarity.toLowerCase()}" style="opacity: ${opacity};">
                <td>${item.name}</td>
                <td><span class="rarity">${rarity}</span></td>
                <td><strong>${item.quantity}</strong></td>
                <td>${chanceDisplay}</td>
            </tr>`;
        });
    });

    // Add No Prize Row
    html += `<tr style="background-color: rgba(0,0,0,0.05);">
        <td><em>No Additional Prize</em></td>
        <td>-</td>
        <td>&infin;</td>
        <td><strong>${getNoPrizeChance()}%</strong> (Auto-calculated)</td>
    </tr>`;

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function renderSettingsForms() {
    // No Prize Calculation Summary
    const noPrizeSummary = document.getElementById('no-prize-calc-summary');
    if (noPrizeSummary) {
        noPrizeSummary.innerText = `Current "No Prize" Chance: ${getNoPrizeChance()}%`;
    }

    // Items form
    const iForm = document.getElementById('items-form');
    if (iForm) {
        let iHtml = '';
        items.forEach((item, index) => {
            const isAlwaysDrop = item.alwaysDrop ? 'checked' : '';
            const chanceDisabled = item.alwaysDrop ? 'disabled' : '';

            iHtml += `<div class="settings-row" data-index="${index}">
                <input type="text" class="edit-item-name" value="${item.name}" placeholder="Item Name">
                <select class="edit-item-rarity">
                    ${RARITY_ORDER.map(r => `<option value="${r}" ${item.rarity === r ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
                <input type="number" class="edit-item-qty" value="${item.quantity}" min="0" style="width:60px;" title="Quantity" placeholder="Qty">

                <div style="display:flex; align-items:center; gap:0.2rem;" title="Percentage Chance">
                    <input type="number" class="edit-item-chance" value="${item.chance}" min="0" max="100" style="width:60px;" ${chanceDisabled}>
                    <span>%</span>
                </div>

                <label style="display:flex; align-items:center; gap:0.2rem; font-size:0.8rem;" title="Always Drop (ignores percentage)">
                    <input type="checkbox" class="edit-item-alwaysdrop" ${isAlwaysDrop}>
                    Always
                </label>

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

        // Toggle chance input when always drop is checked
        document.querySelectorAll('.edit-item-alwaysdrop').forEach((checkbox, index) => {
            checkbox.addEventListener('change', (e) => {
                const row = e.target.closest('.settings-row');
                const chanceInput = row.querySelector('.edit-item-chance');
                if (e.target.checked) {
                    chanceInput.disabled = true;
                    chanceInput.value = 0;
                } else {
                    chanceInput.disabled = false;
                }
            });
        });
    }
}

function attachEventListeners() {
    // Last roll result for copying
    let lastRollResult = null;

    // Roll Button
    const rollBtn = document.getElementById('roll-btn');
    if (rollBtn) {
        rollBtn.addEventListener('click', () => {
            const result = rollForLoot();
            if (result) {
                lastRollResult = result;
                const resultArea = document.getElementById('result-area');
                const resultName = document.getElementById('result-name');
                const resultRarity = document.getElementById('result-rarity');
                const resultRemaining = document.getElementById('result-remaining');
                const resultRemainingContainer = document.getElementById('result-remaining-container');
                const alwaysDropArea = document.getElementById('result-always-dropped-area');
                const alwaysDropList = document.getElementById('result-always-dropped-list');

                if (result.item) {
                    resultName.innerText = result.item.name;
                    resultRarity.innerText = result.item.rarity;
                    resultRarity.className = `rarity-badge ${result.item.rarity.toLowerCase()}`;
                    resultRemaining.innerText = result.item.quantity;
                    resultRemainingContainer.style.display = 'block';
                    resultRarity.style.display = 'inline-block';
                } else {
                    resultName.innerText = "No Additional Prize";
                    resultRarity.style.display = 'none';
                    resultRemainingContainer.style.display = 'none';
                }

                if (result.alwaysDropped && result.alwaysDropped.length > 0) {
                    alwaysDropList.innerHTML = result.alwaysDropped.map(item => `<li>✅ ${item.name} (x1)</li>`).join('');
                    alwaysDropArea.style.display = 'block';
                } else {
                    alwaysDropArea.style.display = 'none';
                }

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
            if (!lastRollResult) return;

            let textToCopy = "";
            let alwaysDropText = "";

            if (lastRollResult.alwaysDropped && lastRollResult.alwaysDropped.length > 0) {
                const names = lastRollResult.alwaysDropped.map(i => i.name).join(', ');
                alwaysDropText = `[ ${names} ]`;
            }

            if (lastRollResult.item) {
                textToCopy = `Congratulations! You won a [ ${lastRollResult.item.name} ] (${lastRollResult.item.rarity})`;
                if (alwaysDropText) {
                    textToCopy += `, in addition to ${alwaysDropText}.`;
                } else {
                    textToCopy += `!`;
                }
            } else {
                textToCopy = `You didn't win an epic loot item this time, but please try again at the next rally!`;
                if (alwaysDropText) {
                    textToCopy += ` However, you did receive ${alwaysDropText}!`;
                }
            }

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

    // Add Item
    const addItemBtn = document.getElementById('add-item-btn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            items.push({ name: "New Item", rarity: "Common", quantity: 1, chance: 0, alwaysDrop: false });
            renderSettingsForms();
        });
    }

    // Save Items
    const saveItemsBtn = document.getElementById('save-items-btn');
    if (saveItemsBtn) {
        saveItemsBtn.addEventListener('click', () => {
            const rows = document.querySelectorAll('#items-form .settings-row');
            const newItems = [];
            let totalChance = 0;

            rows.forEach(row => {
                const name = row.querySelector('.edit-item-name').value;
                const rarity = row.querySelector('.edit-item-rarity').value;
                const qty = parseInt(row.querySelector('.edit-item-qty').value) || 0;
                const alwaysDrop = row.querySelector('.edit-item-alwaysdrop').checked;
                let chance = parseInt(row.querySelector('.edit-item-chance').value) || 0;

                if (alwaysDrop) chance = 0;

                if (name.trim() !== '') {
                    newItems.push({ name, rarity, quantity: qty, chance, alwaysDrop });
                    if (!alwaysDrop && qty > 0) {
                        totalChance += chance;
                    }
                }
            });

            if (totalChance > 100) {
                alert(`Warning: The total chance for available items is ${totalChance}%, which exceeds 100%. Please adjust the chances so they total 100% or less.`);
                return; // Don't save if over 100%
            }

            items = newItems;
            saveItems();
            renderAll();
            alert('Items saved successfully!');
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
