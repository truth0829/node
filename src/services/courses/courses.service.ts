import {ObjectId} from 'bson';
import {InjectModel} from '@nestjs/mongoose';
import {Injectable} from '@nestjs/common';
import {Model} from 'mongoose';

import * as _ from 'lodash';

@Injectable()
export class CoursesService {
    constructor(
        @InjectModel('Courses') private readonly courseModel: Model<any>,
        @InjectModel('Lessons') private readonly lessonModel: Model<any>,
        @InjectModel('Bundles') private readonly bundleModel: Model<any>
    ) {
    }

    async getCourseById(id: string) {
        return await this.courseModel.findById(id);
    }

    async getCoursesByPaginate(queryOption: any = {}, search_key: any = {}, query) {
        if (search_key.field === "" && search_key.value === "") {
            return await this.courseModel
                .find()
                .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                .limit(Number(queryOption.limit)).sort([[query.orderBy, 'desc']])
                .exec();
        } else {
            switch (search_key.field) {
                case "topic": {
                    return await this.courseModel
                        .find({
                            $or: [{
                                topic: {
                                    $regex: search_key.value,
                                    $options: "i"
                                }
                            }, {
                                topic_ch: {
                                    $regex: search_key.value,
                                    $options: "i"
                                }
                            }]
                        })
                        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                        .limit(Number(queryOption.limit)).sort([[query.orderBy, 'desc']])
                        .exec();
                }
            }
        }

    }

    async getWechatCoursesByPaginate(queryOption: any = {}, search_key: any = {}, query) {
        if (search_key.field === "" && search_key.value === "") {
            return await this.courseModel
                .find({
                    is_mini_app: true
                })
                .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                .limit(Number(queryOption.limit)).sort([[query.orderBy, 'desc']])
                .exec();
        } else {
            switch (search_key.field) {
                case "topic": {
                    return await this.courseModel
                        .find({
                            $or: [{
                                topic: {
                                    $regex: search_key.value,
                                    $options: "i"
                                }
                            }, {
                                topic_ch: {
                                    $regex: search_key.value,
                                    $options: "i"
                                }
                            }]
                        }).find({
                            is_mini_app: true
                        })
                        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                        .limit(Number(queryOption.limit)).sort([[query.orderBy, 'desc']])
                        .exec();
                }
            }
        }

    }

    async getNumberOfCourses(search_key: any = {}) {
        if (search_key.field === "" && search_key.value === "") {
            return await this.courseModel.countDocuments();
        } else {
            switch (search_key.field) {
                case "topic": {
                    return await this.courseModel
                        .find({
                            $or: [{
                                topic: {
                                    $regex: search_key.value,
                                    $options: "i"
                                }
                            }, {
                                topic_ch: {
                                    $regex: search_key.value,
                                    $options: "i"
                                }
                            }]
                        })
                        .countDocuments();
                }
            }
        }
    }

    async getNumberOfPackages(search_key: any = {}) {
        var bundles;
        if (search_key.field === "" && search_key.value === "") {
            bundles = await this.bundleModel.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'teacher_id',
                        foreignField: '_id',
                        as: 'teacher'
                    }
                },
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'course_id',
                        foreignField: '_id',
                        as: 'course'
                    }
                },
                {
                    $lookup: {
                        from: 'bundleenrollments',
                        localField: '_id',
                        foreignField: 'bundle',
                        as: 'enrollment'
                    }
                },
                {
                    $addFields: {
                        teacher: {
                            $arrayElemAt: ['$teacher', 0]
                        },
                        course: {
                            $arrayElemAt: ['$course', 0]
                        },
                        enrollment: ['$enrollment']
                    }
                },
                {
                    $project: {
                        'teacher.password': 0
                    }
                },
            ]);
        } else {
            const params: any = {};
            switch (search_key.field) {
                case "course": {
                    params.course_name = {
                        $regex: search_key.value,
                        $options: "i"
                    };
                    bundles = await this.bundleModel
                        .aggregate([
                            {
                                $match: params
                            },
                            {
                                $sort: {
                                    date: -1
                                }
                            },
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'teacher_id',
                                    foreignField: '_id',
                                    as: 'teacher'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'courses',
                                    localField: 'course_id',
                                    foreignField: '_id',
                                    as: 'course'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'bundleenrollments',
                                    localField: '_id',
                                    foreignField: 'bundle',
                                    as: 'enrollment'
                                }
                            },
                            {
                                $addFields: {
                                    teacher: {
                                        $arrayElemAt: ['$teacher', 0]
                                    },
                                    course: {
                                        $arrayElemAt: ['$course', 0]
                                    },
                                    enrollment: ['$enrollment']
                                }
                            },
                            {
                                $project: {
                                    'teacher.password': 0
                                }
                            },
                        ]);
                }
                case "title": {
                    bundles = await this.bundleModel
                        .aggregate([
                            {
                                $match: {
                                    $or: [{
                                        bundle_title: {
                                            $regex: search_key.value,
                                            $options: "i"
                                        }
                                    }, {
                                        bundle_title_ch: {
                                            $regex: search_key.value,
                                            $options: "i"
                                        }
                                    }]
                                }
                            },
                            {
                                $sort: {
                                    date: -1
                                }
                            },
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'teacher_id',
                                    foreignField: '_id',
                                    as: 'teacher'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'courses',
                                    localField: 'course_id',
                                    foreignField: '_id',
                                    as: 'course'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'bundleenrollments',
                                    localField: '_id',
                                    foreignField: 'bundle',
                                    as: 'enrollment'
                                }
                            },
                            {
                                $addFields: {
                                    teacher: {
                                        $arrayElemAt: ['$teacher', 0]
                                    },
                                    course: {
                                        $arrayElemAt: ['$course', 0]
                                    },
                                    enrollment: ['$enrollment']
                                }
                            },
                            {
                                $project: {
                                    'teacher.password': 0
                                }
                            }
                        ]);
                }
            }
        }
        return bundles.length;
    }

    async getNumberOfFeaturedPackages(search_key: any = {}) {
        var bundles;
        if (search_key.field === "" && search_key.value === "") {
            bundles = await this.bundleModel.aggregate([
                {
                    $match: {
                        is_feature: true
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'teacher_id',
                        foreignField: '_id',
                        as: 'teacher'
                    }
                },
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'course_id',
                        foreignField: '_id',
                        as: 'course'
                    }
                },
                {
                    $lookup: {
                        from: 'bundleenrollments',
                        localField: '_id',
                        foreignField: 'bundle',
                        as: 'enrollment'
                    }
                },
                {
                    $addFields: {
                        teacher: {
                            $arrayElemAt: ['$teacher', 0]
                        },
                        course: {
                            $arrayElemAt: ['$course', 0]
                        },
                        enrollment: ['$enrollment']
                    }
                },
                {
                    $project: {
                        'teacher.password': 0
                    }
                },
            ]);
        } else {
            const params: any = {};
            switch (search_key.field) {
                case "course": {
                    params.course_name = {
                        $regex: search_key.value,
                        $options: "i"
                    };
                    params.is_feature = true;

                    bundles = await this.bundleModel
                        .aggregate([
                            {
                                $match: params
                            },
                            {
                                $sort: {
                                    date: -1
                                }
                            },
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'teacher_id',
                                    foreignField: '_id',
                                    as: 'teacher'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'courses',
                                    localField: 'course_id',
                                    foreignField: '_id',
                                    as: 'course'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'bundleenrollments',
                                    localField: '_id',
                                    foreignField: 'bundle',
                                    as: 'enrollment'
                                }
                            },
                            {
                                $addFields: {
                                    teacher: {
                                        $arrayElemAt: ['$teacher', 0]
                                    },
                                    course: {
                                        $arrayElemAt: ['$course', 0]
                                    },
                                    enrollment: ['$enrollment']
                                }
                            },
                            {
                                $project: {
                                    'teacher.password': 0
                                }
                            },
                        ]);
                }
                case "title": {
                    bundles = await this.bundleModel
                        .aggregate([
                            {
                                $match: {
                                    $or: [{
                                        bundle_title: {
                                            $regex: search_key.value,
                                            $options: "i"
                                        }
                                    }, {
                                        bundle_title_ch: {
                                            $regex: search_key.value,
                                            $options: "i"
                                        }
                                    }],
                                    is_feature: true
                                }
                            },
                            {
                                $sort: {
                                    date: -1
                                }
                            },
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'teacher_id',
                                    foreignField: '_id',
                                    as: 'teacher'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'courses',
                                    localField: 'course_id',
                                    foreignField: '_id',
                                    as: 'course'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'bundleenrollments',
                                    localField: '_id',
                                    foreignField: 'bundle',
                                    as: 'enrollment'
                                }
                            },
                            {
                                $addFields: {
                                    teacher: {
                                        $arrayElemAt: ['$teacher', 0]
                                    },
                                    course: {
                                        $arrayElemAt: ['$course', 0]
                                    },
                                    enrollment: ['$enrollment']
                                }
                            },
                            {
                                $project: {
                                    'teacher.password': 0
                                }
                            }
                        ]);
                }
            }
        }
        return bundles.length;
    }

    async getNumberOfWechatCourses(search_key: any = {}) {
        if (search_key.field === "" && search_key.value === "") {
            return await this.courseModel.find({
                is_mini_app: true
            }).countDocuments();
        } else {
            switch (search_key.field) {
                case "topic": {
                    return await this.courseModel
                        .find({
                            $or: [{
                                topic: {
                                    $regex: search_key.value,
                                    $options: "i"
                                }
                            }, {
                                topic_ch: {
                                    $regex: search_key.value,
                                    $options: "i"
                                }
                            }]
                        }).find({
                            is_mini_app: true
                        })
                        .countDocuments();
                }
            }
        }
    }

    async getLessonsByIds(ids: string[]) {
        return await this.lessonModel.aggregate([
            {
                $match: {
                    _id: {
                        $in: _.map(ids, v => new ObjectId(v))
                    }
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course_id',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'teacher_id',
                    foreignField: '_id',
                    as: 'teacher'
                }
            },
            {
                $addFields: {
                    course: {
                        $arrayElemAt: ['$course', 0]
                    },
                    teacher: {
                        $arrayElemAt: ['$teacher', 0]
                    }
                }
            },
            {
                $project: {
                    'teacher.password': 0
                }
            }
        ]).sort('course.topic');
    }

    async getLessonsByTeacherId(teacher_id: string) {
        return await this.lessonModel.find({
            teacher_id: new ObjectId(teacher_id)
        })
    }

    async getLessonById(id: string) {
        return await this.lessonModel.findById(id);
    }

    async getBundleById(id: string) {
        return await this.bundleModel.findById(id);
    }

    async getSessionById(lessonid: string, id: string) {
        const lesson = await this.lessonModel.findById(lessonid);

        if (!lesson) {
            return;
        }

        return _.find(lesson.sessions, {_id: new ObjectId(id)}) as any;
    }
}
