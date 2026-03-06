const { validateOwner } = require('./ownerAuth');
const { spawn } = require('child_process');
const fs = require('fs');

const command = process.argv[2] || 'npm start';

console.log("\n==========================================");
console.log("  HRM MAXIMUM-SECURITY ARCHITECTURE  ");
console.log("        OWNER: ZANIAB ZIA        ");
console.log("==========================================\n");

function getHiddenInput(query, callback) {
    process.stdout.write(query);

    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let input = '';

    const onData = (data) => {
        for (let i = 0; i < data.length; i++) {
            const char = data[i];
            if (char === '\n' || char === '\r' || char === '\u0004') {
                stdin.setRawMode(false);
                stdin.pause();
                stdin.removeListener('data', onData);
                process.stdout.write('\n');
                callback(input);
                return;
            } else if (char === '\u0003') { // Ctrl+C
                process.exit();
            } else if (char === '\u0008' || char === '\x7f') { // Backspace
                if (input.length > 0) {
                    input = input.slice(0, -1);
                }
            } else {
                input += char;
            }
        }
    };

    stdin.on('data', onData);
}

const envPasskey = process.env.OWNER_PASSKEY_B || process.env.FRAG_B;

if (envPasskey) {
    console.log("Using passkey from environment...");
    if (validateOwner(envPasskey)) {
        console.log("\n✅ OWNER AUTHORIZED (ENV). UNLOCKING SYSTEM...\n");
        startChild();
    } else {
        console.log("\n❌ ACCESS DENIED - INVALID ENV PASSKEY");
        process.exit(1);
    }
} else if (!process.stdin.isTTY) {
    console.log("\n❌ ACCESS DENIED - NON-INTERACTIVE TERMINAL DETECTED");
    process.stdout.write("Please provide passkey via OWNER_PASSKEY_B environment variable.\n");
    process.exit(1);
} else {
    getHiddenInput('ENTER OWNER PASSKEY (FRAG-B): ', (passkey) => {
        if (validateOwner(passkey)) {
            console.log("\n✅ OWNER AUTHORIZED. UNLOCKING SYSTEM...\n");
            startChild();
        } else {
            console.log("\n❌ ACCESS DENIED - OWNER AUTHORIZATION REQUIRED");
            console.log("REASON: INVALID PASSKEY OR UNAUTHORIZED DEVICE\n");
            process.exit(1);
        }
    });
}

function startChild() {
    const shell = process.platform === 'win32' ? true : '/bin/sh';
    const child = spawn(command, [], {
        stdio: 'inherit',
        shell: shell
    });

    child.on('exit', (code) => {
        process.exit(code || 0);
    });
}
