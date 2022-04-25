import * as mongoose from 'mongoose';

export const BundleEnrollmentsSchema = new mongoose.Schema({
    student: mongoose.Schema.Types.ObjectId,
    student_family: mongoose.Schema.Types.ObjectId,
    teacher: mongoose.Schema.Types.ObjectId,
    course: mongoose.Schema.Types.ObjectId,
    bundle: mongoose.Schema.Types.ObjectId,
    student_name: String,
    student_family_name: String,
    teacher_name: String,
    course_name: String,
    date: Date,
    state: Number,
    auto_id: Number,
    price:Number,
    realPay:Number
});