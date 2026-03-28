const BASE_URL = 'http://localhost:8080';
const credentials = Buffer.from('teststaff:staff123').toString('base64');
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${credentials}`
};

async function fetchWithTimeout(url, options, timeout = 3000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

async function runTests() {
    console.log('--- WARDWATCH API TESTS ---\n');

    let passed = [];
    let failed = [];

    const pass = (step, msg) => { console.log(`✅ [PASS] ${step}: ${msg}`); passed.push(step); };
    const fail = (step, msg) => { console.log(`❌ [FAIL] ${step}: ${msg}`); failed.push({step, msg}); };

    try {
        // Step 0: Ensure test user via standard register (ignore fail)
        try {
            await fetch(`${BASE_URL}/auth/register`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username: 'teststaff', password: 'staff123', role: 'STAFF'})});
            await new Promise(r => setTimeout(r, 500));
        } catch(e) {
            console.log("Register failed:", e.message);
        }

        // Step 1: Health Check
        let beds;
        try {
            const res = await fetchWithTimeout(`${BASE_URL}/api/beds`, { headers });
            if (res.ok) {
                beds = await res.json();
                pass('STEP 1: HEALTH CHECK', `API responding. Beds count: ${beds?.length}`);
            } else {
                fail('STEP 1: HEALTH CHECK', `Status ${res.status} - ${await res.text()}`);
                return printReport(passed, failed);
            }
        } catch (e) {
            fail('STEP 1: HEALTH CHECK', `Error: ${e.message}`);
            return printReport(passed, failed);
        }

        // Ensure Ward 1 exists to admit
        try {
            await fetch(`${BASE_URL}/wards`, { method: 'POST', headers, body: JSON.stringify({name: 'ICU'})});
        } catch(e) {}

        // Step 2: Add Patient
        let queueId;
        try {
            const res = await fetchWithTimeout(`${BASE_URL}/queue`, {
                method: 'POST', headers, body: JSON.stringify({ name: 'Test Patient', type: 'ICU' })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'WAITING') {
                    pass('STEP 2: ADD PATIENT', `Status is WAITING, ID: ${data.id}`);
                    queueId = data.id;
                } else {
                    fail('STEP 2: ADD PATIENT', `Status is ${data.status}`);
                }
            } else {
                fail('STEP 2: ADD PATIENT', `Failed to create patient, HTTP ${res.status}`);
            }
        } catch (e) {
            fail('STEP 2: ADD PATIENT', e.message);
        }

        // Step 3: Admit
        let bedIdAssigned;
        if (queueId) {
            try {
                const res = await fetchWithTimeout(`${BASE_URL}/queue/${queueId}/complete?action=admit&wardId=1`, {
                    method: 'POST', headers
                });
                
                if (res.ok) {
                    const data = await res.json();
                    let errs = [];
                    if (data.status !== 'DISCHARGE_PENDING') errs.push('status=' + data.status);
                    if (!data.bedId) errs.push('bedId is null');
                    
                    if (errs.length === 0) {
                        pass('STEP 3: ADMIT', `Status is DISCHARGE_PENDING, assigned bedId: ${data.bedId}`);
                        bedIdAssigned = data.bedId;
                    } else {
                        fail('STEP 3: ADMIT', errs.join(', '));
                    }
                } else {
                    fail('STEP 3: ADMIT', `HTTP ${res.status} ${await res.text()}`);
                }
            } catch (e) {
                fail('STEP 3: ADMIT', e.message);
            }
        } else {
            fail('STEP 3: ADMIT', 'Skipped due to STEP 2 failure');
        }

        // Step 4: Discharge
        if (queueId && bedIdAssigned) {
            try {
                const res = await fetchWithTimeout(`${BASE_URL}/queue/${queueId}/complete?action=discharge`, {
                    method: 'POST', headers
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'COMPLETED') {
                        pass('STEP 4: DISCHARGE', 'Status is COMPLETED');
                    } else {
                        fail('STEP 4: DISCHARGE', `Status is ${data.status}`);
                    }
                } else {
                    fail('STEP 4: DISCHARGE', `HTTP ${res.status} ${await res.text()}`);
                }
            } catch (e) {
                fail('STEP 4: DISCHARGE', e.message);
            }
        } else {
            fail('STEP 4: DISCHARGE', 'Skipped due to previous failure');
        }

        // Step 5: Beds Check
        try {
            const res = await fetchWithTimeout(`${BASE_URL}/api/beds`, { headers });
            if (res.ok) {
                const allBeds = await res.json();
                const invalidStates = allBeds.filter(b => !['AVAILABLE', 'OCCUPIED', 'CLEANING', 'RESERVED'].includes(b.status));
                const occupied = allBeds.filter(b => b.status === 'OCCUPIED');
                
                // Track assignments to detect duplicates
                const assignments = {};
                let dup = false;
                for (let b of occupied) {
                    if (b.patientName) {
                        if (assignments[b.patientName]) dup = true;
                        assignments[b.patientName] = true;
                    }
                }

                if (invalidStates.length === 0 && !dup) {
                    pass('STEP 5: BEDS CHECK', 'No invalid states, no duplicates found.');
                } else {
                    let estr = '';
                    if (invalidStates.length) estr += `Found invalid states: ${invalidStates.map(b => b.status).join(',')}. `;
                    if (dup) estr += 'Found duplicate patient assignments.';
                    fail('STEP 5: BEDS CHECK', estr);
                }
            } else {
                fail('STEP 5: BEDS CHECK', `HTTP ${res.status}`);
            }
        } catch (e) {
            fail('STEP 5: BEDS CHECK', e.message);
        }

    } catch (e) {
        console.error("UNEXPECTED ERROR:", e);
    }

    printReport(passed, failed);
}

function printReport(passed, failed) {
    console.log('\n--- FINAL OUTPUT ---');
    console.log(`Passed: ${passed.length}, Failed: ${failed.length}`);
    if (failed.length > 0) {
        console.log('\nFAILED REASONS:');
        failed.forEach(f => console.log(` - ${f.step}: ${f.msg}`));
    }
    
    if (failed.length > 0) {
        console.log('\nVERDICT: FAIL / NEEDS FIXES');
    } else {
        console.log('\nVERDICT: PASS');
    }
}

runTests();
