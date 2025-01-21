const { spawn } = require('child_process');

const scripts = [
    './app.js',
    './pooler/cikarang_ser.js',
    './pooler/banjarmasin_ser.js',
    './pooler/kupang_ser.js',
    './pooler/timika_ser.js',
    './pooler/ambon_ser.js',
    './pooler/ip_transit.js',
    './pooler/gateway_trafik.js',
    './pooler/integrasi_ut.js',
    './pooler/all_capacity.js'
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
