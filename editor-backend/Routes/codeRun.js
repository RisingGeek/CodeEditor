const router = require('express').Router();
const fs = require('fs');
const { exec } = require('child_process');

router.post('/run', (req, res) => {
    //write array of codes in cpp file
    let codes = req.body.codes;
    let code = "";
    for (let str of codes) {
        code += str + "\n";
    }
    fs.writeFile('try.cpp', code, (err) => {
        if (err)
            throw err;

        console.log('replaced');
        const out = exec('g++ try.cpp -o out && ./out');
        // **exec opens a new terminal and executes the command**
        //output
        out.stdout.on('data', (data) => {
            console.log('output:');
            console.log(String(data));
            //remove out file generated during compilation
            fs.unlink('out', err => {
                if (err) throw err;
                console.log('successfully removed file');
                res.send('got it');
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
    });
    //child process for executing code

    //send output as response
});

module.exports = router;