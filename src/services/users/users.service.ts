import { ObjectId } from 'bson';
import { HelperService } from './../helper/helper.service';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';
import * as _ from 'lodash';
import * as uuid from 'uuid/v1';
import { Transaction, TransactionType, TransactionUserType, TransactionValueType } from "../../schemas/transactions";
import { TransactionsService } from "../transactions/transactions.service";
import * as moment from 'moment';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel('Users') private readonly userModel: Model<any>,
        @InjectModel('Commissions') private readonly commissionModel: Model<any>,
        private helperService: HelperService,
        private transactionsService: TransactionsService
    ) {
    }

    async getUsers(aggregatePipe: any = {}, ...pipes) {
        return await this.userModel.aggregate([{
            $match: aggregatePipe
        }, ...pipes])
    }

    async getBalanceUsersByPaginate(queryOption: any = {}, aggregatePipe: any = {}, ...pipes) {
        return await this.userModel.aggregate([{
            $match: aggregatePipe
        }, ...pipes])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit))
            .exec();

    }
    async getCommissions(id) {
        return await this.commissionModel
            .find({student_family: id }).exec();
    }
    async deleteCommision(id){
        return  await this.commissionModel.findByIdAndDelete(id);
    }

    async getNumberOfBalanceUsers(aggregatePipe: any = {}, ...pipes) {
        const result = await this.userModel.aggregate([{
            $match: aggregatePipe
        }, ...pipes]);
        return result.length;
    }

    async getUsersByPaginate(queryOption: any = {}, search_key: any = {}, school, userType, promoter) {
        if (promoter == true) {
            if (search_key.field === "" && search_key.value === "") {
                if (school != "") {
                    return await this.userModel
                        .find({
                            school: school,
                            type: userType,
                            promotor: promoter
                        }).sort({
                            // name: 'asc'
                            auto_id: 'asc'
                        })
                        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                        .limit(Number(queryOption.limit))
                        .exec();
                } else {
                    return await this.userModel
                        .find({ type: userType, promotor: promoter })
                        .sort({
                            // name: 'asc'
                            auto_id: 'asc'
                        })
                        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                        .limit(Number(queryOption.limit))
                        .exec();
                }
            } else {
                switch (search_key.field) {
                    case "student": {
                        return await this.userModel
                            // .find({'children.name': new RegExp('^' + search_key.value + '$', "i"), type: 2})
                            .find({ 'children.name': new RegExp(search_key.value, "i"), type: userType, promotor: promoter })
                            .sort({
                                // name: 'asc'
                                auto_id: 'asc'
                            })
                            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                            .limit(Number(queryOption.limit))
                            .exec();
                    }
                    case "parent": {
                        return await this.userModel
                            .find({ name: new RegExp(search_key.value, "i"), type: userType, promotor: promoter })
                            .sort({
                                // name: 'asc'
                                auto_id: 'asc'
                            })
                            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                            .limit(Number(queryOption.limit))
                            .exec();
                    }
                    case "email": {
                        return await this.userModel
                            // .find({email: new RegExp('^' + search_key.value + '$', "i")})
                            .find({ email: new RegExp(search_key.value, "i"), type: userType, promotor: promoter })
                            .sort({
                                // name: 'asc'
                                auto_id: 'asc'
                            })
                            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                            .limit(Number(queryOption.limit))
                            .exec();
                    }
                    case "phone": {
                        return await this.userModel
                            // .find({email: new RegExp('^' + search_key.value + '$', "i")})
                            .find({ phone: new RegExp(search_key.value, "i"), type: userType, promotor: promoter })
                            .sort({
                                // name: 'asc'
                                auto_id: 'asc'
                            })
                            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                            .limit(Number(queryOption.limit))
                            .exec();
                    }
                    case "teacher": {
                        return await this.userModel
                            .find({
                                // name: new RegExp('^' + search_key.value + '$', "i"),
                                name: new RegExp(search_key.value, "i"),
                                type: userType,
                                promotor: promoter
                            })
                            .sort({
                                // name: 'asc'
                                auto_id: 'asc'
                            })
                            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                            .limit(Number(queryOption.limit))
                            .exec();
                    }
                    case "promoter_id": {
                        var prompterID;
                        if (isNaN(parseInt(search_key.value))) {
                            prompterID = 0;
                        }
                        else {
                            prompterID = parseInt(search_key.value);
                        }
                        return await this.userModel
                            .find({
                                // name: new RegExp('^' + search_key.value + '$', "i"),
                                promoter_id: prompterID,
                                type: userType,
                                promotor: promoter
                            })
                            .sort({
                                // name: 'asc'
                                auto_id: 'asc'
                            })
                            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                            .limit(Number(queryOption.limit))
                            .exec();
                    }
                    case "type": {
                        const user_type = search_key.value.toLowerCase();

                        if (user_type === "student") {
                            return await this.userModel
                                .find({ type: 2, promotor: promoter })
                                .sort({
                                    // name: 'asc'
                                    auto_id: 'asc'
                                })
                                .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                                .limit(Number(queryOption.limit))
                                .exec();
                        }
                        else if (user_type === "teacher") {
                            return await this.userModel
                                .find({ type: [1, 3], promotor: promoter })
                                .sort({
                                    // name: 'asc'
                                    auto_id: 'asc'
                                })
                                .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                                .limit(Number(queryOption.limit))
                                .exec();
                        }
                        else if (user_type.includes("admin")) {
                            return await this.userModel
                                .find({ type: [4, 5], promotor: promoter })
                                .sort({
                                    auto_id: 'asc'
                                })
                                .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                                .limit(Number(queryOption.limit))
                                .exec();
                        } else {
                            return [];
                        }
                    }
                }
            }
        }
        else {
            if (search_key.field === "" && search_key.value === "") {
                if (school != "") {
                    return await this.userModel
                        .find({
                            school: school,
                            type: userType
                        }).sort({
                            // name: 'asc'
                            auto_id: 'asc'
                        })
                        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                        .limit(Number(queryOption.limit))
                        .exec();
                } else {
                    return await this.userModel
                        .find({ type: userType })
                        .sort({
                            // name: 'asc'
                            auto_id: 'asc'
                        })
                        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                        .limit(Number(queryOption.limit))
                        .exec();
                }
            } else {
                switch (search_key.field) {
                    case "student": {
                        return await this.userModel
                            // .find({'children.name': new RegExp('^' + search_key.value + '$', "i"), type: 2})
                            .find({ 'children.name': new RegExp(search_key.value, "i"), type: userType })
                            .sort({
                                // name: 'asc'
                                auto_id: 'asc'
                            })
                            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                            .limit(Number(queryOption.limit))
                            .exec();
                    }
                    case "parent": {
                        return await this.userModel
                            .find({ name: new RegExp(search_key.value, "i"), type: userType })
                            .sort({
                                // name: 'asc'
                                auto_id: 'asc'
                            })
                            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                            .limit(Number(queryOption.limit))
                            .exec();
                    }
                    case "email": {
                        return await this.userModel
                            // .find({email: new RegExp('^' + search_key.value + '$', "i")})
                            .find({ email: new RegExp(search_key.value, "i"), type: userType })
                            .sort({
                                // name: 'asc'
                                auto_id: 'asc'
                            })
                            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                            .limit(Number(queryOption.limit))
                            .exec();
                    }
                    case "phone": {
                        return await this.userModel
                            // .find({email: new RegExp('^' + search_key.value + '$', "i")})
                            .find({ phone: new RegExp(search_key.value, "i"), type: userType })
                            .sort({
                                // name: 'asc'
                                auto_id: 'asc'
                            })
                            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                            .limit(Number(queryOption.limit))
                            .exec();
                    }
                    case "teacher": {
                        return await this.userModel
                            .find({
                                // name: new RegExp('^' + search_key.value + '$', "i"),
                                name: new RegExp(search_key.value, "i"),
                                type: userType
                            })
                            .sort({
                                // name: 'asc'
                                auto_id: 'asc'
                            })
                            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                            .limit(Number(queryOption.limit))
                            .exec();
                    }
                    case "promoter_id": {
                        var prompterID;
                        if (isNaN(parseInt(search_key.value))) {
                            prompterID = 0;
                        }
                        else {
                            prompterID = parseInt(search_key.value);
                        }
                        return await this.userModel
                            .find({
                                // name: new RegExp('^' + search_key.value + '$', "i"),
                                promoter_id: prompterID,
                                type: userType
                            })
                            .sort({
                                // name: 'asc'
                                auto_id: 'asc'
                            })
                            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                            .limit(Number(queryOption.limit))
                            .exec();
                    }
                    case "type": {
                        const user_type = search_key.value.toLowerCase();

                        if (user_type === "student") {
                            return await this.userModel
                                .find({ type: 2 })
                                .sort({
                                    // name: 'asc'
                                    auto_id: 'asc'
                                })
                                .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                                .limit(Number(queryOption.limit))
                                .exec();
                        }
                        else if (user_type === "teacher") {
                            return await this.userModel
                                .find({
                                    $or: [{ type: 1 }, { type: 3 }]
                                })
                                .sort({
                                    // name: 'asc'
                                    auto_id: 'asc'
                                })
                                .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                                .limit(Number(queryOption.limit))
                                .exec();
                        }
                        else if (user_type.includes("admin")) {
                            return await this.userModel
                                .find({
                                    $or: [{ type: 4 }, { type: 5 }]
                                })
                                .sort({
                                    // name: 'asc'
                                    auto_id: 'asc'
                                })
                                .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                                .limit(Number(queryOption.limit))
                                .exec();
                        } else {
                            return [];
                        }
                    }
                }
            }
        }


    }

    async getNumberOfUsers(search_key: any = {}, school, userType, promoter) {
        if (promoter == true) {
            if (search_key.field === "" && search_key.value === "") {
                if (school != "") {
                    return await this.userModel.find({
                        school: school,
                        type: userType,
                        promotor:promoter
                    }).countDocuments();
                } else {
                    return await this.userModel.find({
                        type: userType,
                        promotor:promoter
                    }).countDocuments();
                }
            } else {
                switch (search_key.field) {
                    case "student": {
                        return await this.userModel
                            .find({ name: new RegExp(search_key.value, "i"), type: userType, promotor:promoter})
                            .countDocuments();
                    }
                    case "parent": {
                        return await this.userModel
                            .find({ name: new RegExp(search_key.value, "i"), type: userType,promotor:promoter })
                            .countDocuments();
                    }
                    case "email": {
                        return await this.userModel
                            .find({ email: new RegExp(search_key.value, "i"), type: userType,promotor:promoter })
                            .countDocuments();
                    }
                    case "teacher": {
                        return await this.userModel
                            .find({
                                name: new RegExp(search_key.value, "i"),
                                type: userType,
                                promotor:promoter
                            }).countDocuments();
                    }
                    case "type": {
                        const user_type = search_key.value.toLowerCase();
                        if (user_type === "student") {
                            return await this.userModel
                                .find({ type: userType,promotor:promoter })
                                .countDocuments();
                        }
                        else if (user_type === "teacher") {
                            return await this.userModel
                                .find({
                                    type: userType,
                                    promotor:promoter
                                }).countDocuments();
                        }
                        else if (user_type.includes("admin")) {
                            return await this.userModel
                                .find({
                                    type: userType,
                                    promotor:promoter
                                }).countDocuments();
                        } else {
                            return 0;
                        }
                    }
                }
            }
        }
        else {
            if (search_key.field === "" && search_key.value === "") {
                if (school != "") {
                    return await this.userModel.find({
                        school: school,
                        type: userType
                    }).countDocuments();
                } else {
                    return await this.userModel.find({
                        type: userType
                    }).countDocuments();
                }
            } else {
                switch (search_key.field) {
                    case "student": {
                        return await this.userModel
                            .find({ name: new RegExp(search_key.value, "i"), type: userType })
                            .countDocuments();
                    }
                    case "parent": {
                        return await this.userModel
                            .find({ name: new RegExp(search_key.value, "i"), type: userType })
                            .countDocuments();
                    }
                    case "email": {
                        return await this.userModel
                            .find({ email: new RegExp(search_key.value, "i"), type: userType })
                            .countDocuments();
                    }
                    case "teacher": {
                        return await this.userModel
                            .find({
                                name: new RegExp(search_key.value, "i"),
                                type: userType
                            }).countDocuments();
                    }
                    case "type": {
                        const user_type = search_key.value.toLowerCase();
                        if (user_type === "student") {
                            return await this.userModel
                                .find({ type: userType })
                                .countDocuments();
                        }
                        else if (user_type === "teacher") {
                            return await this.userModel
                                .find({
                                    type: userType
                                }).countDocuments();
                        }
                        else if (user_type.includes("admin")) {
                            return await this.userModel
                                .find({
                                    type: userType
                                }).countDocuments();
                        } else {
                            return 0;
                        }
                    }
                }
            }
        }

    }


    async getAdminUsersByPaginate(queryOption: any = {}) {
        return await this.userModel
            .find({
                $or: [{ type: 4 }, { type: 5 }]
            })
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit))
            .exec();

    }

    async getNumberOfAdminUsers() {
        return await this.userModel
            .find({
                $or: [{ type: 4 }, { type: 5 }],

            }).countDocuments();
    }

    async getFeatureTeachersByPaginate(queryOption: any = {}) {
        return await this.userModel
            .find({
                $or: [{ type: 1 }, { type: 3 }],
                is_feature: true
            })
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit))
            .exec();

    }

    async getNumberOfFeatureTeachers() {
        return await this.userModel
            .find({
                $or: [{ type: 1 }, { type: 3 }],
                is_feature: true
            }).countDocuments();
    }

    async getUserByUsername(username: string) {
        return await this.userModel.findOne({ username });
    }

    async getUserByPhone(phoneNumber: string) {
        return await this.userModel.find({
            phone: phoneNumber
        });
    }

    async getUserByPhoneandID(phoneNumber: string, id) {
        return await this.userModel.find({
            phone: phoneNumber,
            _id: {
                $ne: id
            }
        });
    }

    async getUserByWechatId(wechatOpenId) {
        return await this.userModel.findOne({ wechatOpenId });
    }

    async getUserByAutoId(auto_id: number) {
        return await this.userModel.findOne({ auto_id: auto_id });
    }

    async isFeature(id: string) {
        const user = await this.userModel.findById(id);
        if (user.is_feature) {
            return true;
        } else {
            return false;
        }
    }

    async getUserById(id: string) {
        return await this.userModel.findById(id);
    }

    async getUserByIdWithEmailKey(id: string) {
        return await this.userModel.aggregate([
            {
                $match: {
                    _id: new ObjectId(id)
                }
            }
        ]).then(v => _.first(v));
    }

    async getUserByPasswordCode(key: string) {
        return await this.userModel.findOne({ passwordRequest: key });
    }

    async requestPasswordReset(id: string,) {
        const key = uuid();
        await this.userModel.findByIdAndUpdate(id, {
            passwordRequest: key
        });
        return key;
    }

    async updatePasswordWithoutValidation(id, password) {
        return await this.userModel.findByIdAndUpdate(id, {
            password: await this.getHash(password),
            emailVerified: ''
        })
    }

    async updatePassword(id, password, newPassword) {
        const user = await this.userModel.findById(id);

        if (!await this.compareHash(user.username, password)) {
            throw Error('Your current password is invalid.');
        }

        return await this.userModel.findByIdAndUpdate(id, {
            $set: {
                password: await this.getHash(newPassword)
            }
        })
    }

    async updateWechatMiniAppPassword(id, password) {
        return await this.userModel.findByIdAndUpdate(id, {
            $set: {
                password: await this.getHash(password)
            }
        })
    }

    async updateUser(id, data) {
        const user = await this.userModel.findById(id);
        if (!user) {
            return;
        }

        if (data.children) {
            data.children = _.filter(data.children, v => v.age && !Number.isNaN(parseInt(v.age)) && v.name);
            // data.children = _.map(data.children, v => {
            //   if(!v.id)
            // })
        }

        delete data.password;
        delete data.email;
        delete data.username;

        return await this.userModel.findByIdAndUpdate(id, { $set: data }, { new: true })

        // return await this.userModel.findById(id);
    }

    async upLoadresume(id, data) {
        const user = await this.userModel.findById(id);
        if (!user) {
            return;
        }

        return await this.userModel.findByIdAndUpdate(id, { $set: data }, { new: true })

        // return await this.userModel.findById(id);
    }

    async addReferFriend(id, data) {
        const user = await this.userModel.findById(id);
        if (!user) {
            return;
        }
        await this.userModel.findByIdAndUpdate(id, {
            $push: data
        })

        return await this.userModel.findById(id);
    }

    // set teacher as feature
    // async setFeatureTeacher(id) {
    //     const feature = await this.featureModel.findOne({
    //         topic: "featureteacher"
    //     });
    //     // if feature record is not in Feature DB, create
    //     if (!feature) {
    //         // Create feature
    //         await (new this.featureModel({
    //             topic: "featureteacher"
    //         })).save();
    //         const new_feature = await this.featureModel.findOne({
    //             topic: "featureteacher"
    //         });
    //         new_feature.features.push(id);
    //         new_feature.save();
    //         return new_feature;
    //     } else {
    //         feature.features.push(id);
    //         feature.save();
    //     }
    //     return feature;
    // }
    // remove teacher from feature
    // async removeFeatureTeacher(id) {
    //     const feature = await this.featureModel.findOne({
    //         topic: "featureteacher"
    //     });
    //     // if feature record is not in Feature DB, create
    //     if (feature) {
    //         feature.features.pull(id);
    //         feature.save();
    //     }
    //     return feature;
    // }

    async updateAdmin(id: string, data) {
        return await this.userModel.findByIdAndUpdate(id, {
            $set: data
        })
    }

    async deleteUser(id: string) {
        return await this.userModel.findByIdAndDelete(id);
    }

    async createUser(user) {
        user.password = await this.getHash(user.password);
        user.email = user.username.toLowerCase();
        user.username = user.username.toLowerCase();
        user.date = new Date().toISOString(), user.auto_id = await this.helperService.getNextSequenceValue('users')
        const created_user = await (new this.userModel(user)).save();
        // const created_user = await this.userModel.findOne({email: user.username});
        // console.log("created_user: ", created_user);
        return created_user

    }
    async addCommission(commission) {
        const addcommission = await (new this.commissionModel(commission)).save();
        return addcommission
    }

    async getHash(password: string | undefined): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    async compareHash(username: string, password: string): Promise<boolean> {
        let user: any = await this.userModel.aggregate([
            {
                $match: {
                    username: username
                }
            },
            {
                $project: {
                    username: 1,
                    passwordHash: '$password'
                }
            }
        ])

        if (!user || !user.length) {
            return false;
        }

        user = user[0];

        if (await bcrypt.compare(password, user.passwordHash)) {
            return this.getUserByUsername(username)
        }

        return;
    }

    async verifyEmail(code) {
        let user: any = await this.userModel.aggregate([
            {
                $match: {
                    emailVerified: code
                }
            },
            {
                $project: {
                    _id: 1,
                    emailVerifiedHash: '$emailVerified'
                }
            }
        ])

        if (!user || !user.length) {
            return false;
        }

        if (user[0].emailVerifiedHash === code) {
            await this.userModel.findByIdAndUpdate(user[0]._id, { emailVerified: '' });
            const transaction: Transaction = {
                debit_user: TransactionUserType.System,
                debit_type: TransactionValueType.InternalCredit,
                debit_amount: 10,
                credit_user: user[0]._id,
                credit_type: TransactionValueType.InternalCredit,
                credit_amount: 10,
                notes: `10 credits for email verification.`,
                type: TransactionType.AdminModification
            }
            await this.transactionsService.createTransaction(transaction);
            return true;
        }

        return false;
    }

    async verifyEmailSuperAdmin(id: string,) {
        await this.userModel.findByIdAndUpdate(id, {
            emailVerified: ''
        });
        return await this.userModel.findById(id);
    }

    async verifyPhoneSuperAdmin(id: string,) {
        await this.userModel.findByIdAndUpdate(id, {
            phoneVerified: true
        });
        return await this.userModel.findById(id);
    }

    async changePasswordSuperAdmin(id: string, password: string) {
        await this.userModel.findByIdAndUpdate(id, {
            password: await this.getHash(password)
        });
        return await this.userModel.findById(id);
    }

    async smsVerify(id: string, code: string) {
        let user = await this.userModel.findById(id);
        let startTime = moment(user.smsDate);
        let minutes = moment().diff(startTime, 'minutes');
        if (minutes > 5 || code != user.smsCode) {
            return false;
        }
        else {
            return true;
        }

    }
}
