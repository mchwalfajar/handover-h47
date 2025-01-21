const axios = require('axios');
const mysql = require('mysql2');

// const zabbixApi = 
// const authToken = 

const utItems = {
    cikarang: { online: ['54616'], offline: ['54615'] },
    banjarmasin: { online: ['54618'], offline: ['54617'] },
    ambon: { online: ['54622'], offline: ['54621'] },
    timika: { online: ['54624'], offline: ['54623'] },
    kupang: { online: ['54620'], offline: ['54619'] }
};

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'sakura',
    database: 'handover_h47',});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL');
});

async function fetchZabbixData() {
    try {
        const response = await axios.post(zabbixApi, {
            jsonrpc: '2.0',
            method: 'item.get',
            params: {
                output: ['itemid', 'name', 'lastvalue'],
                hostids: 10710,
            },
            auth: authToken,
            id: 2,
        });

        const items = response.data.result;

        if (!items || items.length === 0) {
            console.log('No items found.');
            return;
        }

        for (const location in utItems) {
            const { online, offline } = utItems[location];

            const onlineUt = items.find(item => online.includes(item.itemid));
            const offlineUt = items.find(item => offline.includes(item.itemid));

            const onlineUtValue = onlineUt ? parseInt(onlineUt.lastvalue, 10) : 0;
            const offlineUtValue = offlineUt ? parseInt(offlineUt.lastvalue, 10) : 0;

            const totalUt = onlineUtValue + offlineUtValue;
            const percentageUt = totalUt > 0 ? ((onlineUtValue / totalUt) * 100).toFixed(2) : 0;

            console.log(`${location.toUpperCase()} - Online UT:`, onlineUtValue);
            console.log(`${location.toUpperCase()} - Offline UT:`, offlineUtValue);
            console.log(`${location.toUpperCase()} - Total UT:`, totalUt);
            console.log(`${location.toUpperCase()} - Percentage UT:`, percentageUt);

            const tableName = `${location}_ut`;

            const deleteQuery = `DELETE FROM ${tableName} WHERE timestamp < NOW() - INTERVAL 1 HOUR`;
            db.query(deleteQuery, (err, result) => {
                if (err) {
                    console.error(`Error deleting old data from ${tableName}:`, err.message);
                    return;
                }
                console.log(`Old records deleted from ${tableName}.`);
            });

            const query = `
                INSERT INTO ${tableName} (online_ut, offline_ut, total_ut, percentage_ut, timestamp) 
                VALUES (?, ?, ?, ?, NOW())
            `;
            db.query(query, [onlineUtValue, offlineUtValue, totalUt, percentageUt], (err, result) => {
                if (err) {
                    console.error(`Error inserting data into ${tableName}:`, err.message);
                    return;
                }
                console.log(`Data successfully inserted into ${tableName}:`, result.insertId);
            });
        }
    } catch (error) {
        console.error('Error fetching data from Zabbix API:', error.message);
    }
}

setInterval(fetchZabbixData, 60000)
fetchZabbixData();
