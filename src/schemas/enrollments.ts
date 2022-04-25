import * as mongoose from 'mongoose';

export const EnrollmentsSchema = new mongoose.Schema({
    student: mongoose.Schema.Types.ObjectId,
    student_family: mongoose.Schema.Types.ObjectId,
    teacher: mongoose.Schema.Types.ObjectId,
    course: mongoose.Schema.Types.ObjectId,
    lesson: mongoose.Schema.Types.ObjectId,
    session: mongoose.Schema.Types.ObjectId,
    session_auto_id: Number,

    student_name: String,
    student_family_name: String,
    teacher_name: String,
    course_name: String,
    
    date: Date,
    state: Number,
    auto_id: Number,
    transaction: mongoose.Schema.Types.ObjectId,
    price:Number,
    realPay:Number
});