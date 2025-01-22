const axios = require('axios');
const mysql = require('mysql2');

//const zabbixApi = 
//const authToken = 

const itemsConfig = {
    cikarang: {
        orConf: ['51504'],
        irConf: ['51866'],
        or_estCapRaw: ['58547'], 
        or_targetCapRaw: [],
        ir_estCapRaw: [], 
        ir_targetCapRaw: [],
        table: 'cikarang_trafik'
    },
    banjarmasin: {
        orConf: ['51503'],
        irConf: ['51865'],
        or_estCapRaw: ['58546'], 
        or_targetCapRaw: [],
        ir_estCapRaw: [], 
        ir_targetCapRaw: [],
        table: 'banjarmasin_trafik'
    },
    kupang: {
        orConf: ['51505'],
        irConf: ['51867'],
        or_estCapRaw: ['58548'], 
        or_targetCapRaw: [],
        ir_estCapRaw: [], 
        ir_targetCapRaw: [],
        table: 'kupang_trafik'
    },
    ambon: {
        orConf: ['51506'],
        irConf: ['51864'],
        or_estCapRaw: ['58545'], 
        or_targetCapRaw: [],
        ir_estCapRaw: [], 
        ir_targetCapRaw: [],
        table: 'ambon_trafik'
    },
    timika: {
        orConf: ['51507'],
        irConf: ['51868'],
        or_estCapRaw: ['58549'], 
        or_targetCapRaw: [],
        ir_estCapRaw: [], 
        ir_targetCapRaw: [],
        table: 'timika_trafik'
    }
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

async function fetchZabbixData() {
    try {
        const response = await axios.post(zabbixApi, {
            jsonrpc: '2.0',
            method: 'item.get',
            params: {
                output: ['itemid', 'name', 'lastvalue'],
                hostids: [10688, 10698]
            },
            auth: authToken,
            id: 2,
        });

        const items = response.data.result;

        if (!items || items.length === 0) {
            console.log('No items found.');
            return;
        }

        for (const [region, config] of Object.entries(itemsConfig)) {
            const orConfItems = items.filter(item => config.orConf?.includes(item.itemid));
            const irConfItems = items.filter(item => config.irConf?.includes(item.itemid));
            const or_estCapItems = config.or_estCapRaw ? items.filter(item => config.or_estCapRaw.includes(item.itemid)) : [];
            const or_targetCapItems = config.or_targetCapRaw ? items.filter(item => config.or_targetCapRaw.includes(item.itemid)) : [];            
            const ir_estCapItems = config.ir_estCapRaw ? items.filter(item => config.ir_estCapRaw.includes(item.itemid)) : [];
            const ir_targetCapItems = config.ir_targetCapRaw ? items.filter(item => config.ir_targetCapRaw.includes(item.itemid)) : [];

            const or_cap_conf = orConfItems.reduce((sum, item) => sum + (parseInt(item.lastvalue, 10) || 0), 0);
            const ir_cap_conf = irConfItems.reduce((sum, item) => sum + (parseInt(item.lastvalue, 10) || 0), 0);
            const or_estCap = or_estCapItems.reduce((sum, item) => sum + (parseInt(item.lastvalue, 10) || 0), 0);
            const or_targetCap = or_targetCapItems.reduce((sum, item) => sum + (parseInt(item.lastvalue, 10) || 0), 0);
            const ir_estCap = ir_estCapItems.reduce((sum, item) => sum + (parseInt(item.lastvalue, 10) || 0), 0);
            const ir_targetCap = ir_targetCapItems.reduce((sum, item) => sum + (parseInt(item.lastvalue, 10) || 0), 0);

            console.log(`${region}OR Capacity Conf:`, or_cap_conf.toFixed(2));
            console.log(`${region}IR Capacity Conf:`, ir_cap_conf.toFixed(2));
            console.log(`${region}OR Capacity Est:`, or_estCap.toFixed(2));
        
            if (or_cap_conf > 0 || ir_cap_conf > 0 || or_estCap > 0) {
                const tableName = config.table;

                const deleteQuery = `DELETE FROM ${tableName} WHERE timestamp < NOW() - INTERVAL 1 HOUR`;
                db.query(deleteQuery, (err, result) => {
                    if (err) {
                        console.error(`Error deleting old data from ${tableName}:`, err.message);
                        return;
                    }
                    console.log(`Old records deleted from ${tableName}.`);
                });

                const query = `
                    INSERT INTO ${config.table} (or_cap_conf, ir_cap_conf, or_estCap, or_targetCap, ir_estCap, ir_targetCap, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                `;
                db.query(query, [or_cap_conf, ir_cap_conf, or_estCap, or_targetCap, ir_estCap, ir_targetCap], (err, result) => {
                    if (err) {
                        console.error(`Error inserting data into ${config.table}:`, err.message);
                        return;
                    }
                    console.log(`Data successfully inserted into ${config.table}:`, result.insertId);
                });
            }
        }
    } catch (error) {
        console.error('Error fetching data from Zabbix API:', error.message);
    }
}

setInterval(fetchZabbixData, 60000);
fetchZabbixData();

