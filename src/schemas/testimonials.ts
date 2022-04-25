import * as mongoose from 'mongoose';

export const TestimonialSchema = new mongoose.Schema({
    id: String,
    name: String,
    testimony: String,
    language: String
});