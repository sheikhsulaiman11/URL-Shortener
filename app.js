import express from 'express';
import mongoose from 'mongoose';
import Url from './models/url.js';
import { nanoid } from 'nanoid';

import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');


mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('mongoDB connected  successfully')).catch((err) => console.log(err));   


app.get('/', async (req, res) => {
    const urls = await Url.find();
    res.render('index', { urls });  
})



app.post('/', async (req, res) => {
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