const { spawn } = require('child_process');

module.exports = function runCode(language, code) {
  return new Promise((resolve, reject) => {
    let child;
    if (language === 'javascript') {
      child = spawn('node', ['-e', code]);
    } else if (language === 'python') {
      child = spawn('python3', ['-c', code]);
    } else {
      return resolve({ stdout: '', stderr: 'Unsupported language', exitCode: 1 });
    }

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code });
    });

    child.on('error', (err) => {
      resolve({ stdout: '', stderr: err.message, exitCode: 1 });
    });

    // Timeout
    setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr: 'Execution timed out', exitCode: 143 }); // SIGTERM exit code
    }, 5000);
  });
};
