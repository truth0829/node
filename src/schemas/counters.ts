import * as mongoose from 'mongoose';

export const CountersSchema = new mongoose.Schema({
    _id: String,
    sequence_value: Number
});