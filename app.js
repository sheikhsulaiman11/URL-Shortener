import express from 'express';
import mongoose from 'mongoose';
import {Url, User} from './models/url.js';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import  jwt  from 'jsonwebtoken';
import authMiddleware from './middlewares/auth.js';

import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('mongoDB connected  successfully'))
.catch((err) => console.log(err));   

// user registration 
app.post('/register', async (req, res) => {
    const {email, password} = req.body;

    const hashed = await bcrypt.hash(password, 10);

    await User.create({email, password: hashed});

    res.redirect('/');
})

//user login
app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    const user = await User.findOne({email});
    if (!user) return res.status(400).send('user not found');
    
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(400) .send ('invalid password');

    
    const token = jwt.sign(
        { userId: user._id},
        process.env.JWT_SECRET,
        {expiresIn: '2 hours'}
    );
    
    res.cookie('token', token);
    res.send('logged in successfully');
    res.redirect('/');

})    


app.get('/', async (req, res) => {
   
    const urls = await Url.find();
    res.render('index', { urls });  
})



app.get("/", authMiddleware, (req, res) => {
  res.send("welcome to the protected route, user ID: " + req.user.userId);
});



app.post('/', async (req, res) => {
    
         if (!req.body.fullUrl.startsWith('http')) {
        return res.status(400).send('Invalid URL');
    }
    const shortId = nanoid(6);

    await Url.create({
        full: req.body.fullUrl,
        short: shortId
    })
    res.redirect('/');
});


app.get("/:shortId", async (req, res) => {
    const url = await Url.findOne({ short: req.params.shortId})
    
    if (!url) res.sendStatus(404)

    await url.save();
    res.redirect(url.full);
})

app.listen(process.env.PORT, () => {
    console.log (`server is running on ${process.env.PORT}`)
})