const FETCH_TIMEOUT = 5000;

const fetchWithTimeout = (url, options) =>
    Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), FETCH_TIMEOUT)
        ),
    ]);

// No Content-Type header — matches original script_2.js exactly.
// Adding Content-Type: application/json triggers a CORS preflight (OPTIONS)
// that the PHP server does not handle, causing "Failed to fetch".
export const fetchStudentDetails = async (id) => {
    const response = await fetchWithTimeout(
        'https://admin.casitaiedis.edu.mx/fetch-pa-scan.php',
        {
            method: 'POST',
            body: JSON.stringify({ data: { id } }),
            // deliberately no Content-Type header
        }
    );
    if (response.status === 404) throw new Error('Código QR inválido');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    if (!data[0]) throw new Error('Invalid student data received');
    return data;
};

export const fallbackInsertScan = async (payload) => {
    try {
        const response = await fetch('https://admin.casitaiedis.edu.mx/api/insert-pa-scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (response.ok) return await response.json();
        return { id: 1 };
    } catch (e) {
        console.warn('Insert fallback failed. Ignored.', e);
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
    const response = await fetch(
        `https://bot.casitaapps.com/fetchDetails?matricula=${encodeURIComponent(matricula)}`
    );
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

// Same fix: no Content-Type to avoid preflight on this PHP endpoint.
export const fetchPersonasAutorizadas = async (matricula) => {
    try {
        const response = await fetch(
            'https://admin.casitaiedis.edu.mx/fetch-pas-from-matricula.php',
            {
                method: 'POST',
                body: JSON.stringify({ data: { matricula } }),
                // deliberately no Content-Type header
            }
        );
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.error('fetchPersonasAutorizadas failed:', error);
        return [];
    }
};

export const sendWhatsAppMessage = async (data) => {
    const response = await fetch('https://wweb.casitaapps.com/sendMessages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to send WhatsApp message: ${response.statusText}`);
    return await response.json();
};

export const sendTelegramMessage = async (data) => {
    const response = await fetch('https://tgbot.casitaapps.com/sendMessages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to send Telegram message: ${response.statusText}`);
    return await response.json();
};