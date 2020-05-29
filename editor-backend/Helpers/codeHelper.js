const fs = require('fs');

module.exports = {
    createFile: (filename, ext, content) => {
        return new Promise((resolve, reject) => {
            fs.writeFile(filename + ext, content, err => {
                if (err)
                    reject(err);
                resolve(`${filename} created`);
            });
        });
    },

    removeFile: (filename, ext, stderr) => {
        return new Promise((resolve, reject) => {
            //out file will not be generated when error occurs.s
            if (stderr)
                resolve('No need to delete out file');
                
            fs.unlink(filename + ext, err => {
                if (err) reject(err);
                resolve(`${filename} removed`);
            });
        });
    }
};