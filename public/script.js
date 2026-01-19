const MAX_SELECTION = 8;

// Menu Items extracted from image
const menuItems = [
    { id: 1, name: "สันคอหมูสไลด์ผัดกระเทียมพริกไทยเมืองจันทร์**" },
    { id: 2, name: "ผัดผักรวมเกษตรอินทรีย์โครงการหลวง" },
    { id: 3, name: "ผัดวุ้นเส้นทรงเครื่องโบราณ" },
    { id: 4, name: "ผัดเห็ดออรินจิน้ำมันหอย" },
    { id: 5, name: "ทอดมันปลาอินทรีย์**" },
    { id: 6, name: "ซี่โครงหมูทอดกระเทียมพริกไทย" },
    { id: 7, name: "ปลาทอดซอสสามรส เคียงด้วยคะน้าฮ่องกง" },
    { id: 8, name: "ซี่โครงหมูอบเหล้าแดง" },
    { id: 9, name: "หมูคั่วเกลือออแกนิค" },
    { id: 10, name: "ลาบหมูทอด" },
    { id: 11, name: "น้ำพริกกะปิปลาทูทอด" },
    { id: 12, name: "ปีกไก่ทอดสมุนไพร" },
    { id: 13, name: "ปลาทอดซอสมะขาม**" },
    { id: 14, name: "ปลาผัดขึ้นฉ่าย" },
    { id: 15, name: "ปลาทอดซอสกระเทียม**" },
    { id: 16, name: "ปลาผัดฉ่า" },
    { id: 17, name: "ยำเห็ดรวมมิตร" },
    { id: 18, name: "ยำคะน้ากุ้งสด" },
    { id: 19, name: "ลาบไก่" },
    { id: 20, name: "ลาบหมู" },
    { id: 21, name: "ยำถั่วพูกุ้งสด" },
    { id: 22, name: "ซุปไก่เยื่อไผ่เห็ดหอมสด" },
    { id: 23, name: "ต้มข่าไก่" },
    { id: 24, name: "ต้มแซ่บกระดูกหมูอ่อน" },
    { id: 25, name: "แกงส้มชะอมกุ้ง**" },
    { id: 26, name: "มัสมั่นไก่" },
    { id: 27, name: "พะแนงหมู" },
    { id: 28, name: "แกงเขียวหวานลูกชิ้นปลากราย**" },
    { id: 29, name: "น้ำพริกกุ้งสดพร้อมผักเคียง" },
    { id: 30, name: "น้ำพริกลงเรือพร้อมผักเคียง**" },
    { id: 31, name: "หลนหมูเจ่าพร้อมผักเคียง" },
];

let selectedItems = [];

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const topPicksList = document.getElementById('top-picks-list');
const selectionCount = document.getElementById('selection-count');
const mobileCount = document.getElementById('mobile-count');
const viewPicksBtn = document.getElementById('view-picks-btn');
const sidebar = document.getElementById('sidebar');
const submitBtn = document.getElementById('submit-vote-btn');
const mobileSubmitBtn = document.getElementById('mobile-submit-btn');
const resultsModal = document.getElementById('results-modal');
const resultsList = document.getElementById('results-list');

// Initialize App
function init() {
    renderMenuGrid();
    updateUI();
    fetchTotalVoters();
}

async function fetchTotalVoters() {
    try {
        const response = await fetch('/api/results?t=' + Date.now());
        if (response.ok) {
            const data = await response.json();
            console.log('Fetched Results:', data); // Debug
            
            // Handle both structure formats
            let count = 0;
            if (data.totalVoters !== undefined) {
                count = data.totalVoters;
            } else if (data.votes) {
                // If nested but missing totalVoters
                 count = 0;
            }
            
            const el = document.getElementById('voter-count-number');
            if (el) {
                el.textContent = count;
            } else {
                console.error('Element #voter-count-number not found!');
            }
        }
    } catch (e) {
        console.warn('Failed to fetch voter count', e);
        const el = document.getElementById('voter-count-number');
        if (el) el.textContent = '-';
    }
}

// Render the grid of available menus
function renderMenuGrid() {
    menuGrid.innerHTML = '';
    
    menuItems.forEach(item => {
        const isSelected = selectedItems.some(selected => selected.id === item.id);
        const card = document.createElement('div');
        card.className = `menu-card ${isSelected ? 'selected' : ''}`;
        card.onclick = () => toggleSelection(item);
        
        card.innerHTML = `
            <div class="card-content">
                <span class="menu-name">${item.name}</span>
                <div class="check-icon">
                    ${isSelected ? '✓' : ''}
                </div>
            </div>
        `;
        
        menuGrid.appendChild(card);
    });
}

// Handle clicking a menu item
function toggleSelection(item) {
    const index = selectedItems.findIndex(i => i.id === item.id);
    
    if (index !== -1) {
        // Remove if already selected
        selectedItems.splice(index, 1);
    } else {
        // Add if not selected, checking limit
        if (selectedItems.length >= MAX_SELECTION) {
            alert(`เลือกเมนูได้สูงสุด ${MAX_SELECTION} รายการ!`);
            return;
        }
        selectedItems.push(item);
    }
    
    // Refresh View
    // Optimize: Could just update specific DOM elements, but re-render is safe for this size
    renderMenuGrid(); 
    renderTopPicks();
    updateUI();
}

// Render the sidebar list
function renderTopPicks() {
    topPicksList.innerHTML = '';
    
    if (selectedItems.length === 0) {
        topPicksList.innerHTML = '<p class="empty-state">ยังไม่ได้เลือกรายการ</p>';
        return;
    }

    selectedItems.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'pick-item';
        row.innerHTML = `
            <div class="pick-rank">#${index + 1}</div>
            <span class="pick-name">${item.name}</span>
            <button class="remove-btn" onclick="removeItem(${item.id})">×</button>
        `;
        topPicksList.appendChild(row);
    });
}

function removeItem(id) {
    // Helper to remove from sidebar directly
    const item = menuItems.find(i => i.id === id);
    if (item) toggleSelection(item);
}

// Update counters and badges
function updateUI() {
    const countText = `${selectedItems.length}`;
    selectionCount.textContent = countText + ' เมนู';
    mobileCount.textContent = countText;
    
    // Toggle Submit Button visibility
    const hasItems = selectedItems.length > 0;
    submitBtn.classList.toggle('hidden', !hasItems);
    mobileSubmitBtn.classList.toggle('hidden', !hasItems);

    if (selectedItems.length === MAX_SELECTION) {
        selectionCount.classList.add('limit-reached');
    } else {
        selectionCount.classList.remove('limit-reached');
    }
}

// --- Backend Integration ---

async function submitVote() {
    if (selectedItems.length === 0) return;

    if (!confirm('ยืนยันการส่งผลโหวตใช่หรือไม่?')) {
        return;
    }

    const selectedIds = selectedItems.map(item => item.id);
    let success = false;
    let backendResults = null;

    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedIds })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                success = true;
                backendResults = result.results;
            }
        } else {
            throw new Error('Server response not ok');
        }
    } catch (error) {
        console.warn('Backend unavailable, using LocalStorage fallback.', error);
    }

    if (success) {
        alert('ส่งผลโหวตแล้ว');
        finishSubmission(backendResults);
    } else {
        // Fallback: Save to LocalStorage
        saveToLocalStorage(selectedIds);
        alert('ส่งผลโหวตแล้ว (บันทึกในเครื่อง)');
        finishSubmission(getLocalStorageVotes());
    }
}

function finishSubmission(results) {
    selectedItems = []; // Reset selection
    renderMenuGrid();
    renderTopPicks();
    updateUI();
    
    // Update main page voter count immediately 
    if (results && results.totalVoters !== undefined) {
        const countEl = document.getElementById('voter-count-number');
        if (countEl) countEl.textContent = results.totalVoters;
    } else {
        fetchTotalVoters();
    }

    showResults(results);
}

// LocalStorage Helper
function saveToLocalStorage(ids) {
    const current = getLocalStorageVotes();
    ids.forEach(id => {
        current[id] = (current[id] || 0) + 1;
    });
    localStorage.setItem('menu_votes_demo', JSON.stringify(current));
}

function getLocalStorageVotes() {
    return JSON.parse(localStorage.getItem('menu_votes_demo') || '{}');
}

async function showResults(resultsData) {
    resultsList.innerHTML = '<p>กำลังโหลด...</p>';
    resultsModal.classList.remove('hidden');

    let votesData = resultsData;

    // Fetch if not provided
    if (!votesData) {
        try {
            const response = await fetch('/api/results');
            if (!response.ok) throw new Error('Network response was not ok');
            votesData = await response.json();
        } catch (e) {
            console.warn('Using LocalStorage results fallback', e);
            votesData = { votes: getLocalStorageVotes() };
        }
    }

    // Handle legacy format (just object) vs new format ({ votes, totalVoters })
    let votes = votesData.votes || votesData; 
    let totalVoters = votesData.totalVoters || 0;

    // Update Header with Total Voters
    const headerTitle = resultsModal.querySelector('.modal-header h2');
    if (headerTitle) {
        if (totalVoters > 0) {
            headerTitle.textContent = `ผลโหวต (ผู้ร่วมโหวต ${totalVoters} คน)`;
        } else {
            headerTitle.textContent = `ผลโหวต`;
        }
    }

    // Sort menus by vote count DESC
    const sortedMenus = [...menuItems].map(item => ({
        ...item,
        votes: votes[item.id] || 0
    })).sort((a, b) => b.votes - a.votes);

    resultsList.innerHTML = '';
    
    // Sort logic to show top items
    const hasVotes = sortedMenus.some(i => i.votes > 0);
    
    if (!hasVotes) {
        resultsList.innerHTML = '<p style="text-align:center; color:var(--text-muted)">ยังไม่มีผลโหวต</p>';
        return;
    }

    sortedMenus.forEach((item, index) => {
        if (item.votes === 0 && index > 9) return; // Hide zero votes if low rank

        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <span>${index + 1}. ${item.name}</span>
            <span class="result-count">${item.votes} คะแนน</span>
        `;
        resultsList.appendChild(div);
    });
}

function closeResults() {
    resultsModal.classList.add('hidden');
}

async function resetVotes() {
    if (!confirm('⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบคะแนนทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
        return;
    }
    
    try {
        const response = await fetch('/api/reset', { method: 'POST' });
        if (response.ok) {
            alert('ลบคะแนนทั้งหมดเรียบร้อยแล้ว');
            location.reload();
        } else {
            alert('เกิดข้อผิดพลาดในการรีเซ็ตคะแนน');
        }
    } catch (e) {
        console.error(e);
        // Fallback demo reset
        localStorage.removeItem('menu_votes_demo');
        alert('ลบคะแนน (Local Demo) เรียบร้อยแล้ว');
        location.reload();
    }
}

// Mobile Sidebar Toggle
function toggleSidebar() {
    sidebar.classList.toggle('mobile-visible');
}

// Event Listeners
if (viewPicksBtn) {
    viewPicksBtn.onclick = toggleSidebar;
}

// Start
init();
