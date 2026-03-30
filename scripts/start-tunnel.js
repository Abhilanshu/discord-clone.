const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Cloudflare Tunnel...');

const tunnelProcess = spawn('npx', ['cloudflared', 'tunnel', '--url', 'http://localhost:3001'], {
    shell: true
});

let urlFound = false;

const handleOutput = (data) => {
    const output = data.toString();
    console.log(output);

    // Look for the trycloudflare.com URL
    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !urlFound) {
        urlFound = true;
        const tunnelUrl = match[0];
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
