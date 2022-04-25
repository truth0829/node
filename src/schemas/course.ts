import * as mongoose from 'mongoose';

export const CourseSchema = new mongoose.Schema({
    id: String,
    state: Number,
    topic: String,
    topic_ch: String,
    description: String,
    description_ch: String,   
    default_sessions: [String],    
    language: String,
    date: Date,
    thumbnail: String,
    language_skill: Number,
    skill: String,
    skill_level: Number,   
    min_age: {
        type: Number,
        default: 1
    },
    max_age: {
        type: Number,
        default: 99
    },
    provider: {
        type: String,
        default: 'zoom'
    },
    auto_id: Number,
    category: String,
    material: String,
    school_id: mongoose.Schema.Types.ObjectId,
    is_mini_app: {
        type: Boolean,
        default: false
    },
    promoter_picture:String,
});