import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { HelperService } from '../helper/helper.service';
import { ObjectId } from 'bson';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectModel('Reviews') private readonly reviewsModel: Model<any>,
        private helperService: HelperService
    ){}

    async getReviews(match: any){
        // console.log(match);

        return await this.reviewsModel.aggregate([
            {
                $match: match
            }
        ])
    }
    async getAllReviewsByPaginate(queryOption: any = {}) {
        return await this.reviewsModel.aggregate([
            {
                $sort: {
                    date: -1
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'from',
                    foreignField: '_id',
                    as: 'from'
                }
            },
            {
                $lookup: {
                    from: 'lessons',
                    localField: 'to',
                    foreignField: '_id',
                    as: 'lesson'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'to',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $addFields: {
                    to: {
                        $cond: {
                            if: {
                                $gte: [ {$size: "$lesson"}, 1 ]
                            },
                            then: {
                                $arrayElemAt: ['$lesson', 0]
                            },
                            else: {
                                $arrayElemAt: ['$user', 0]
                            }
                        }
                    },
                    from: {
                        $arrayElemAt: ['$from', 0]
                    }
                }
            },
            {
                $project: {
                    user: 0,
                    lesson: 0,
                    'to.password': 0,
                    'from.password': 0
                }
            }
        ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
    }

    async getAllNumberOfReviews(match = {}) {
        const result = await this.reviewsModel.aggregate([
            {
                $sort: {
                    date: -1
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'from',
                    foreignField: '_id',
                    as: 'from'
                }
            },
            {
                $lookup: {
                    from: 'lessons',
                    localField: 'to',
                    foreignField: '_id',
                    as: 'lesson'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'to',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $addFields: {
                    to: {
                        $cond: {
                            if: {
                                $gte: [ {$size: "$lesson"}, 1 ]
                            },
                            then: {
                                $arrayElemAt: ['$lesson', 0]
                            },
                            else: {
                                $arrayElemAt: ['$user', 0]
                            }
                        }
                    },
                    from: {
                        $arrayElemAt: ['$from', 0]
                    }
                }
            },
            {
                $project: {
                    user: 0,
                    lesson: 0,
                    'to.password': 0,
                    'from.password': 0
                }
            }
        ])
        return result.length;
    }
    async createReview(data){
        return await (new this.reviewsModel({
            auto_id: await this.helperService.getNextSequenceValue('reviews'),
            from: (new ObjectId(data.from)),
            to: (new ObjectId(data.to)),
            from_showname: data.from_showname,
            date: new Date().toISOString(),
            message: data.message,
            type: data.type,
            stars: data.stars
        })).save();
    }

    async getAllReviews(){
        return await this.reviewsModel.aggregate([
            {
                $sort: {
                    date: -1
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'from',
                    foreignField: '_id',
                    as: 'from'
                }
            },
            {
                $lookup: {
                    from: 'lessons',
                    localField: 'to',
                    foreignField: '_id',
                    as: 'lesson'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'to',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $addFields: {
                    to: {
                        $cond: {
                            if: {
                                $gte: [ {$size: "$lesson"}, 1 ]
                            },
                            then: {
                                $arrayElemAt: ['$lesson', 0]
                            },
                            else: {
                                $arrayElemAt: ['$user', 0]
                            }
                        }
                    },
                    from: {
                        $arrayElemAt: ['$from', 0]
                    }
                }
            },
            {
                $project: {
                    user: 0,
                    lesson: 0,
                    'to.password': 0,
                    'from.password': 0
                }
            }
        ]);
    }

    async deleteReview(id){
        return await this.reviewsModel.findByIdAndDelete(id);
    }
}
