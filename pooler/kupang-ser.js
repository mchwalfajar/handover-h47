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
            48962, 48978, 48980, 48977, 48967, 48968, 48981, 48963, 48971, 48972, 48973, 
            48965, 48966, 48974, 48964, 48969, 48979, 48970, 48976, 48975
        ];

        const stateIds = [
            64159, 64175, 64177, 64174, 64164, 64165, 64178, 64160, 64168, 64169, 64170, 
            64162, 64163, 64171, 64161, 64166, 64176, 64167, 64173, 64172
        ];

        const beams = [
            "Beam 14", "Beam 15", "Beam 16", "Beam 17", "Beam 19", "Beam 22", "Beam 25", "Beam 53",
            "Beam 74", "Beam 80", "Beam 81", "Beam 83", "Beam 84", "Beam 88", "Beam 95", "Beam 100", 
            "Beam 101", "Beam 103", "Beam 104", "Beam 200"
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

        const deleteQuery = `DELETE FROM kupang_ser WHERE timestamp < NOW() - INTERVAL 1 HOUR`;
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
                `INSERT INTO kupang_ser(beam_name, terminal, state, percentage)
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
