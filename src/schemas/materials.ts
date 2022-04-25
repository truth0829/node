import * as mongoose from 'mongoose';

export const MaterialsSchema = new mongoose.Schema({
    auto_id: Number,
    date: Date,
    description: String,
    url: String
});