const fs = require('fs');

module.exports = {
    createDir: dir => {
        fs.mkdirSync(`./${dir}`);
    },
    createFile: (path, ext, content) => {
        fs.writeFileSync(path + ext, content)
    },
    removeDir: dir => {
        const files = fs.readdirSync(`./${dir}`);

        files.forEach(file => {
            fs.unlinkSync(`./${dir}/${file}`);
        });

        fs.rmdirSync(`./${dir}`);
    }
};