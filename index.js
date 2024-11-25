const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;

const uri = `mongodb+srv://${user}:${pass}@cluster0.zee3o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const jobsCollection = client.db('soloSphere').collection('jobs')
        const bidsCollection = client.db('soloSphere').collection('bids')

        //get all jobs data from DB
        app.get('/jobs', async(req, res) => {
            const result = await jobsCollection.find().toArray();
            res.send(result)
        })
        
        //get single jobs data form DB
        app.get('/job/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id : new ObjectId(id)}
            const result = await jobsCollection.findOne(query);
            res.send(result);
        })


        //save bid data in DB
        app.post('/bid', async (req, res) => {
            const bidData = req.body;
            const result = await bidsCollection.insertOne(bidData);
            res.send(result);
        })

        //get all bids for a user by email
        app.get('/my-bid/:email', async(req, res) => {
            const email = req.params.email;
            const query = {formEmail : email};
            const result = await bidsCollection.find(query).toArray();
            res.send(result)
        })

        //get all bids for buyer
        app.get('/buyer-bid/:email', async(req, res) => {
            const email = req.params.email;
            const query = {buyer_Email : email};
            const result = await bidsCollection.find(query).toArray();
            res.send(result)
        })

        //save a job data in DB
        app.post('/jobs', async (req, res) => {
            const jobData = req.body;
            const result = await jobsCollection.insertOne(jobData);
            res.send(result)
        })

        //get all jobs data by specific user
        app.get('/jobs/:email', async (req, res) => {
            const email = req.params.email;
            const query = {"buyer.email" : email}
            const result = await jobsCollection.find(query).toArray()
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
    }
}
run().catch(console.dir);


app.get('/', (req, res) =>{
    res.send('SERVER IS RUNNING......')
});

app.listen(port, () => {
    console.log(`server is running from ${port}`);
});