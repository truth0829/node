import * as mongoose from 'mongoose';

export const ReviewsSchema = new mongoose.Schema({
    auto_id: Number,
    from: mongoose.Schema.Types.ObjectId,
    to: mongoose.Schema.Types.ObjectId,
    from_showname: String,
    date: Date,
    message: String,
    type: Number,
    stars: Number
});