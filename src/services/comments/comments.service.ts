import {InjectModel} from '@nestjs/mongoose';
import {Injectable} from '@nestjs/common';
import {Model} from 'mongoose';
import {HelperService} from '../helper/helper.service';

@Injectable()
export class CommentsService {
    constructor(
        @InjectModel('Comments') private readonly commentsModel: Model<any>,
        private helperService: HelperService
    ) {
    }

    async getComments(match) {
        return await this.commentsModel.aggregate([
            {
                $match: match
            }
        ])
    }

    async getAllComments() {
        return await this.commentsModel.aggregate([
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
                    from: 'drawings',
                    localField: 'to',
                    foreignField: '_id',
                    as: 'to'
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'to.course_id',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            {
                $addFields: {
                    to: {
                        $arrayElemAt: ['$to', 0]
                    },
                    from: {
                        $arrayElemAt: ['$from', 0]
                    },
                    course: {
                        $arrayElemAt: ['$course', 0]
                    }
                }
            },
            {
                $project: {
                    'from.password': 0
                }
            }
        ])
    }

    async getAllCommentsByPaginate(queryOption: any = {}) {
        return await this.commentsModel.aggregate([
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
                    from: 'drawings',
                    localField: 'to',
                    foreignField: '_id',
                    as: 'to'
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'to.course_id',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            {
                $addFields: {
                    to: {
                        $arrayElemAt: ['$to', 0]
                    },
                    from: {
                        $arrayElemAt: ['$from', 0]
                    },
                    course: {
                        $arrayElemAt: ['$course', 0]
                    }
                }
            },
            {
                $project: {
                    'from.password': 0
                }
            }
        ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
    }

    async getAllNumberOfComments(match = {}) {
        const result = await this.commentsModel.aggregate([
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
                    from: 'drawings',
                    localField: 'to',
                    foreignField: '_id',
                    as: 'to'
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'to.course_id',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            {
                $addFields: {
                    to: {
                        $arrayElemAt: ['$to', 0]
                    },
                    from: {
                        $arrayElemAt: ['$from', 0]
                    },
                    course: {
                        $arrayElemAt: ['$course', 0]
                    }
                }
            },
            {
                $project: {
                    'from.password': 0
                }
            }
        ])
        return result.length;
    }

    async createComment(data) {
        return await (new this.commentsModel({
            ...data,
            date: new Date().toISOString(),
            auto_id: await this.helperService.getNextSequenceValue('comments')
        })).save();
    }

    async deleteComment(id) {
        return await this.commentsModel.findByIdAndDelete(id);
    }
}
