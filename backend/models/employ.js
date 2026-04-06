import mongoose from "mongoose";

const employSchema = mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    isOnProject: {
        type: Boolean,
        default: false
    },
    experience: {
        type: Number,
        required: true
    },
    completed: {
        type: Number,
        required: true
    },
    description: String,
}, { timestamps: true });

const Employ = mongoose.model("employ", employSchema); // ✅ match ref

export default Employ;