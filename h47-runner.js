const { spawn } = require('child_process');

const scripts = [
    './app.js',
    './pooler/cikarang-ser.js',
    './pooler/banjarmasin-ser.js',
    './pooler/kupang-ser.js',
    './pooler/timika-ser.js',
    './pooler/ambon-ser.js',
    './pooler/ip-transit.js',
    './pooler/gateway-trafik.js',
    './pooler/integrasi-ut.js',
    './pooler/all-capacity.js'
];

function runScript(script) {
    const process = spawn('node', [script]);

    process.stdout.on('data', (data) => {
        console.log(`[${script}]: ${data}`);
    });

    process.stderr.on('data', (data) => {
        console.error(`[${script} ERROR]: ${data}`);
    });

    process.on('close', (code) => {
        console.log(`[${script}] exited with code ${code}`);
    });
}

scripts.forEach((script) => {
    console.log(`Starting ${script}...`);
    runScript(script);
});
