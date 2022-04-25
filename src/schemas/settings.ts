import * as mongoose from 'mongoose';

export const SettingsSchema = new mongoose.Schema({
    type: String,
    featured: mongoose.Schema.Types.ObjectId,
    loginText: String,
    promotions: [String],
    social: {
        facebook: String,
        instagram: String,
        linkedin: String,
        twitter: String,
        youtube: String
    },
    title: String,
    title_ch: String,
    titleItems: [String],
    categories: [String],
    // categories
    new_categories: [{
        id: String,
        name: String,
        picture: String
    }],
    skills: [String],
    creditsToPurchase: [Number],
    promoterRate: [Number],
    images: [{src: String, date: Date}],
    fees: {
        bronze: Number,
        silver: Number,
        gold: Number
    },
    pricePerCredit: Number
});