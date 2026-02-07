function sanitize(val) {
    return (val || '').replace(/^["']|["']$/g, '').trim();
}

const tests = [
    { input: '"mykey"', expected: 'mykey' },
    { input: "'mykey'", expected: 'mykey' },
    { input: '  mykey  ', expected: 'mykey' },
    { input: '" mykey "', expected: 'mykey' },
    { input: "'  mykey  '", expected: 'mykey' },
    { input: 'mykey', expected: 'mykey' }
];

tests.forEach(test => {
    const result = sanitize(test.input);
    console.log(`Input: [${test.input}] -> Output: [${result}] - ${result === test.expected ? 'PASS' : 'FAIL'}`);
});
