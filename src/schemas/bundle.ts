import * as mongoose from 'mongoose';

export const BundleSchema = new mongoose.Schema({
    teacher_id: mongoose.Schema.Types.ObjectId,
    course_id: mongoose.Schema.Types.ObjectId,
    auto_id: Number,
    bundle_title: String,
    bundle_title_ch: String,
    number_of_sessions: Number,
    session_length: String,
    min_students_per_session: Number,
    max_students_per_session: Number,
    tuition: Number,
    date_time: [{
        date: String,
        time: String
    }],
    is_feature: {
        type: Boolean,
        default: false
    },
    tim_zone: String,
    number_of_bundles: Number,
    cancel_policy: String,
    membership:Boolean,
    show_on_front:Boolean

});