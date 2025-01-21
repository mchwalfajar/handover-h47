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
            48991, 48988, 48995, 48996, 49000, 49001, 48989, 48987, 48990, 48999, 48982, 48986, 
            49002, 48992, 48993, 48984, 48998, 48985, 48994, 48997, 48983
        ];

        const stateIds = [
            64188, 64185, 64192, 64193, 64197, 64198, 64186, 64184, 64187, 64196, 64179, 64183, 
            64199, 64189, 64190, 64181, 64195, 64182, 64191, 64194, 64180
        ];

        const beams = [
            "Beam 23", "Beam 24", "Beam 26", "Beam 226", "Beam 28", "Beam 228", "Beam 30", "Beam 31",
            "Beam 40", "Beam 54", "Beam 56", "Beam 60", "Beam 61", "Beam 62", "Beam 64", "Beam 66", 
            "Beam 173", "Beam 69", "Beam 72", "Beam 71", "Beam 65"
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

        const deleteQuery = `DELETE FROM ambon_ser WHERE timestamp < NOW() - INTERVAL 1 HOUR`;
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
                `INSERT INTO ambon_ser(beam_name, terminal, state, percentage)
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
