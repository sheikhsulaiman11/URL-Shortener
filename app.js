import express from 'express';
import mongoose from 'mongoose';
import {Url, User} from './models/url.js';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authMiddleware, redirectIfLoggedIn } from './middlewares/auth.js';
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
dotenv.config();
import multer from 'multer'; 
import path from 'path';


// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});



const upload = multer({ storage: storage }); // Multer middleware for handling file uploads


const app = express();  // Create Express app 
app.use(express.json());  // Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // Middleware to parse URL-encoded bodies
app.use(cookieParser());  // Middleware to parse cookies

app.set('view engine', 'ejs');  // Set EJS as the templating engine
app.use(express.static("public"));  // Serve static files from the "public" directory


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('mongoDB connected successfully'))
  .catch((err) => console.log(err));



// get login page
app.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('login', { error: null });
});


//get register page
app.get('/register', redirectIfLoggedIn, (req, res) => {
  res.render('register', { error: null });
});



//handle registration
app.post('/register', redirectIfLoggedIn, upload.single('avatar'), async (req, res) => {
  const { email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.render('register', { error: 'Email already exists. Please login.' });

  const hashed = await bcrypt.hash(password, 10);
  const user =await User.create({ email, password: hashed });
  
  const token = jwt.sign(       // Create JWT token with user ID as payload
    {userId: user._id},
    process.env.JWT_SECRET,    
    { expiresIn: '2h' }
  )
  res.cookie('token', token, { httpOnly: true, maxAge: 2 * 60 * 60 * 1000 });  // Set token in HTTP-only cookie
  res.redirect('/');
});



// handle login
app.post('/login', redirectIfLoggedIn, async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.render('login', { error: 'User not found.' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.render('login', { error: 'Invalid password.' });

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.cookie('token', token, { httpOnly: true, maxAge: 2 * 60 * 60 * 1000 });
  res.redirect('/');
});


// protected routes


// home page - list of urls
app.get('/', authMiddleware, async (req, res) => {
  const urls = await Url.find({ userId: req.user.userId });
  res.render('index', { urls });
});



// create new short url
app.post('/', authMiddleware, async (req, res) => {
  if (!req.body.fullUrl.startsWith('http')) {
    return res.status(400).send('Invalid URL');
  }
  const shortId = nanoid(6);
  await Url.create({ full: req.body.fullUrl, short: shortId, userId: req.user.userId });
  res.redirect('/');
});



// redirect to full url
app.get("/:shortId", async (req, res) => {
  const url = await Url.findOne({ short: req.params.shortId });
  if (!url) return res.sendStatus(404);
  res.redirect(url.full);
});



// app.listen(process.env.PORT, () => {
//   console.log(`Server is running on port ${process.env.PORT}`);
// });


//can use this on my phone
app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});