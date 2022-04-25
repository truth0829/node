import * as mongoose from 'mongoose';

export const LessonSchema = new mongoose.Schema({
    subtitle: String,
    subtitle_ch: String,
    state: Number,
    sessions: [{
        auto_id: Number,
        _id: mongoose.Schema.Types.ObjectId,
        endTime: String,
        startTime: String,
        state: Number,
        subject: String,
        subject_ch: String,
        toCreateZoomMeeting: Boolean,
        zoomId: String,
        zoomPassword: String,
        zoomMeetingHost: String,
        zoomUrl: String,
        notes: String,
        materials: {
            type: [mongoose.Schema.Types.ObjectId],
            default: []
        }
    }],
    credits_per_session: Number,    
    teacher_id: mongoose.Schema.Types.ObjectId,
    course_id: mongoose.Schema.Types.ObjectId,
    auto_id: Number,
    show_on_front:Boolean,
    session_duration: String,
    total_sessions: Number,
    max_students: Number,
});