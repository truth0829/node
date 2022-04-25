import * as mongoose from 'mongoose';

export const CommentsSchema = new mongoose.Schema({
    from: mongoose.Schema.Types.ObjectId,
    to: mongoose.Schema.Types.ObjectId,
    name: String,
    message: String,
    date: Date,
    auto_id: Number
});