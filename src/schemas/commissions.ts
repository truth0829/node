import * as mongoose from 'mongoose';

export const CommissionSchema = new mongoose.Schema({
    student_family: mongoose.Schema.Types.ObjectId,
    date: Date,
    amount:Number,
});