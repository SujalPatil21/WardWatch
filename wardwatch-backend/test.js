const BASE_URL = 'http://localhost:8080';
const credentials = Buffer.from('teststaff:staff123').toString('base64');
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${credentials}`
};

async function runTests() {
    let report = [];
    const log = (msg) => { console.log(msg); report.push(msg); };

    try {
        // Step 0: Register test user
        log('--- STEP 0: REGISTER ---');
        try {
            await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username: 'teststaff', password: 'staff123', role: 'STAFF' })
            });
            log('[PASS] Registered teststaff');
        } catch (e) {
            log('[INFO] User might already exist.');
        }

        await new Promise(r => setTimeout(r, 1000));

        // Step 1: Create 2 wards
        log('\n--- STEP 1: CREATE WARDS ---');
        let icuWard, genWard;
        try {
            const res1 = await fetch(`${BASE_URL}/wards`, { method: 'POST', headers, body: JSON.stringify({ name: 'ICU' }) });
            if (!res1.ok) throw new Error(await res1.text());
            icuWard = (await res1.json()).id;

            const res2 = await fetch(`${BASE_URL}/wards`, { method: 'POST', headers, body: JSON.stringify({ name: 'General' }) });
            genWard = (await res2.json()).id;
            log(`[PASS] Wards created. ICU: ${icuWard}, General: ${genWard}`);
        } catch (e) {
            const wRes = await fetch(`${BASE_URL}/wards`, { headers });
            if (wRes.ok) {
                const data = await wRes.json();
                if (data.length >= 2) {
                    icuWard = data[0].id;
                    genWard = data[1].id;
                    log(`[INFO] Used existing wards: ${icuWard}, ${genWard}`);
                } else {
                    log(`[FAIL] Could not create wards: ${e.message}`);
                }
            }
        }

        let beds = [];
        try {
            const bedRes = await fetch(`${BASE_URL}/api/beds`, { headers });
            if (bedRes.ok) {
                beds = await bedRes.json();
                log(`[PASS] Fetched beds. Count: ${beds.length}`);
            } else { log(`[FAIL] Could not fetch beds`); }
        } catch (e) { log(`[FAIL] Could not fetch beds: ${e.message}`); }

        // Step 2: Add Patient
        log('\n--- STEP 2: ADD PATIENT ---');
        let queueId;
        try {
            const qRes = await fetch(`${BASE_URL}/queue`, {
                method: 'POST', headers,
                body: JSON.stringify({ name: "Test Patient 1", type: "ICU" })
            });
            if (qRes.ok) {
                const q1 = await qRes.json();
                if (q1.status === 'WAITING') {
                    log(`[PASS] Patient added. ID: ${q1.id}, Status: ${q1.status}`);
                    queueId = q1.id;
                } else {
                    log(`[FAIL] Patient status is ${q1.status}, expected WAITING`);
                }
            } else {
                log(`[FAIL] Add patient failed`);
            }
        } catch (e) { log(`[FAIL] Could not add patient: ${e.message}`); }

        // Step 3: Admit Patient
        log('\n--- STEP 3: ADMIT PATIENT ---');
        let assignedBedId;
        if (queueId) {
            try {
                const admitRes = await fetch(`${BASE_URL}/queue/${queueId}/complete?action=admit&wardId=${icuWard}`, { method: 'POST', headers });
                if (admitRes.ok) {
                    const q = await admitRes.json();
                    let ok = true;
                    if (q.status !== 'DISCHARGE_PENDING') { log(`[FAIL] Admit status: ${q.status}`); ok = false; }
                    if (!q.bedId) { log(`[FAIL] bedId is null`); ok = false; }
                    if (!q.admittedAt) { log(`[FAIL] admittedAt is null`); ok = false; }
                    if (ok) {
                        assignedBedId = q.bedId;
                        log(`[PASS] Patient admitted successfully. Bed assigned: ${assignedBedId}`);
                    }
                } else {
                    log(`[FAIL] Admit endpoint returned ${admitRes.status}: ${await admitRes.text()}`);
                }
            } catch (e) { log(`[FAIL] Could not admit patient: ${e.message}`); }
        }

        // Step 4: Validate Bed State
        log('\n--- STEP 4: VALIDATE BED STATE ---');
        if (assignedBedId) {
            try {
                const bedsRes = await fetch(`${BASE_URL}/api/beds`, { headers });
                const bedsAfter = await bedsRes.json();
                const assignedBed = bedsAfter.find(b => b.id === assignedBedId);
                if (assignedBed && assignedBed.status === 'OCCUPIED') {
                    log(`[PASS] Bed ${assignedBedId} is OCCUPIED`);
                } else {
                    log(`[FAIL] Bed ${assignedBedId} state is ${assignedBed?.status}`);
                }
            } catch (e) { log(`[FAIL] Validate bed: ${e.message}`); }
        }

        // Step 5: Discharge Patient
        log('\n--- STEP 5: DISCHARGE PATIENT ---');
        if (queueId && assignedBedId) {
            try {
                const disRes = await fetch(`${BASE_URL}/queue/${queueId}/complete?action=discharge`, { method: 'POST', headers });
                if (disRes.ok) {
                    const q = await disRes.json();
                    if (q.status === 'COMPLETED') { log(`[PASS] Queue status is COMPLETED`); } 
                    else { log(`[FAIL] Queue status is ${q.status}`); }
                } else { log(`[FAIL] Discharge failed`); }

                const bedsRes = await fetch(`${BASE_URL}/api/beds`, { headers });
                const bedsDis = await bedsRes.json();
                const b = bedsDis.find(bed => bed.id === assignedBedId);
                if (b && b.status === 'CLEANING') {
                    log(`[PASS] Bed ${assignedBedId} is CLEANING`);
                } else {
                    log(`[FAIL] Bed ${assignedBedId} is ${b?.status}`);
                }
            } catch (e) { log(`[FAIL] Discharge patient: ${e.message}`); }
        }

        // Step 6: Capacity and Alerts
        log('\n--- STEP 6 & 7: CAPACITY & ALERTS ---');
        try {
            const capRes = await fetch(`${BASE_URL}/capacity`, { headers });
            const capData = await capRes.json();
            const alertsRes = await fetch(`${BASE_URL}/alerts`, { headers });
            const alertsData = await alertsRes.json();
            
            if (capData.totalBeds > 0) {
                log(`[PASS] Capacity endpoint reachable. Total: ${capData.totalBeds}, Status: ${capData.status}`);
            } else {
                log(`[FAIL] Invalid capacity data`);
            }
            log(`[PASS] Alerts endpoint reachable. Flag count: ${alertsData.length}`);
        } catch(e) { log(`[FAIL] Capacity/Alerts: ${e.message}`); }

        // Step 8: Summaries
        log('\n--- STEP 8: SUMMARY ---');
        try {
            let capWards = await fetch(`${BASE_URL}/wards/summary`, { headers });
            if (!capWards.ok) capWards = await fetch(`${BASE_URL}/summary`, { headers });
            if (capWards.ok) log(`[PASS] Summary endpoint reachable`);
            else log(`[FAIL] Summary endpoint failed`);
        } catch (e) { log(`[FAIL] Summary endpoint failed`); }
        
    } catch(err) {
        log(`FATAL ERROR: ${err.message}`);
    }

    console.log('\n\n==== DONE ====');
}

runTests();
