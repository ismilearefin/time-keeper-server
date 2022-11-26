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
        const categoryCollection = client.db("timekeeper").collection("category")
        const productsCollection = client.db("timekeeper").collection("products")
        const usersCollection = client.db("timekeeper").collection("users")

        app.get('/categoris', async(req, res)=>{
            const query = {}
            const result = await categoryCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/categoris/:name', async(req, res)=>{
            const name = req.params.name;
            const query = {category : name}
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })
        // load product for advertise
        app.get('/allproducts/advertise', async(req, res)=>{
            const query = {}
            const result = await productsCollection.find(query).toArray()
            const remaning = result.filter(data => data?.advertise)
            res.send(remaning)
        })

// My Product ( query by email)
        app.get('/allproducts/myproducts',async (req, res)=>{
            const email = req.query.email;
            const query = {
                email : email
            };
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })
        
// My Order (load products from database)
        app.get('/allproducts', async(req, res)=>{
            const email = req.query.email;
            const query = {
                status : 'booked',
                user_email : email,
            };
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/users', async(req, res)=>{
            const email = req.query.email;
            const query = {email : email};
            const allusers = await usersCollection.find(query).toArray()
            res.send(allusers)
        })


        app.get('/users/allseller', async(req, res)=>{
            const query = {userRole : "Seller"};
            const allseller = await usersCollection.find(query).toArray()
            res.send(allseller)
        })
        app.get('/users/allbuyer', async(req, res)=>{
            const query = {userRole : "Buyer"};
            const allseller = await usersCollection.find(query).toArray()
            res.send(allseller)
        })



        app.post('/users', async(req, res)=>{
            const user = req.body;
            const query = {email : user.email};
            const userInfo = await usersCollection.find(query).toArray();
            if(userInfo.length){
                return res.send({message : 'already have this mail'})
            }
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        app.put('/allproducts/:email', async(req, res)=>{
            const email = req.params.email;
            const filter = { email : email};
            const option = {upsert : true};
            const updatedDoc = {
                $set: {
                    user_status : 'verified'
                }
            }
            const result = await productsCollection.updateMany(filter, updatedDoc, option);
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
    ////////update product with Booked info    ///////////////////////////////////////////////////////////
        app.put('/allproducts/:id', async(req, res)=>{
            const id = req.params.id;
            const orderInfo = req.body;
            const query = {}
            const alreadybooked = await productsCollection.find(query).toArray()
            const isbooked = alreadybooked.find((data)=> data.status)
            if(isbooked.length){
                return res.send({acknowledged : false})
            }
            const filter = {_id : ObjectId(id)};
            const option = {upsert : true};
            const updatedProduct = {
                $set : {
                    status : 'booked',
                    user_email : orderInfo.email,
                    user_num : orderInfo.number,
                    meeting_location : orderInfo.location
                }
            }
            const result = await productsCollection.updateOne(filter, updatedProduct,option);
            res.send(result)
        })
        //// update product with advertise mood
        app.put('/allproducts/advertise/:id', async(req, res)=>{
            const id = req.params.id;
            const filter = { _id : ObjectId(id)};
            const option = {upsert : true};
            const updatedDoc = {
                $set: {
                    advertise : 'ON'
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, option);
            res.send(result)
        })



///////////////////////////////////////////////////////////
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
        app.delete('/allproducts/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)}
            const result = await productsCollection.deleteOne(query);
            res.send(result)
        })

        app.delete('/users/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)}
            const result = await usersCollection.deleteOne(query);
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