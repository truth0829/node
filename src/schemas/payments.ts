import * as mongoose from 'mongoose';

export const PaymentsSchema = new mongoose.Schema({
    auto_id: Number,
    amount: Number,
    create_time: Date,
    currency: String,
    payment_id: String,
    payment_type: String,
    client_secret: String,
    status: String,
    update_time: Date,
    user_id: mongoose.Schema.Types.ObjectId
});

export enum PaymentType {
    PayPal = 'PayPal',
    WeChat = 'WeChat',
    AliPay = 'AliPay'
}