const router = require('express').Router();
const fs = require('fs');
const { exec } = require('child_process');
const codeHelper = require('../Helpers/codeHelper');

router.post('/run', (req, res) => {
    //req.body items
    let code = req.body.code;
    let input = req.body.input;
    let id = req.body.id;
    let lang = req.body.lang;

    // Extension of source code file
    const sourceExt = {
        'cpp': '.cpp',
        'java': '.java'
    }
    // Compile and run command
    const command = {
        'cpp': `cd ${id} && g++ Main.cpp -o out && ./out < input.txt`,
        'java': `cd ${id} && javac Main.java && java Main < input.txt`
    }

    // Step 1: Make unique directory and 2 files inside directory and copy source code and input to it. 
    codeHelper.createDir(id);
    const sourceFile = codeHelper.createFile(`./${id}/Main`, sourceExt[lang], code);
    const inputFile = codeHelper.createFile(`./${id}/input`, '.txt', input);

    // Step 2: Execute child process to generate output
    // exec opens a new terminal and executes the command
    exec(command[lang], (error, stdout, stderr) => {
        //Step 3: Delete directory
        codeHelper.removeDir(id);

        if (stderr) {
            // 400 error status because of bad request(code variable is not valid)
            res.status(400).json(stderr);
        }
        else
            res.send(stdout);
    });
});

module.exports = router;