import * as mongoose from 'mongoose';

export const HomeworksSchema = new mongoose.Schema({
    auto_id: Number,
    course_id: mongoose.Schema.Types.ObjectId,
    user_id: mongoose.Schema.Types.ObjectId,
    date: Date,
    url: String
});