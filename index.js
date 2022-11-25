const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const { query } = require('express');
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
        const bookedproductCollection = client.db("timekeeper").collection("bookedProduct")
        const usersCollection = client.db("timekeeper").collection("users")


        app.get('/categoris/:name', async(req, res)=>{
            const name = req.params.name;
            const query = {category : name}
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })

// My Product ( query by email)
        app.get('/myproducts',async (req, res)=>{
            const email = req.query.email;
            const query = {email : email};
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })
        
        
        
        
// My Order (load products from database)
        app.get('/bookedproduct', async(req, res)=>{
            const email = req.query.email;
            const query = {email : email};
            const result = await bookedproductCollection.find(query).toArray()
            res.send(result)
        })


        app.post('/users', async(req, res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        // app.put('/users/:id', async(req, res)=>{
        //     const id = req.params.id
        //     const filter = {
        //         _id : ObjectId(id),
        //         email : "ismilearefin@gmail.com"
        //     };
        //     const options = {upsert : true};
        //     const updateDoc = {
        //         $set : {
        //             userRole : 'Admin'
        //         }
        //     }
        //     const result = await usersCollection.updateOne(filter, updateDoc, options);
        //     res.send(result)
        // })

        app.post('/allproducts',async(req, res)=>{
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result)
        })


        app.post('/bookedproduct', async(req, res)=>{
            const product = req.body;
            console.log(product);
            const query = {_id : product._id}
            const alreadybooked = await bookedproductCollection.find(query).toArray()
            if(alreadybooked.length){
                return res.send({acknowledged : false})
            }
            const result = await bookedproductCollection.insertOne(product)
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