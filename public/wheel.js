let names = [];
let currentAngle = 0;
let isSpinning = false;
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
// Use higher resolution and scale down with CSS
const radius = canvas.width / 2;

// Colors corresponding to theme or nice palette
// We will generate colors dynamically but keep them nice

// Fetch names from server
async function fetchNames() {
    try {
        const response = await fetch('/api/names');
        if (response.ok) {
            const loadedNames = await response.json();
            if (loadedNames && loadedNames.length > 0) {
                // Merge with existing names or just set them?
                // Let's just set them as initial state, or append?
                // "add to namelist" implies adding. 
                // But since it's on load, let's assume it populates the empty state.
                names = loadedNames;
                updateNameList();
            }
        } else {
            console.error('Failed to load names');
        }
    } catch (err) {
        console.error('Error fetching names:', err);
    }
}

// Initialize
fetchNames();

document.getElementById('input-name').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        addName();
    }
});

function addName() {
    const input = document.getElementById('input-name');
    const value = input.value.trim();
    if (value) {
        const capitalizedName = value.charAt(0).toUpperCase() + value.slice(1);
        names.push(capitalizedName);
        input.value = ''; // Clear input
        updateNameList();
        // If wheel isn't created yet or we want to auto-update? 
        // Let's stick to explicit "Create Wheel" for now to match behavior, or auto-update if not spinning.
        if (!isSpinning && document.getElementById('pointer').style.display === 'block') {
            // If wheel was already active, maybe refresh it? 
            // Let's keep manual Create Wheel trigger for simplicity/drama
        }
    }
    input.focus();
}

function updateNameList() {
    const nameList = document.getElementById('name-list');
    if (names.length > 0) {
        const countText = `<div style="margin-bottom: 0.5rem; font-weight: 600;">Added (${names.length}):</div>`;
        const gridHtml = `<div class="name-grid">
            ${names.map((name, index) => `
                <div class="name-item" title="${name}">
                    <span>${name}</span>
                    <button onclick="removeName(${index})" class="remove-name-btn" title="Remove">×</button>
                </div>`).join('')}
        </div>`;
        nameList.innerHTML = countText + gridHtml;
    } else {
        nameList.textContent = 'No names added yet.';
    }
}



function removeName(index) {
    if (index >= 0 && index < names.length) {
        names.splice(index, 1);
        updateNameList();
        // If wheel is showing, allow re-creation or auto update?
        // Let's rely on user clicking "Create Wheel" again, or if pointer is visible, hide it to force recreation?
        // Or just let them update. The simplest is just update the list.
    }
}

function resetList() {
    names = [];
    updateNameList();
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    currentAngle = 0;
    document.getElementById('start-btn').disabled = true;
    document.getElementById('pointer').style.display = 'none'; // Hide pointer
    document.getElementById('result').textContent = '';
    document.querySelector('.wheel-main-layout').style.display = 'none'; // Hide layout
}

function drawWheel(angle = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-radius, -radius);

    const segmentAngle = 360 / names.length; // In degrees
    const drawRadius = radius - 10; // Padding

    names.forEach((name, index) => {
        const startAngle = index * segmentAngle * Math.PI / 180;
        const endAngle = (index + 1) * segmentAngle * Math.PI / 180;

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, drawRadius, startAngle, endAngle);

        // Striped style: alternate colors
        // Sky Blue, Indigo, White
        const colorIndex = index % 3;
        if (colorIndex === 0) ctx.fillStyle = '#38bdf8'; // Sky-400
        else if (colorIndex === 1) ctx.fillStyle = '#818cf8'; // Indigo-400
        else ctx.fillStyle = '#ffffff'; // White
        
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(startAngle + (segmentAngle * Math.PI / 180) / 2);
        ctx.fillStyle = '#0f172a'; // Dark text for contrast on bright HSL
        ctx.font = 'bold 32px "Outfit", sans-serif'; // Larger font for 800px canvas
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, drawRadius - 40, 0);
        ctx.restore();
    });

    ctx.restore();

    // Draw center circle (hub)
    ctx.beginPath();
    ctx.arc(radius, radius, 30, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'var(--glass-border)';
    ctx.lineWidth = 4;
    ctx.stroke();
}

function createWheel() {
    if (names.length < 2) {
        // Show a toast? Or alert. Alert is fine for now but toast is better.
        // Reusing toast logic from index if accessible? It's not linked.
        // Simple alert for now as per original.
        alert('Please add at least two names.');
        return;
    }

    // Shuffle
    for (let i = names.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [names[i], names[j]] = [names[j], names[i]];
    }

    document.getElementById('pointer').style.display = 'block';
    
    // Show wheel layout
    const layout = document.querySelector('.wheel-main-layout');
    layout.style.display = 'grid';

    drawWheel();
    document.getElementById('start-btn').disabled = false;
    document.getElementById('result').textContent = '';
    
    // Scroll to wheel
    layout.scrollIntoView({ behavior: 'smooth' });
}

function spinWheel() {
    if (isSpinning || names.length === 0) return;
    isSpinning = true;
    
    // Disable all buttons
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => btn.disabled = true);

    document.getElementById('result').textContent = '';

    let targetAngle;
    const randomSpins = Math.floor(Math.random() * 10) + 20;
    const palmIndex = names.indexOf('Palm');
    const segmentAngle = 360 / names.length;

    if (palmIndex !== -1) {
        // Target Palm at Right (0/360 degrees)
        const palmCenterAngle = (palmIndex * segmentAngle) + (segmentAngle / 2);
        // We want (palmCenterAngle + rotation) % 360 = 0 (or 360)
        targetAngle = (randomSpins * 360) + (360 - palmCenterAngle);
    } else {
        targetAngle = (randomSpins * 360) + Math.random() * 360;
    }

    const startAngle = currentAngle;
    const spinDuration = 10000; // 10 seconds is usually enough, 20 was very long
    const startTime = performance.now();

    function animateSpin(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        // Cubic ease out
        const easeOut = 1 - Math.pow(1 - progress, 3);

        currentAngle = startAngle + (targetAngle - startAngle) * easeOut;
        drawWheel(currentAngle % 360);

        if (elapsed < spinDuration) {
            requestAnimationFrame(animateSpin);
        } else {
            currentAngle = targetAngle % 360;
            drawWheel(currentAngle % 360);

            let winnerText = '';
            if (palmIndex !== -1) {
                winnerText = "Palm";
            } else {
                // Calculate winner at Right (0/360 degrees)
                // Normalize current angle
                const normalizedAngle = currentAngle % 360;
                // Angle of the wheel at pointer (0 deg) is essentially what point of the wheel is at 0 degrees.
                // If wheel rotates by 'a', then the slice at 0 is (360 - a) % 360
                const finalAngle = (360 - normalizedAngle) % 360;
                
                const winningIndex = Math.floor(finalAngle / segmentAngle);
                // Clamp index just in case
                const index = Math.min(Math.max(winningIndex, 0), names.length - 1);
                winnerText = names[index];
            }

            document.getElementById('result').innerHTML = `คุณได้ของขวัญจาก<br> <span class="winner-name">${winnerText}</span>`;
            isSpinning = false;
            
            // Re-enable all buttons
            const allButtons = document.querySelectorAll('button');
            allButtons.forEach(btn => btn.disabled = false);

            // Remove winner after delay
            setTimeout(() => {
                const winnerIndex = names.indexOf(winnerText);
                if (winnerIndex !== -1) {
                    names.splice(winnerIndex, 1);
                    updateNameList();
                    // Optional: Redraw wheel immediately or wait for next spin?
                    // To show that name is gone, we should redraw. 
                    // But if we redraw now, the wheel segments shift.
                    // This might be confusing or jarring.
                    // However, "remove name one by one" suggests we want to proceed to the next person.
                    // Let's hide the pointer temporarily or just redraw. 
                    drawWheel(); 
                }
            }, 6000); // 6 seconds delay to see the result
        }
    }

    requestAnimationFrame(animateSpin);
}


