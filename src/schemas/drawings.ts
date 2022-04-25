import * as mongoose from 'mongoose';

export const DrawingsSchema = new mongoose.Schema({
    auto_id: Number,
    course_id: mongoose.Schema.Types.ObjectId,
    lesson_id: mongoose.Schema.Types.ObjectId,
    session_id: mongoose.Schema.Types.ObjectId,
    uploaded_by: mongoose.Schema.Types.ObjectId,
    date: Date,
    url: String
});