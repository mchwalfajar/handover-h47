const axios = require('axios');
const mysql = require('mysql2');

// const zabbixApi = 
// const authToken = 

const capacityItems = {
    or_cap: '51502',
    ir_cap: '51863'
};

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'sakura',
    database: 'handover_h47',
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL');
});

function parseLastValue(value) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
}

async function fetchAndSaveData() {
    try {
        const response = await axios.post(zabbixApi, {
            jsonrpc: '2.0',
            method: 'item.get',
            params: {
                output: ['itemid', 'name', 'lastvalue'],
                hostids: 10688
            },
            auth: authToken,
            id: 2,
        });

        const items = response.data.result;

        if (!items || items.length === 0) {
            console.log('No items found.');
            return;
        }

        const orCap = parseLastValue(
            items.find(item => item.itemid === capacityItems.or_cap)?.lastvalue
        );
        const irCap = parseLastValue(
            items.find(item => item.itemid === capacityItems.ir_cap)?.lastvalue
        );

        const total = orCap !== null && irCap !== null ? orCap + irCap : null;

        console.log(
            'OR Capacity:',
            orCap?.toFixed(2) ?? 'N/A',
            'IR Capacity:',
            irCap?.toFixed(2) ?? 'N/A',
            'Total:',
            total?.toFixed(2) ?? 'N/A'
        );

        if (orCap !== null && irCap !== null && total !== null) {
            const query = `
                INSERT INTO all_capacity (or_capacity, ir_capacity, total, timestamp)
                VALUES (?, ?, ?, NOW())
            `;
            const params = [orCap, irCap, total];

            db.execute(query, params, (err, result) => {
                if (err) {
                    console.error('Error saving data to database:', err.message);
                } else {
                    console.log('Data successfully saved to database.');
                }
            });
        } else {
            console.log('Data not found or invalid for all items.');
        }
    } catch (error) {
        console.error('Error fetching Zabbix data:', error.message);
    }
}

setInterval(fetchAndSaveData, 60000);
fetchAndSaveData();
