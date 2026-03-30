const { spawn } = require('child_process');

const cl = spawn('npx', ['cloudflared', 'tunnel', '--url', 'http://localhost:3000'], { shell: true });

cl.stderr.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match) {
        console.log('\n--- FOUND URL ---');
        console.log(match[0]);
        console.log('-----------------');

        // Write it to a file for the AI to read
        const fs = require('fs');
        fs.writeFileSync('cloudflare-url.txt', match[0]);
    }
});

cl.stdout.on('data', (data) => console.log(data.toString()));
