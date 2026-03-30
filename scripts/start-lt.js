const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Localtunnel...');

const tunnelProcess = spawn('npx', ['lt', '--port', '3001'], {
    shell: true
});

let urlFound = false;

const handleOutput = (data) => {
    const output = data.toString();
    console.log(output);

    // Look for the localtunnel URL (e.g. your url is: https://funny-ants-jump.loca.lt)
    const match = output.match(/your url is: (https:\/\/[a-zA-Z0-9-]+\.loca\.lt)/);
    if (match && !urlFound) {
        urlFound = true;
        const tunnelUrl = match[1];
        console.log(`\n\n🎉 [FLAWLESS TUNNEL] URL: ${tunnelUrl}\n`);

        // Update .env
        const envPath = path.join(__dirname, '..', '.env');
        if (fs.existsSync(envPath)) {
            let envFile = fs.readFileSync(envPath, 'utf8');
            envFile = envFile.replace(/NEXT_PUBLIC_SITE_URL=.*/g, `NEXT_PUBLIC_SITE_URL=${tunnelUrl}`);
            fs.writeFileSync(envPath, envFile);
            console.log('✅ Successfully updated .env with NEXT_PUBLIC_SITE_URL');
        } else {
            console.error('❌ .env file not found!');
        }
    }
};

tunnelProcess.stdout.on('data', handleOutput);
tunnelProcess.stderr.on('data', handleOutput);

tunnelProcess.on('close', (code) => {
    console.log(`Tunnel process exited with code ${code}`);
});

process.on('SIGINT', () => {
    tunnelProcess.kill();
    process.exit();
});
