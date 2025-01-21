const axios = require('axios');
const mysql = require('mysql2/promise');

// const server = 
// const username = 
// const password =

const dbConfig = {
    host: 'localhost', 
    user: 'root',      
    password: 'sakura',
    database: 'handover_h47',};

const calculatePercentage = (state, term) => {
    if (term === 0) {
        return null; 
    }
    return parseFloat(((state * 100) / term).toFixed(2));
};

const fetchAndProcessData = async () => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        const loginResponse = await axios.post(server, {
            jsonrpc: "2.0",
            method: "user.login",
            params: {
                username: username,
                password: password,
            },
            id: 1,
        });

        const auth = loginResponse.data.result;

        const hostId =  10688;
        const itemIds = [
            48961, 48959, 48956, 48956, 48953, 48954, 48955, 48960, 48957, 48958
        ];

        const stateIds = [
            64158, 64156, 64153, 64150, 64151, 64152, 64157, 64154, 64155
        ];

        const beams = [
            "Beam 73", "Beam 174", "Beam 75", "Beam 76", "Beam 77", "Beam 78", "Beam 79", "Beam 93",
            "Beam 97"
        ];

        const fetchItems = async (ids) => {
            return Promise.all(
                ids.map(async (id) => {
                    const response = await axios.post(server, {
                        jsonrpc: "2.0",
                        method: "item.get",
                        params: {
                            output: ["lastvalue"],
                            hostids: hostId,
                            itemids: id,
                        },
                        auth: auth,
                        id: 1,
                    });

                    return parseInt(response.data.result[0]?.lastvalue || 0, 10);
                })
            );
        };

        const termValues = await fetchItems(itemIds);
        const stateValues = await fetchItems(stateIds);

        const deleteQuery = `DELETE FROM banjarmasin_ser WHERE timestamp < NOW() - INTERVAL 1 HOUR`;
        await connection.execute(deleteQuery);
        console.log('Old records deleted from ambon_ser table.');

        for (let i = 0; i < beams.length; i++) {
            const terminal = termValues[i];
            const state = stateValues[i];
            const percentage = calculatePercentage(state, terminal);

            const output = {
                beam_name: beams[i],
                terminal,
                state,
                percentage,
                }
            console.log(output); 

            await connection.execute(
                `INSERT INTO banjarmasin_ser(beam_name, terminal, state, percentage)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                terminal = VALUES(terminal),
                state = VALUES(state),
                percentage = VALUES(percentage)`,
                [output.beam_name, output.terminal, output.state, output.percentage]
            );
        }

        console.log("Data successfully updated in MySQL.");

        await axios.post(server, {
            jsonrpc: "2.0",
            method: "user.logout",
            params: [],
            auth: auth,
            id: 1,
        });
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

setInterval(fetchAndProcessData, 60000);
fetchAndProcessData();
