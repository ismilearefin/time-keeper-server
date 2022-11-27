const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const { query } = require('express');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRECT);



// Middleware..
app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster2.y3njyog.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// JWT verify middleware

// function verifyJWT(req, res, next){
//     const authHeader = req.headers.authorization
//     if(!authHeader){
//         res.status(401).send('unauthorizes access');
//     }
//     const token = authHeader.split(' ')[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
//         if(err){
//             return res.status(403).send({message : 'forbidden access'})
//         }
//         req.decoded = decoded;
//         next();
//     })
// }




async function run(){

    try{
        const categoryCollection = client.db("timekeeper").collection("category");
        const productsCollection = client.db("timekeeper").collection("products");
        const usersCollection = client.db("timekeeper").collection("users");
        const paymentCollection = client.db("timekeeper").collection("payments");

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

// My Product ( query by email) , verifyJWT
        app.get('/allproducts/myproducts',async (req, res)=>{
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;
            // if(email  !==  decodedEmail){
            //     return res.status(403).send({message : 'forbidden access'})
            // }
            const query = {
                email : email
            };
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })
        
// My Order (load products from database)
        app.get('/allproducts/order',async(req, res)=>{
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;
            // if(email  !==  decodedEmail){
            //     return res.status(403).send({message : 'forbidden access'})
            // }
            const query = {
                status : 'booked',
                buyer_email : email,
            };
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })
// reported Items
        app.get('/allproducts/report', async(req, res)=>{
            const query = {
                product_status : 'reported'
            }
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })
// for payment ...
        app.get('/allproducts/payment/:id',async(req, res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id)};
            const product = await productsCollection.findOne(query);
            res.send(product)
        })


// get all user for conditional menu bar
        app.get('/users',async(req, res)=>{
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;
            // if(email  !==  decodedEmail){
            //     return res.status(403).send({message : 'forbidden access'})
            // }
            const query = {email : email};
            const allusers = await usersCollection.find(query).toArray()
            res.send(allusers)
        })

//get all seller info
        app.get('/users/allseller',async(req, res)=>{
            const query = {userRole : "Seller"};
            const allseller = await usersCollection.find(query).toArray()
            res.send(allseller)
        })
//get all buyer info        
        app.get('/users/allbuyer',async(req, res)=>{
            const query = {userRole : "Buyer"};
            const allseller = await usersCollection.find(query).toArray()
            res.send(allseller)
        })

//payment info save in DB.....
        app.post('/create-payment-intent', async(req,res)=>{
            const data = req.body;
            const price = data.resale_price;
            const amount = price*100
            const paymentIntent = await stripe.paymentIntents.create({
                
                currency: "usd",
                amount: amount,
                "payment_method_types" : [
                    "card"
                ]
                });
                
                res.send({
                    clientSecret: paymentIntent.client_secret,
                });
            });
        
        app.post('/payments', async(req, res)=>{
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment);
            const id = payment.paymentId
            const filter = {_id : ObjectId(id)}
            const updatedDoc = {
                $set:{
                    paid : true,
                    transactionId : payment.transactionId
                }
            }
            const updateResult = await productsCollection.updateOne(filter,updatedDoc)
            res.send(result)
        })    



// JWT token verify with email
        app.get('/jwt', async(req, res)=> {
            const email = req.query.email;
            const query = {email : email}
            const user = await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '10h'})
                return res.send({accessToken: token});
            }
            res.status(403).send({accessToken: ''})
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

        app.post('/allproducts',async(req, res)=>{
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result)
        })
/// products verify update...................
        app.put('/allproducts/verify/:email', async(req, res)=>{
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

        app.get('/allproducts', async(req, res)=> {
            const query ={}
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })

    ////////update product with Booked info    ///////////////////////////////////////////////////////////
        app.put('/allproducts/booked/:id', async(req, res)=>{
            const id = req.params.id;
            const orderInfo = req.body;
            // console.log(orderInfo)
            const query = {
                _id : ObjectId(id)
            }
            const alreadybooked = await productsCollection.find(query).toArray()
            const isbooked = alreadybooked.find((data)=> data?.status)
            // console.log(isbooked)
            if(isbooked){
                return res.send({acknowledged : false})
            }
            const filter = { _id : ObjectId(id) };
            const option = { upsert : true };
            const updatedProduct = {
                $set : {
                    status :'booked',
                    buyer_email : orderInfo.buyer_email,
                    buyer_num : orderInfo.number,
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

        app.put('/allproducts/report/:id', async(req, res)=>{
            const id = req.params.id;
            const filter = {_id : ObjectId(id)};
            const option = {upsert : true};
            const updatedDoc = {
                $set: {
                    product_status : 'reported'
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, option);
            res.send(result)
        })



///////////////////////////////////////////////////////////
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