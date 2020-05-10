const { exec } = require('child_process');
const fs = require('fs');
const out = exec('g++ try.cpp -o out && ./out');

// **exec opens a new terminal and executes the command**
//output
out.stdout.on('data', (data) => {
    console.log('output:');
    console.log(String(data));
    //remove out file generated during compilation
    fs.unlink('out', err => {
        if(err) throw err;
        console.log('successfully removed file');
    });
});

//error
out.stderr.on('data', (data) => {
    console.log('stdin: ', String(data));
});

//close
out.on('close', code => {
    console.log('child process exited with code', code);
});