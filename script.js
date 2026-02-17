let isRunning = false;
let countSent = 0; let countError = 0; let countCycles = 0;

window.onload = function() {
    document.getElementById('user-token').value = localStorage.getItem('bot_token') || '';
    document.getElementById('new-channel-name').value = localStorage.getItem('bot_name') || '';
    document.getElementById('target-channel-ids').value = localStorage.getItem('bot_ids') || '';
    document.getElementById('broadcast-message').value = localStorage.getItem('bot_msg') || '';
    document.getElementById('send-interval').value = localStorage.getItem('bot_interval') || 5;
};

function addLog(text, color = "#bc13fe") {
    const container = document.getElementById('log-container');
    const entry = document.createElement('div');
    entry.style.color = color;
    entry.innerText = `[${new Date().toLocaleTimeString()}] > ${text}`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

function resetStats() {
    countSent = 0; countError = 0; countCycles = 0;
    updateStats();
    addLog("Statistiken zurückgesetzt.");
}

function updateStats() {
    document.getElementById('stat-sent').innerText = countSent;
    document.getElementById('stat-error').innerText = countError;
    document.getElementById('stat-cycles').innerText = countCycles;
}

function saveSettings() {
    localStorage.setItem('bot_token', document.getElementById('user-token').value);
    localStorage.setItem('bot_name', document.getElementById('new-channel-name').value);
    localStorage.setItem('bot_ids', document.getElementById('target-channel-ids').value);
    localStorage.setItem('bot_msg', document.getElementById('broadcast-message').value);
    localStorage.setItem('bot_interval', document.getElementById('send-interval').value);
    addLog("Daten gespeichert!", "#28a745");
}

function stopAction() {
    isRunning = false;
    document.getElementById('start-btn').style.display = 'block';
    document.getElementById('stop-btn').style.display = 'none';
}

async function startAction() {
    const token = document.getElementById('user-token').value;
    const newName = document.getElementById('new-channel-name').value;
    const ids = document.getElementById('target-channel-ids').value.split(',').map(id => id.trim());
    const message = document.getElementById('broadcast-message').value;
    const interval = parseInt(document.getElementById('send-interval').value) * 1000;

    if(!token || ids[0] === "") return addLog("Token oder IDs fehlen!", "red");

    isRunning = true;
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('stop-btn').style.display = 'block';
    addLog("Loop gestartet...", "cyan");

    while(isRunning) {
        for (let id of ids) {
            if(!isRunning) break;
            try {
                // Rename
                if(newName) {
                    await fetch(`https://discord.com/api/v9/channels/${id}`, {
                        method: 'PATCH',
                        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: newName })
                    });
                }
                // Message
                if(message) {
                    const res = await fetch(`https://discord.com/api/v9/channels/${id}/messages`, {
                        method: 'POST',
                        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: message })
                    });
                    if(res.ok) { countSent++; addLog(`ID ${id}: OK`); }
                    else { countError++; addLog(`ID ${id}: Fehler ${res.status}`, "red"); }
                }
                updateStats();
                await new Promise(r => setTimeout(r, interval));
            } catch (e) { countError++; updateStats(); addLog("Netzwerkfehler", "red"); }
        }
        if(isRunning) {
            countCycles++;
            updateStats();
            addLog("Zyklus beendet. Neustart...", "cyan");
        }
    }
}
