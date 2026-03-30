const { spawn } = require('child_process');

// Run ngrok
const ngrok = spawn('npx', ['ngrok', 'http', '3000', '--log=stdout'], { shell: true });

ngrok.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    const match = output.match(/url=(https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app)/);
    if (match) {
        console.log('\n--- FOUND URL ---');
        console.log(match[1]);
        console.log('-----------------');
    }
});

ngrok.stderr.on('data', (data) => console.error(`stderr: ${data}`));
