const router = require('express').Router();
const fs = require('fs');
const { exec } = require('child_process');
const codeHelper = require('../Helpers/codeHelper');

router.post('/run', (req, res) => {
    //req.body items
    let code = req.body.code;
    let input = req.body.input;
    let id = req.body.id;

    // Step 1: Make 2 files and copy source code and input to it. 
    const sourceFile = codeHelper.createFile(id, '.cpp', code);
    const inputFile = codeHelper.createFile(id, '.txt', input);

    // Step 2: Execute child process to generate output
    Promise.all([sourceFile, inputFile]).then(response => {
        // exec opens a new terminal and executes the command
        const command = `g++ ${id}.cpp -o ${id}.out && ./${id}.out < ${id}.txt`;
        exec(command, (error, stdout, stderr) => {
            //Step 3: Delete source, input and out file. 
            console.log(stderr)
            const delSourceFile = codeHelper.removeFile(id, '.cpp');
            const delInputFile = codeHelper.removeFile(id, '.txt');
            const delOutFile = codeHelper.removeFile(id, '.out', stderr);

            Promise.all([delSourceFile, delInputFile, delOutFile]).then(response2 => {
                if (stderr) {
                    // 400 error status because of bad request(code variable is not valid)
                    res.status(400).json(stderr);
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