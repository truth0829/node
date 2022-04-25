import * as mongoose from 'mongoose';

export const PartnerSchema = new mongoose.Schema({
    id: String,
    name: String,
    icon: String,
    description: String
});