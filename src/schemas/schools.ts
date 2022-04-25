import * as mongoose from 'mongoose';

export const SchoolsSchema = new mongoose.Schema({
    auto_id: Number,
    name: String,
    admin: mongoose.Schema.Types.ObjectId
});