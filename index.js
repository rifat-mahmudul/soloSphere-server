const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors({
    origin : ['http://localhost:5173'],
    credentials : true
}));
app.use(express.json());
app.use(cookieParser());

//verify jwt middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    if(!token){
        return res.status(401).send({message : "unauthorized access"})
    }
    if(token){
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRETE, (err, decoded) => {
            if(err){
                console.log(err)
                res.status(401).send({message : "unauthorized access"})
                return
            }
            console.log(decoded);
            req.user = decoded;
            next();
        })
    }
}


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

        //Todo:jwt generate in this application
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRETE, {expiresIn : '365d'});
            res
            .cookie('token', token, {
                httpOnly : true,
                secure : process.env.NODE_ENV === 'production',
                sameSite : process.env.NODE_ENV === 'production' ? "none" : 'strict'
            })
            .send({success : true});
        })

        //? clear token on logOut
        app.get('/logout', (req, res) => {
            res
            .clearCookie('token', {
                httpOnly : true,
                secure : process.env.NODE_ENV === 'production',
                sameSite : process.env.NODE_ENV === 'production' ? "none" : 'strict',
                maxAge : 0
            })
            .send({success : true});
        })


        //get all jobs data from DB
        app.get('/jobs', async(req, res) => {
            const result = await jobsCollection.find().toArray();
            res.send(result)
        })

        //get all jobs data from DB for pagination
        app.get('/all-jobs', async(req, res) => {
            const size = parseInt(req.query.size);
            const page = parseInt(req.query.page) - 1;
            const filter = req.query.filter;

            let query = {};
            if(filter){
                query = {category : filter}
            }

            const result = await jobsCollection.find(query).skip(page * size).limit(size).toArray();
            res.send(result)
        })

        //get all jobs data from DB for count
        app.get('/jobs-count', async(req, res) => {
            const filter = req.query.filter;
            let query = {};
            if(filter){
                query = {category : filter}
            }
            const count = await jobsCollection.countDocuments(query);
            res.send({count})
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

        //update Bid status
        app.patch('/bid/:id', async(req, res) => {
            const id = req.params.id;
            const status = req.body;
            const query = {_id : new ObjectId(id)}
            const updateDoc = {
                $set : status,
            }
            const result = await bidsCollection.updateOne(query, updateDoc)
            res.send(result);
        })

        //save a job data in DB
        app.post('/jobs', async (req, res) => {
            const jobData = req.body;
            const result = await jobsCollection.insertOne(jobData);
            res.send(result)
        })

        //get all jobs data by specific user
        app.get('/jobs/:email', verifyToken, async (req, res) => {
            const tokenEmail = req.user.email;
            const email = req.params.email;

            if(tokenEmail !== email){
                return res.status(403).send({message : "unauthorized access"})
            }

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