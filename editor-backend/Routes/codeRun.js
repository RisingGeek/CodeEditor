const router = require('express').Router();
const fs = require('fs');
const { exec } = require('child_process');

router.post('/run', (req, res) => {
    //req.body items
    let code = req.body.code;
    let input = req.body.input;
    let id = req.body.id;

    // Step 1: Make 2 files and copy source code and input to it. 
    const sourceFile = new Promise((resolve, reject) => {
        fs.writeFile(`${id}.cpp`, code, err => {
            if (err)
                reject(err);
            resolve('source file created');
        });
    });
    const inputFile = new Promise((resolve, reject) => {
        fs.writeFile(`${id}.txt`, input, err => {
            if (err)
                reject(err);
            resolve('input file created');
        });
    });

    // Step 2: Execute child process to generate output
    Promise.all([sourceFile, inputFile]).then(response => {
        // exec opens a new terminal and executes the command
        const command = `g++ ${id}.cpp -o out_${id} && ./out_${id} < ${id}.txt`;
        exec(command, (error, stdout, stderr) => {
            // console.log({stdout}, {stderr});
            //Step 3: Delete source, input and out file. 
            const delSourceFile = new Promise((resolve, reject) => {
                fs.unlink(`${id}.cpp`, err => {
                    if (err) reject(err);
                    resolve('Removed source file');
                });
            });
            const delInputFile = new Promise((resolve, reject) => {
                fs.unlink(`${id}.txt`, err => {
                    if (err) reject(err);
                    resolve('Removed input file');
                });
            });
            const delOutFile = new Promise((resolve, reject) => {
                //out file will not be generated when error occurs.s
                if (stderr)
                    resolve('No need to delete out file');
                fs.unlink(`out_${id}`, err => {
                    if (err) reject(err);
                    resolve('Removed out file');
                });
            });

            Promise.all([delSourceFile, delInputFile, delOutFile]).then(response2 => {
                if (stderr) {
                    // 400 error status because of bad request(code variable is not valid)
                    res.status(400).send(stderr);
                }
                else
                    res.send(stdout);
            }).catch(err => {
                console.log(err);
            });
        });
    }).catch(err => {
        console.log(err);
    });
});

module.exports = router;