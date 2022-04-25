import * as mongoose from 'mongoose';
import * as passportLocalMongoose from 'passport-local-mongoose';
import * as uuid from 'uuid/v1';

export enum UserType{
    Teacher = 1,
    Student = 2,
    UnApprovedTeacher = 3,
    SchoolAdmin = 4,
    SuperAdmin = 5
  }

export const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    emailVerified: {
        type: String,
        default: () => uuid()
    },
    name: String,

    wechatOpenId: String,

    password: {
        type: String,
        select: false
    },
    passwordRequest: {
        type: String,
        select: false
    },
    phone: String,
    phoneVerified: {
        type: Boolean,
        default: false
    },
    smsCode:String,
    smsDate: Date,
    date: Date,
    type: Number,
    auto_id: Number,
    balance: Number,
    free_balance:Number,
    wechat: String,
    facebook: String,
    classin: String,

    // Teacher
    profile_picture: String,
    introduction: String,
    introduction_ch: String,
    courses_offering: Number,
    status: Number,
    zoomId: String,
    resume: String,
    is_feature: {
        type: Boolean,
        default: false
    },
    is_retired: {
        type: Boolean,
        default: false
    },
    school: mongoose.Schema.Types.ObjectId,

    // Student
    children: [{
        id: String,
        name: String,
        age: Number
    }],
    refer_friends: [{
        id: mongoose.Schema.Types.ObjectId,
        username: String,
        email: String,
        phoneVerified: Boolean
    }],
    referer_id: String,
    promotor:{
        type: Boolean,
        default: false
    },
    promotorRate:Number,
    promoter_id:Number,
    registerByPromoterId:Number
}, {
    toObject: {
        transform: (doc, ret) => {
            ret['emailVerified'] = !ret['emailVerified'];

            return ret;
        }
    }
});

UserSchema.plugin(passportLocalMongoose);