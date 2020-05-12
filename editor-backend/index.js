const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const codeRunRouter = require('./Routes/codeRun');

const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use('/code', codeRunRouter);

app.listen(PORT, () => console.log(`server started on port ${PORT}`));