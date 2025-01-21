const axios = require('axios');
const mysql = require('mysql2');

// const zabbixApi = 
// const authToken = 

const transitItems = {
    cikarang: { incoming: ['52188'], outgoing: ['52401'] },
    ambon: { incoming: ['49325'], outgoing: ['49526'] },
    timika: { incoming: ['50032'], outgoing: ['49526'] }
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
                hostids: [10703, 10690, 10691],
            },
            auth: authToken,
            id: 2,
        });

        const items = response.data.result;

        if (!items || items.length === 0) {
            console.log('No items found.');
            return;
        }

        const cikarangIncoming = parseLastValue(
            items.find(item => transitItems.cikarang.incoming.includes(item.itemid))?.lastvalue
        );
        const cikarangOutgoing = parseLastValue(
            items.find(item => transitItems.cikarang.outgoing.includes(item.itemid))?.lastvalue
        );
        const ambonIncoming = parseLastValue(
            items.find(item => transitItems.ambon.incoming.includes(item.itemid))?.lastvalue
        );
        const ambonOutgoing = parseLastValue(
            items.find(item => transitItems.ambon.outgoing.includes(item.itemid))?.lastvalue
        );
        const timikaIncoming = parseLastValue(
            items.find(item => transitItems.timika.incoming.includes(item.itemid))?.lastvalue
        );
        const timikaOutgoing = parseLastValue(
            items.find(item => transitItems.timika.outgoing.includes(item.itemid))?.lastvalue
        );

        console.log(
            'cikarangIncoming:',
            cikarangIncoming?.toFixed(2) ?? 'N/A',
            'cikarangOutgoing:',
            cikarangOutgoing?.toFixed(2) ?? 'N/A'
        );
        console.log(
            'ambonIncoming:',
            ambonIncoming?.toFixed(2) ?? 'N/A',
            'ambonOutgoing:',
            ambonOutgoing?.toFixed(2) ?? 'N/A'
        );
        console.log(
            'timikaIncoming:',
            timikaIncoming?.toFixed(2) ?? 'N/A',
            'timikaOutgoing:',
            timikaOutgoing?.toFixed(2) ?? 'N/A'
        );

        if (
            cikarangIncoming !== null &&
            cikarangOutgoing !== null &&
            ambonIncoming !== null &&
            ambonOutgoing !== null &&
            timikaIncoming !== null &&
            timikaOutgoing !== null
        ) {

            const deleteQuery = `DELETE FROM ip_transit WHERE timestamp < NOW() - INTERVAL 1 HOUR`;
            db.execute(deleteQuery, (err, result) => {
                if (err) {
                    console.error('Error deleting old data:', err.message);
                    return;
                }
                console.log('Old data deleted successfully.');

                const query = 
                `INSERT INTO ip_transit (cikarang_incoming, cikarang_outgoing, ambon_incoming, ambon_outgoing, timika_incoming, timika_outgoing, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, NOW())`;

            const params = [
                cikarangIncoming,
                cikarangOutgoing,
                ambonIncoming,
                ambonOutgoing,
                timikaIncoming,
                timikaOutgoing,
            ];

            db.execute(query, params, (err, result) => {
                if (err) {
                    console.error('Error saving data to database:', err.message);
                } else {
                    console.log('Data successfully saved to database.');
                }
            });
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
