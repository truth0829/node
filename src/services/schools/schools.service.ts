import { ObjectId } from 'bson';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import * as _ from 'lodash';

@Injectable()
export class SchoolsService {
    constructor(
        @InjectModel('Schools') private readonly schoolsModel: Model<any>
    ){}

    addSchool(school){
        return (new this.schoolsModel(school)).save();
    }

    getSchoolById(id){
        return this.schoolsModel.findById(id);
    }

    getSchoolByAdminId(id){
        return this.schoolsModel.findOne({admin: new ObjectId(id)});
    }

    getSchools(){
        return this.schoolsModel.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'admin',
                    foreignField: '_id',
                    as: 'admin'
                }
            },
            {
                $addFields: {
                    admin: {
                        $arrayElemAt: ['$admin', 0]
                    }
                }
            }
        ])
    }

    async getSchoolsByPaginate(queryOption: any = {}) {
        return await this.schoolsModel.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'admin',
                    foreignField: '_id',
                    as: 'admin'
                }
            },
            {
                $addFields: {
                    admin: {
                        $arrayElemAt: ['$admin', 0]
                    }
                }
            }
        ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit))
            .exec();

    }

    async getNumberOfSchools() {
        const result = await this.schoolsModel.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'admin',
                    foreignField: '_id',
                    as: 'admin'
                }
            },
            {
                $addFields: {
                    admin: {
                        $arrayElemAt: ['$admin', 0]
                    }
                }
            }
        ]);
        return result.length;
    }

    deleteSchool(id){
        return this.schoolsModel.findByIdAndDelete(id);
    }
}
