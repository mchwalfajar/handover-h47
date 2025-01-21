const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'sakura',
    database: 'handover_h47',
};

const database_h47 = {
    all_capacity: 'All Capacity',
    ambon_ser: 'Total High SER Ambon',
    ambon_trafik: 'Mon Trafik Ambon',
    ambon_ut: 'Integrasi UT Ambon',
    banjarmasin_ser: 'Total High SER Banjarmasin',
    banjarmasin_trafik: 'Mon Trafik Banjarmasin',
    banjarmasin_ut: 'Integrasi UT Banjarmasin',
    cikarang_ser: 'Total High SER Cikarang',
    cikarang_trafik: 'Mon Trafik Cikarang',
    cikarang_ut: 'Integrasi UT Cikarang',
    kupang_ser: 'Total High SER Kupang',
    kupang_trafik: 'Mon Trafik Kupang',
    kupang_ut: 'Integrasi UT Kupang',
    timika_ser: 'Total High SER Timika',
    timika_trafik: 'Mon Trafik Timika',
    timika_ut: 'Integrasi UT Timika',
    ip_transit: 'IP Transit'
};

app.get('/', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        const tables = [
            'ip_transit','cikarang_trafik', 'banjarmasin_trafik', 'kupang_trafik', 'timika_trafik', 'ambon_trafik',
            'cikarang_ut', 'banjarmasin_ut', 'kupang_ut', 'timika_ut', 'ambon_ut',
            'cikarang_ser', 'banjarmasin_ser', 'kupang_ser', 'timika_ser', 'ambon_ser', 'all_capacity'
        ];

    let tableData = {};

        for (const table of tables) {
            const [latestTimestampRow] = await connection.execute(`
                SELECT MAX(timestamp) AS latestTimestamp FROM ${table}
            `);

            const latestTimestamp = latestTimestampRow[0]?.latestTimestamp;

            if (latestTimestamp) {
                // Default query
                let query = `SELECT * FROM ${table} WHERE timestamp = ?`;
                let params = [latestTimestamp];

                // 15% filter query
                if (table.includes('_ser')) {
                    query += ' AND percentage > 15';
                }

                // query and store data
                const [rows] = await connection.execute(query, params);
                if (rows.length > 0) {  
                    tableData[table] = rows;
                } else {
                    tableData[table] = [];
                }
            }
        }    

        res.render('home', { tableData, database_h47 });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

const PORT = 3005;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});