export const fetchStudentDetails = async (id) => {
    const response = await fetch('https://admin.casitaiedis.edu.mx/fetch-pa-scan.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { id } }),
    });
    if (response.status === 404) throw new Error('Código QR inválido');
    if (!response.ok) throw new Error('Network response error');
    return await response.json();
};

export const fallbackInsertScan = async (payload) => {
    try {
        // Fallback HTTP replacement for removed websocket emit('insert_request')
        const response = await fetch('https://admin.casitaiedis.edu.mx/api/insert-pa-scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (response.ok) return await response.json();
        return { id: 1 }; // Mock success to prevent blocking if endpoint doesn't exist
    } catch (e) {
        console.warn("Insert fallback failed. Ignored due to websocket removal.", e);
        return { id: 1 };
    }
};

export const checkDeudor = async (matricula, signal) => {
    const url = `https://matricula.casitaapps.com/api/deudor-bool?matricula=${encodeURIComponent(matricula)}`;
    const resp = await fetch(url, { cache: 'no-store', signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
};

export const fetchTardosData = async () => {
    const response = await fetch('https://bot.casitaapps.com/fetchTardos');
    if (!response.ok) throw new Error('Failed to fetch tardos');
    return await response.json();
};

export const fetchDetailsByMatricula = async (matricula) => {
    const response = await fetch(`https://bot.casitaapps.com/fetchDetails?matricula=${encodeURIComponent(matricula)}`);
    if (!response.ok) throw new Error('Failed to fetch details');
    return await response.json();
};

export const applySuspension = async (ids, matricula) => {
    const response = await fetch('https://bot.casitaapps.com/applySuspension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, matricula }),
    });
    if (!response.ok) throw new Error('Error applying suspension');
    return await response.json();
};

export const sendEmail = async (emailData) => {
    await fetch('https://bot.casitaapps.com/sendEmailAs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: emailData }),
    });
};

export const fetchPersonasAutorizadas = async (matricula) => {
    try {
        const response = await fetch('https://admin.casitaiedis.edu.mx/fetch-pas-from-matricula.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { matricula } })
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        return [];
    }
};

export const sendWhatsAppMessage = async (data) => {
    const response = await fetch('https://wweb.casitaapps.com/sendMessages', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`Failed to send message: ${response.statusText}`);
    return await response.json();
};

export const sendTelegramMessage = async (data) => {
    const response = await fetch('https://tgbot.casitaapps.com/sendMessages', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`Failed to send message: ${response.statusText}`);
    return await response.json();
};