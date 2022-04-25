import * as mongoose from 'mongoose';
import { ObjectId } from 'bson';

export const TransactionsSchema = new mongoose.Schema({
    auto_id: Number,
    date: Date,
    debit_user: mongoose.Schema.Types.ObjectId || Number,
    debit_type: Number,
    debit_amount: Number,
    credit_user: mongoose.Schema.Types.ObjectId || Number,
    credit_type: Number,
    credit_amount: Number,
    type: Number,
    notes: String,
    payment_id: mongoose.Schema.Types.ObjectId,
    free_credit:Number

});

export enum TransactionType{
    Enrollment = 1,
    CancelEnrollment = 2,
    CompleteEnrollment = 3,
    PurchaseInternalCredit = 4,
    PurchaseCurrency = 5,
    AdminModification = 6
}
  
export enum TransactionValueType{
    InternalCredit = 1,
    USD = 2,
    RMB = 3
}
  
export enum TransactionUserType{
    System = 0
}
  
export interface Transaction{
    _id?: string;
    auto_id?: number;
    date?: string;
    debit_user: string | TransactionUserType;
    debit_type: TransactionValueType;
    debit_amount: number;
    credit_user: string | TransactionUserType;
    credit_type: TransactionValueType;
    credit_amount: number;
    type: TransactionType;
    notes: string;  
    payment_id?: ObjectId; // only for paypal payments
    free_credit?:number;
}

export enum State{
    Canceled = 0,
    Active = 1,
    Completed = 2
}
  