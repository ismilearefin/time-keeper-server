const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// Middleware..
app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster2.y3njyog.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){

    try{
        const productsCollection = client.db("timekeeper").collection("products")

        app.get('/categoris/:name', async(req, res)=>{
            const name = req.params.name;
            const query = {category : name}
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })


    }
    finally{

    }

}
run().catch((err)=>console.log(err))












app.get('/', (req, res)=> {
    res.send('server is running')
});

app.listen(port, ()=>{
    console.log(`Listing to port ${port}`)
});