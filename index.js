const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) =>{
    res.send('SERVER IS RUNNING......')
});

app.listen(port, () => {
    console.log(`server is running from ${port}`);
})