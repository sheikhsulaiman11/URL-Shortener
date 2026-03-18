import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
    full: {
        type: String, 
        required: true
    },

    short :{
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
  }
})

const userSchema = new mongoose.Schema({
   email: {
        type: String, 
        required: true
    },

    password :{
        type: String,
        required: true,
    },
});


const Url = mongoose.model("Url", urlSchema);
const User = mongoose.model("User", userSchema);

export { Url, User };