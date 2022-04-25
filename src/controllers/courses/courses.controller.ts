import {UsersService} from './../../services/users/users.service';
import {ZoomService} from './../../services/zoom/zoom.service';
import {AdminGuard} from './../../guards/admin.guard';
import {CoursesService} from './../../services/courses/courses.service';
import {TransactionsService} from './../../services/transactions/transactions.service';
import {TransactionUserType, TransactionValueType, TransactionType, State} from './../../schemas/transactions';
import {HelperService} from './../../services/helper/helper.service';
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    Response,
    HttpStatus,
    Put,
    Delete,
    UseGuards,
    BadRequestException
} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {ObjectId} from 'bson';

import * as _ from 'lodash';
import {EnrollmentsService} from '../../services/enrollments/enrollments.service';
import {Transaction} from '../../schemas/transactions';
import {SettingsService} from '../../services/settings/settings.service';
import * as moment from 'moment';
import * as sgMail from "@sendgrid/mail";

@Controller('courses')
export class CoursesController {
    constructor(
        @InjectModel('Courses') private readonly courseModel: Model<any>,
        @InjectModel('Lessons') private readonly lessonModel: Model<any>,
        @InjectModel('Bundles') private readonly bundleModel: Model<any>,
        private helperService: HelperService,
        private enrollmentsService: EnrollmentsService,
        private transactionsService: TransactionsService,
        private settingsService: SettingsService,
        private coursesService: CoursesService,
        private zoomService: ZoomService,
        private userService: UsersService,
        private couresService: CoursesService,
        private usersService: UsersService,
    ) {
    }

    @Get('')
    async getCourses(
        @Query() query
    ) {
        const opt: any = {};

        if (query.school && ObjectId.isValid(query.school)) {
            opt.school_id = new ObjectId(query.school);
        }

        return await this.courseModel.find(opt).sort([[query.orderBy, 'desc']]);
    }

    @Get('totalnumber')
    async getTotalNumberOfCourses(
        @Query() query
    ) {
        const lessons = await this.lessonModel.aggregate([
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
                $addFields: {
                    teacher: {
                        $arrayElemAt: ['$teacher', 0]
                    },
                    course: {
                        $arrayElemAt: ['$course', 0]
                    }
                }
            },
            {
                $project: {
                    'teacher.password': 0
                }
            }
        ])
        return {
            status: 200,
            data: lessons.length
        }
    }

    @Get('paginate-courses')
    @UseGuards(AdminGuard)
    async getCoursesByPaginate(
        @Query() query,
        @Query('page') request_page: number = 1,
        @Query('field') field: string = "",
        @Query('value') value: string = "",
        @Query('first_load') first_load: number = 1
    ) {
        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const search_key: any = {
            field: field,
            value: value
        };
        const data = await this.couresService.getCoursesByPaginate(
            queryOption, search_key, query
        );
        if (Number(first_load) == 1) {

            const number_of_users = await this.couresService.getNumberOfCourses(search_key);
            var totalPages = 0;
            if (Number(number_of_users) >= limit) {
                totalPages = Math.floor(Number(number_of_users) / limit) + (Number(number_of_users) % limit > 0 ? 1 : 0);
            }
            var pages = [];
            for (var i = 1; i < totalPages + 1; i++) {
                pages.push(i);
            }
            return {
                status: 200,
                pager: {
                    currentPage: Number(request_page),
                    totalPages: totalPages,
                    pages: pages,
                    totals: number_of_users
                },
                data
            }
        } else {
            return {
                status: 200,
                data
            }
        }
    }

    @Get('paginate-wechat-courses')
    @UseGuards(AdminGuard)
    async getWechatCoursesByPaginate(
        @Query() query,
        @Query('page') request_page: number = 1,
        @Query('field') field: string = "",
        @Query('value') value: string = "",
        @Query('first_load') first_load: number = 1
    ) {
        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const search_key: any = {
            field: field,
            value: value
        };
        const data = await this.couresService.getWechatCoursesByPaginate(
            queryOption, search_key, query
        );
        if (Number(first_load) == 1) {

            const number_of_users = await this.couresService.getNumberOfWechatCourses(search_key);
            var totalPages = 0;
            if (Number(number_of_users) >= limit) {
                totalPages = Math.floor(Number(number_of_users) / limit) + (Number(number_of_users) % limit > 0 ? 1 : 0);
            }
            var pages = [];
            for (var i = 1; i < totalPages + 1; i++) {
                pages.push(i);
            }
            return {
                status: 200,
                pager: {
                    currentPage: Number(request_page),
                    totalPages: totalPages,
                    pages: pages,
                    totals: number_of_users
                },
                data
            }
        } else {
            return {
                status: 200,
                data
            }
        }
    }

    @Get('sessions')
    async getAllSessions(@Query() query) {
        return await this.lessonModel.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course_id',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            {
                $addFields: {
                    course: {
                        $arrayElemAt: ["$course", 0]
                    }
                }
            },
            {
                $unwind: '$sessions'
            },
            {
                $match: {
                    'sessions.state': 1
                }
            }
        ]);
    }

    @Get('paginate-sessions')
    @UseGuards(AdminGuard)
    async getSessionsByPaginate(
        @Query('page') request_page: number = 1,
        @Query('state') state: number = 1,
        @Query('first_load') first_load: number = 1
    ) {
        let limit = 20;
        var data;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        if (state == 1) {
            data = await this.lessonModel.aggregate([
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'course_id',
                        foreignField: '_id',
                        as: 'course'
                    }
                },                
                {
                    $addFields: {
                        course: {
                            $arrayElemAt: ["$course", 0]
                        }
                    }
                },
                {
                    $unwind: '$sessions'
                },                
                {
                    $match: {
                        'sessions.state': Number(state)
                    }
                },
                {
                    $lookup: {
                        from: 'enrollments',                   
                        let: { session_id:"$sessions._id" },
                        pipeline: [ {
                            $match: {
                               $expr: {
                                  $and: [
                                     { $eq: [ "$$session_id", "$session" ] } ,
                                     { $gt: [ "$state", 0] }                               
                                  ]
                               }
                            }
                         } ],                                            
                        as: 'enrollments'
                    }
                },
                // {
                //     $addFields: {
                //         enrollments: {
                //             $size: "$enrollments"
                //         }
                //     }
                // },
                {
                    $sort: {
                        'sessions.startTime': 1
                    }
                }
            ])
                .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                .limit(Number(queryOption.limit));
        } else {
            data = await this.lessonModel.aggregate([
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'course_id',
                        foreignField: '_id',
                        as: 'course'
                    }
                },
                {
                    $addFields: {
                        course: {
                            $arrayElemAt: ["$course", 0]
                        }
                    }
                },
                {
                    $unwind: '$sessions'
                },
                {
                    $match: {
                        'sessions.state': Number(state)
                    }
                },
                {
                    $sort: {
                        'sessions.startTime': -1
                    }
                }
            ])
                .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                .limit(Number(queryOption.limit));
        }


        if (Number(first_load) == 1) {
            const all_sessions = await this.lessonModel.aggregate([     
                {
                    $unwind: '$sessions'
                },
                {
                    $match: {
                        'sessions.state': Number(state)
                    }
                }
            ]);

            const number_of_sessions = all_sessions.length;
            var totalPages = 0;

            if (Number(number_of_sessions) >= limit) {
                totalPages = Math.floor(Number(number_of_sessions) / limit) + (Number(number_of_sessions) % limit > 0 ? 1 : 0);
            }

            var pages = [];
            for (var i = 1; i < totalPages + 1; i++) {
                pages.push(i);
            }
            return {
                status: 200,
                pager: {
                    currentPage: Number(request_page),
                    totalPages: totalPages,
                    pages: pages,
                    totals: number_of_sessions
                },
                data
            };
        } else {
            return {
                status: 200,
                data
            };
        }
    }

    @Get('promotions')
    async getPromotions() {
        const settings = await this.settingsService.getSettingsByType('configs');

        const {promotions} = settings;

        return {
            status: 200,
            data: await this.coursesService.getLessonsByIds(promotions)
        }
    }
    @Get('promotionIds')
    async getPromotionIds() {
        const settings = await this.settingsService.getSettingsByType('configs');

        const {promotions} = settings;

        return  promotions
    
    }

    @Get('featured')
    async getFeatured() {
        const settings = await this.settingsService.getSettingsByType('configs');

        const {featured} = settings;

        if (!featured) {
            return {
                status: 200,
                data: null
            }
        }

        const aggregatePipe = [
            {
                $match: {
                    _id: {
                        $in: [new ObjectId(featured)]
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
                    },
                    session: '$sessions'
                }
            },
            {
                $project: {
                    'teacher.password': 0,
                    sessions: 0
                }
            },
            {
                $unwind: '$session'
            },
            {
                $sort: {
                    'session.startTime': 1
                }
            },
            {
                $match: {
                    'session.startTime': {
                        $gt: new Date().toISOString()
                    }
                }
            },
            {
                $limit: 1
            }
        ]

        return {
            status: 200,
            data: (await this.lessonModel.aggregate(aggregatePipe))[0] || null
        }
    }

    @Get('categories')
    async getCategories() {
        const settings = await this.settingsService.getSettingsByType('configs');
        if (!settings) {
            return {
                status: 200,
                data: null
            }
        }
        return {
            status: 200,
            data: settings.new_categories
        }
    }

    @Get('lessons')
    async getAllLessons(
        @Response() res,
        @Query('limit') limit,
        @Query('teacher_id') teacher_id,
        @Query('students_enrolled') students_enrolled,
        @Query('show_enrollments') show_enrollments,
        @Query('category') category,
        @Query('type') type,
        @Query('language') language,
    ) {
        const match: any = {
            state: State.Active
        }

        if (teacher_id) {
            match.teacher_id = new ObjectId(teacher_id);
        }

        const extraPipe = [];

        if (students_enrolled == 'true') {
            extraPipe.push({
                $lookup: {
                    from: "enrollments",
                    let: {
                        course_id: "$course_id",
                        lesson_id: "$_id",
                        teacher_id: "$teacher_id"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$teacher",
                                                "$$teacher_id"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$course",
                                                "$$course_id"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$lesson",
                                                "$$lesson_id"
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "students_enrolled"
                }
            });

            extraPipe.push({
                $addFields: {
                    students_enrolled: {
                        $cond: {
                            if: {$isArray: "$students_enrolled"},
                            then: {$size: "$students_enrolled"},
                            else: 0
                        }
                    }
                },
            });
        }


        if (category || type || language) {
            const match = {};

            if (category) {
                match['course.category'] = category;
            }

            // if (['private', 'group'].includes(type)) {
            //     match['course.max_students'] = type === 'private' ? 1 : {$ne: 1};
            // }

            if (['English', 'Chinese'].includes(language)) {
                match['course.language'] = language;
            }

            if (_.keys(match).length) {
                extraPipe.push({
                    $match: match
                })
            }
        }

        const lessons = await this.lessonModel.aggregate([
            {
                $match: match
            },
            {
                $limit: limit && !Number.isNaN(parseInt(limit)) ? parseInt(limit) : 999
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
                $addFields: {
                    teacher: {
                        $arrayElemAt: ['$teacher', 0]
                    },
                    course: {
                        $arrayElemAt: ['$course', 0]
                    }
                }
            },
            {
                $project: {
                    'teacher.password': 0
                }
            },
            ...extraPipe
        ]).sort('course.topic');


        return res.status(HttpStatus.OK).json({
            status: 200,
            data: lessons
        })
    }

    @Get('mini_app_lessons')
    async getAllLessonsOfMiniApp(
        @Response() res,
        @Query('limit') limit,
        @Query('teacher_id') teacher_id,
        @Query('students_enrolled') students_enrolled,
        @Query('show_enrollments') show_enrollments,
        @Query('category') category,
        @Query('type') type,
        @Query('language') language,
    ) {
        const match: any = {
            state: State.Active
        }

        if (teacher_id) {
            match.teacher_id = new ObjectId(teacher_id);
        }

        const extraPipe = [];

        if (students_enrolled == 'true') {
            extraPipe.push({
                $lookup: {
                    from: "enrollments",
                    let: {
                        course_id: "$course_id",
                        lesson_id: "$_id",
                        teacher_id: "$teacher_id"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$teacher",
                                                "$$teacher_id"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$course",
                                                "$$course_id"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$lesson",
                                                "$$lesson_id"
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "students_enrolled"
                }
            });

            extraPipe.push({
                $addFields: {
                    students_enrolled: {
                        $cond: {
                            if: {$isArray: "$students_enrolled"},
                            then: {$size: "$students_enrolled"},
                            else: 0
                        }
                    }
                },
            });
        }
        extraPipe.push({
            $match: {
                'course.is_mini_app': true
            },
        });

        if (category || type || language) {
            const match = {};

            if (category) {
                match['course.category'] = category;
            }

            // if (['private', 'group'].includes(type)) {
            //     match['course.max_students'] = type === 'private' ? 1 : {$ne: 1};
            // }

            if (['English', 'Chinese'].includes(language)) {
                match['course.language'] = language;
            }

            if (_.keys(match).length) {
                extraPipe.push({
                    $match: match
                })
            }
        }

        const lessons = await this.lessonModel.aggregate([
            {
                $match: match
            },
            {
                $limit: limit && !Number.isNaN(parseInt(limit)) ? parseInt(limit) : 999
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
                $addFields: {
                    teacher: {
                        $arrayElemAt: ['$teacher', 0]
                    },
                    course: {
                        $arrayElemAt: ['$course', 0]
                    }
                }
            },
            {
                $project: {
                    'teacher.password': 0
                }
            },
            ...extraPipe
        ]).sort({
            'course.topic': 'asc'
        });


        return res.status(HttpStatus.OK).json({
            status: 200,
            data: lessons
        })
    }

    @Get('bundles')
    async getAllBundles(
        @Response() res,
        @Query('limit') limit,
        @Query('teacher_id') teacher_id,
        @Query('students_enrolled') students_enrolled,
        @Query('show_enrollments') show_enrollments,
        @Query('category') category,
        @Query('type') type,
        @Query('language') language,
    ) {
        const match: any = {}

        if (teacher_id) {
            match.teacher_id = new ObjectId(teacher_id);
        }

        const extraPipe = [];

        if (students_enrolled == 'true') {
            extraPipe.push({
                $lookup: {
                    from: "enrollments",
                    let: {
                        course_id: "$course_id",
                        lesson_id: "$_id",
                        teacher_id: "$teacher_id"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$teacher",
                                                "$$teacher_id"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$course",
                                                "$$course_id"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$lesson",
                                                "$$lesson_id"
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "students_enrolled"
                }
            });

            extraPipe.push({
                $addFields: {
                    students_enrolled: {
                        $cond: {
                            if: {$isArray: "$students_enrolled"},
                            then: {$size: "$students_enrolled"},
                            else: 0
                        }
                    }
                },
            });
        }


        if (category || type || language) {
            const match = {};

            if (category) {
                match['course.category'] = category;
            }

            // if (['private', 'group'].includes(type)) {
            //     match['course.max_students'] = type === 'private' ? 1 : {$ne: 1};
            // }

            if (['English', 'Chinese'].includes(language)) {
                match['course.language'] = language;
            }

            if (_.keys(match).length) {
                extraPipe.push({
                    $match: match
                })
            }
        }

        const bundles = await this.bundleModel.aggregate([
            {
                $match: match
            },
            {
                $limit: limit && !Number.isNaN(parseInt(limit)) ? parseInt(limit) : 999
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
            {
                $sort: {
                    'auto_id': -1
                }
            },
            ...extraPipe
        ])


        return res.status(HttpStatus.OK).json({
            status: 200,
            data: bundles
        })
    }

    @Get('featureBundles')
    async getFeatureBundles(
        @Response() res,
        @Query('limit') limit,
        @Query('teacher_id') teacher_id,
        @Query('students_enrolled') students_enrolled,
        @Query('show_enrollments') show_enrollments,
        @Query('category') category,
        @Query('type') type,
        @Query('language') language,
    ) {
        const match: any = {
            is_feature: true
        }

        if (teacher_id) {
            match.teacher_id = new ObjectId(teacher_id);
        }

        const extraPipe = [];

        if (students_enrolled == 'true') {
            extraPipe.push({
                $lookup: {
                    from: "enrollments",
                    let: {
                        course_id: "$course_id",
                        lesson_id: "$_id",
                        teacher_id: "$teacher_id"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$teacher",
                                                "$$teacher_id"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$course",
                                                "$$course_id"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$lesson",
                                                "$$lesson_id"
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "students_enrolled"
                }
            });

            extraPipe.push({
                $addFields: {
                    students_enrolled: {
                        $cond: {
                            if: {$isArray: "$students_enrolled"},
                            then: {$size: "$students_enrolled"},
                            else: 0
                        }
                    }
                },
            });
        }


        if (category || type || language) {
            const match = {};

            if (category) {
                match['course.category'] = category;
            }

            // if (['private', 'group'].includes(type)) {
            //     match['course.max_students'] = type === 'private' ? 1 : {$ne: 1};
            // }

            if (['English', 'Chinese'].includes(language)) {
                match['course.language'] = language;
            }

            if (_.keys(match).length) {
                extraPipe.push({
                    $match: match
                })
            }
        }

        const bundles = await this.bundleModel.aggregate([
            {
                $match: match
            },
            {
                $limit: limit && !Number.isNaN(parseInt(limit)) ? parseInt(limit) : 999
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
            ...extraPipe
        ])


        return res.status(HttpStatus.OK).json({
            status: 200,
            data: bundles
        })
    }

    @Get('mini_app_bundles')
    async getAllBundlesOfMiniAPp(
        @Response() res,
        @Query('limit') limit,
        @Query('teacher_id') teacher_id,
        @Query('students_enrolled') students_enrolled,
        @Query('show_enrollments') show_enrollments,
        @Query('category') category,
        @Query('type') type,
        @Query('language') language,
    ) {
        const match: any = {}

        if (teacher_id) {
            match.teacher_id = new ObjectId(teacher_id);
        }

        const extraPipe = [];

        if (students_enrolled == 'true') {
            extraPipe.push({
                $lookup: {
                    from: "enrollments",
                    let: {
                        course_id: "$course_id",
                        lesson_id: "$_id",
                        teacher_id: "$teacher_id"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$teacher",
                                                "$$teacher_id"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$course",
                                                "$$course_id"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$lesson",
                                                "$$lesson_id"
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "students_enrolled"
                }
            });

            extraPipe.push({
                $addFields: {
                    students_enrolled: {
                        $cond: {
                            if: {$isArray: "$students_enrolled"},
                            then: {$size: "$students_enrolled"},
                            else: 0
                        }
                    }
                },
            });
        }

        extraPipe.push({
            $match: {
                'course.is_mini_app': true
            },
        });

        if (category || type || language) {
            const match = {};

            if (category) {
                match['course.category'] = category;
            }

            // if (['private', 'group'].includes(type)) {
            //     match['course.max_students'] = type === 'private' ? 1 : {$ne: 1};
            // }

            if (['English', 'Chinese'].includes(language)) {
                match['course.language'] = language;
            }

            if (_.keys(match).length) {
                extraPipe.push({
                    $match: match
                })
            }
        }

        const bundles = await this.bundleModel.aggregate([
            {
                $match: match
            },
            {
                $limit: limit && !Number.isNaN(parseInt(limit)) ? parseInt(limit) : 999
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
            ...extraPipe
        ]).sort({
            'course.topic': 'asc'
        })


        return res.status(HttpStatus.OK).json({
            status: 200,
            data: bundles
        })
    }

    @Get('paginate-bundles')
    async getAllBundlesByPaginate(
        @Response() res,
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1,
        @Query('field') field: string = "",
        @Query('value') value: string = ""
    ) {
        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const search_key: any = {
            field: field,
            value: value
        };

        let bundles;
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
                {
                    $sort: {
                        'auto_id': -1
                    }
                },
            ]).skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                .limit(Number(queryOption.limit));

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
                            {
                                $sort: {
                                    'auto_id': -1
                                }
                            },
                            
                        ])
                        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                        .limit(Number(queryOption.limit));
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
                            },
                            {
                                $sort: {
                                    'auto_id': -1
                                }
                            },
                        ])
                        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                        .limit(Number(queryOption.limit));
                }
            }
        }

        const number_of_bundles = await this.couresService.getNumberOfPackages(search_key);
        var totalPages = 0;
        if (Number(number_of_bundles) >= limit) {
            totalPages = Math.floor(Number(number_of_bundles) / limit) + (Number(number_of_bundles) % limit > 0 ? 1 : 0);
        }
        var pages = [];
        for (var i = 1; i < totalPages + 1; i++) {
            pages.push(i);
        }
        return res.status(HttpStatus.OK).json({
            status: 200,
            pager: {
                currentPage: Number(request_page),
                totalPages: totalPages,
                pages: pages,
                totals: number_of_bundles
            },
            data: bundles
        });
    }

    @Get('paginate-featured-bundles')
    async getAllFeaturedBundlesByPaginate(
        @Response() res,
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1,
        @Query('field') field: string = "",
        @Query('value') value: string = ""
    ) {
        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const search_key: any = {
            field: field,
            value: value
        };

        let bundles;
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
            ]).skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                .limit(Number(queryOption.limit));

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
                        ])
                        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                        .limit(Number(queryOption.limit));
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
                        ])
                        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                        .limit(Number(queryOption.limit));
                }
            }
        }

        const number_of_bundles = await this.couresService.getNumberOfFeaturedPackages(search_key);
        var totalPages = 0;
        if (Number(number_of_bundles) >= limit) {
            totalPages = Math.floor(Number(number_of_bundles) / limit) + (Number(number_of_bundles) % limit > 0 ? 1 : 0);
        }
        var pages = [];
        for (var i = 1; i < totalPages + 1; i++) {
            pages.push(i);
        }
        return res.status(HttpStatus.OK).json({
            status: 200,
            pager: {
                currentPage: Number(request_page),
                totalPages: totalPages,
                pages: pages,
                totals: number_of_bundles
            },
            data: bundles
        });
    }

    @Get('lessons/upcoming')
    async getUpcomingLessons() {
        const upcomingLesson = await this.lessonModel.aggregate([
            {
                $unwind: "$sessions"
            },
            {
                $sort: {
                    'session.startTime': -1
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
                    teacher: {
                        $arrayElemAt: ['$teacher', 0]
                    },
                    course: {
                        $arrayElemAt: ['$course', 0]
                    },
                    session: '$sessions'
                }
            },
            {
                $limit: 1
            },
            {
                $project: {
                    'teacher.password': 0,
                    sessions: 0
                }
            }
        ]);

        return {
            status: 200,
            data: upcomingLesson[0]
        }
    }

    @Get(':id')
    async getSingleCourse(
        @Response() res,
        @Param('id') id
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is invalid.'
            })
        }

        return res.status(HttpStatus.OK).json({
            status: 200,
            data: await this.courseModel.findById(id)
        });
    }

    @Post('')
    @UseGuards(AdminGuard)
    async createCourse(@Body() body) {
        const course = new this.courseModel({
            ...body,
            date: new Date(),
            auto_id: await this.helperService.getNextSequenceValue('courses')
        });

        await course.save();

        return {
            status: 200,
            message: 'Course has been successfully created'
        }
    }

    @Put(':id')
    @UseGuards(AdminGuard)
    async updateCourse(
        @Body() body,
        @Param('id') id,
        @Response() res
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Wrong course id.'
            })
        }

        const course = await this.courseModel.findById(id);

        if (!course) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find a course.'
            })
        }
      

        if (body.default_sessions) {
            course.default_sessions = body.default_sessions;
        }

        await this.courseModel.findByIdAndUpdate(id, {
            $set: _.merge(course, {
                thumbnail: body.thumbnail,
                topic: body.topic,
                topic_ch: body.topic_ch,
                material: body.material,
                category: body.category,
                description: body.description,
                description_ch: body.description_ch, 
                min_age: body.min_age,
                max_age: body.max_age,              
                language: body.language,
                language_skill: body.language_skill,
                skill: body.skill,
                skill_level: body.skill_level,
                provider: body.provider               
            })
        })

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Course has been successfully updated.'
        })
    }

    @Put(':id/mini_app')
    @UseGuards(AdminGuard)
    async updateCourseForMiniApp(
        @Body() body,
        @Param('id') id,
        @Response() res
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Wrong course id.'
            })
        }

        const course = await this.courseModel.findById(id);

        if (!course) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find a course.'
            })
        }
        course.is_mini_app = body.is_mini_app;
        course.save();
        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Set to show in Mini App'
        })
        if (body.is_mini_app) {
            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Set to show in Mini App'
            })
        } else {
            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Removed from Mini App'
            })
        }

    }

    @Put('promoter/:id')
    @UseGuards(AdminGuard)
    async updateCoursePromoterPicture(
        @Body() body,
        @Param('id') id,
        @Response() res
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Wrong course id.'
            })
        }

        const course = await this.courseModel.findById(id);

        if (!course) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find a course.'
            })
        }
        course.promoter_picture = body.promoter_picture;
        course.save();

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Promoter picture updated!'
        })

    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    async deleteCourse(
        @Response() res,
        @Param('id') id
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Wrong course id.'
            })
        }

        const course = await this.courseModel.findById(id);

        if (!course) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find a course.'
            })
        }

        const lessons = await this.lessonModel.find({
            course_id: id
        })

        if (lessons.length >= 1) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could still has active lessons.'
            })
        }
        const bundles = await this.bundleModel.find({
            course_id: id
        })

        if (bundles.length >= 1) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could still has active bundles.'
            })
        }
        await this.courseModel.findByIdAndDelete(id);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Course has been successfully deleted.'
        })
    }

    @Get(':id/lessons')
    async getLessons(@Param('id') id) {
        return await this.lessonModel.aggregate([
            {
                $match: {
                    course_id: new ObjectId(id),
                    // show_on_front:{$ne:false}             
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
        ]);
    }

    @Get(':id/bundles')
    async getBundles(@Param('id') id) {
        return await this.bundleModel.aggregate([
            {
                $match: {
                    course_id: new ObjectId(id)
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
                    enrollment: {
                        $arrayElemAt: ['$enrollment', 0]
                    }
                }
            },
            {
                $project: {
                    'teacher.password': 0
                }
            }
        ]);
    }

    @Get(':id/lessons/:lesson_id')
    async getSingleLesson(
        @Response() res,
        @Param('id') course_id,
        @Param('lesson_id') lesson_id,
        @Query('teacher') teacher
    ) {
        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is invalid.'
            })
        }

        const course = await this.courseModel.findById(course_id);

        if (!course) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find a course.'
            })
        }

        if (!lesson_id || !ObjectId.isValid(lesson_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is invalid.'
            })
        }

        const lesson = await this.lessonModel.aggregate([
            {
                $match: {
                    _id: new ObjectId(lesson_id)
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
        ]);

        if (!lesson.length) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the lesson.'
            })
        }

        const aggregatePipe: any = {};
        aggregatePipe.lesson = new ObjectId(lesson_id);
        aggregatePipe.course = new ObjectId(course_id);
        if (teacher && ObjectId.isValid(teacher)) {
            aggregatePipe.teacher = new ObjectId(teacher);
        }
        return res.status(HttpStatus.OK).json({
            status: 200,
            data: {
                ...lesson[0],
                course: course,
                enrollments: await this.enrollmentsService.getEnrollments(aggregatePipe)
            }
        })
    }

    @Get(':id/bundles/:bundle_id')
    async getSingleBundle(
        @Response() res,
        @Param('id') course_id,
        @Param('bundle_id') bundle_id
    ) {
        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is invalid.'
            })
        }
        const course = await this.courseModel.findById(course_id);
        if (!course) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find a course.'
            })
        }

        if (!bundle_id || !ObjectId.isValid(bundle_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Package ID is invalid.'
            })
        }

        const bundle = await this.bundleModel.aggregate([
            {
                $match: {
                    _id: new ObjectId(bundle_id)
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

        if (!bundle.length) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find Package.'
            })
        }

        return res.status(HttpStatus.OK).json({
            status: 200,
            data: bundle[0]
        })
    }

    @Post(':id/lessons')
    @UseGuards(AdminGuard)
    async createLesson(
        @Response() res,
        @Param('id') id,
        @Body() body: any
    ) {
        if (!(
            !Number.isNaN(parseInt(body.credits_per_session)) &&
            parseInt(body.credits_per_session) >= 0 &&            
            body.subtitle &&
            body.teacher_id
        )) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Invalid values. Please make sure all values are correct.'
            })
        }

        if (!id || !ObjectId.isValid(id) || !await this.courseModel.findById(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course not found. Please try again.'
            })
        }

        await (new this.lessonModel({
            course_id: id,
            subtitle: body.subtitle,
            subtitle_ch: body.subtitle_ch,
            teacher_id: body.teacher_id,
            credits_per_session: body.credits_per_session,           
            sessions: [],
            auto_id: await this.helperService.getNextSequenceValue('lessons'),
            state: 1,
            show_on_front:body.show_on_front,
            session_duration: body.session_duration,
            total_sessions: body.total_sessions,
            max_students: body.max_students,
        })).save();

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Lesson has been succesfully created.'
        })
    }

    @Post(':id/bundles')
    @UseGuards(AdminGuard)
    async createBundle(
        @Response() res,
        @Param('id') id,
        @Body() body: any
    ) {
        if (!(
            !Number.isNaN(parseInt(body.number_of_sessions)) &&
            parseInt(body.session_length) >= 0 &&
            !Number.isNaN(parseInt(body.tuition)) &&
            parseInt(body.max_students_per_session) >= 0 &&
            parseInt(body.min_students_per_session) >= 0 &&
            parseInt(body.number_of_bundles) >= 0 &&
            body.bundle_title &&
            body.teacher_id
        )) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Invalid values. Please make sure all values are correct.'
            })
        }

        if (!id || !ObjectId.isValid(id) || !await this.courseModel.findById(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course not found. Please try again.'
            })
        }
        if (body.dates_string === '') {
            body.dates_string = "Flexible"
        }
        if (body.start_time_string === '') {
            body.start_time_string = "Flexible"
        }

        const date_time_array = [];
        const dates_array = body.dates_string.split(',');
        // begin: check dates_string and star_time_string
        if ((dates_array.find(item => {
            return this.isValidDate(item)
        }) || []).length > 0) {
            if (this.isValidTime(body.start_time_string)) {
                dates_array.forEach(function (element) {
                    let start_time = body.start_time_string.split('T')[1];
                    date_time_array.push({
                        date: element,
                        time: "T" + start_time
                    })
                });
            }
            else {
                dates_array.forEach(function (element) {
                    date_time_array.push({
                        date: element,
                        time: body.start_time_string
                    })
                });
            }
        }
        else {
            if (this.isValidTime(body.start_time_string)) {
                let start_time = body.start_time_string.split('T')[1];

                date_time_array.push({
                    date: body.dates_string,
                    time: "T" + start_time
                })
            } else {
                let start_date = body.dates_string;
                let start_time = body.start_time_string;
                date_time_array.push({
                    date: start_date,
                    time: start_time
                })
            }
        }
        await (new this.bundleModel({
            course_id: id,
            teacher_id: body.teacher_id,
            bundle_title: body.bundle_title,
            bundle_title_ch: body.bundle_title_ch,
            number_of_sessions: body.number_of_sessions,
            session_length: body.session_length,
            min_students_per_session: body.min_students_per_session,
            max_students_per_session: body.max_students_per_session,
            tuition: body.tuition,
            membership:body.membership,
            date_time: date_time_array,
            tim_zone: body.tim_zone,
            number_of_bundles: body.number_of_bundles,
            cancel_policy: body.cancel_policy,
            auto_id: await this.helperService.getNextSequenceValue('bundles'),
        })).save();

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Package has been successfully created.'
        })
    }

    isValidDate(date_string) {
        return moment(date_string, "MM/DD/YYYY").isValid();
    }

    isValidTime(time_string) {
        try {
            return moment(time_string).isValid();
        }
        catch ({message}) {
            return false;
        }
    }

    @Put(':id/lessons/:lesson_id')
    @UseGuards(AdminGuard)
    async updateLesson(
        @Response() res,
        @Param('id') course_id,
        @Param('lesson_id') lesson_id,
        @Body() body
    ) { 
        // console.log(body)
        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is not valid.'
            })
        }

        if (!await this.courseModel.findById(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the course.'
            })
        }

        if (!lesson_id || !ObjectId.isValid(lesson_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Lesson ID is not valid.'
            })
        }

        const lesson = await this.lessonModel.findById(lesson_id);

        if (!lesson) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the lesson.'
            })
        }
       

        // console.log(typeof body.show_on_front );
        await this.lessonModel.findByIdAndUpdate(lesson_id, {
            $set:  {
                subtitle: body.subtitle,
                subtitle_ch: body.subtitle_ch,
                state: body.state,
                credits_per_session: body.credits_per_session,               
                show_on_front: body.show_on_front == undefined ? false: body.show_on_front ,
                session_duration: body.session_duration,
                total_sessions: body.total_sessions,
				max_students: body.max_students,   
            }
        })

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Lesson has been successfully updated.'
        })
    }

    @Put(':id/bundles/:bundle_id')
    @UseGuards(AdminGuard)
    async updateBundle(
        @Response() res,
        @Param('id') course_id,
        @Param('bundle_id') bundle_id,
        @Body() body
    ) {
        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is not valid.'
            })
        }

        if (!await this.courseModel.findById(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the course.'
            })
        }

        if (!bundle_id || !ObjectId.isValid(bundle_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Package ID is not valid.'
            })
        }

        const bundle = await this.bundleModel.findById(bundle_id);

        if (!bundle) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find Package.'
            })
        }

        if (!(
            !Number.isNaN(parseInt(body.number_of_sessions)) &&
            parseInt(body.session_length) >= 0 &&
            !Number.isNaN(parseInt(body.tuition)) &&
            parseInt(body.max_students_per_session) >= 0 &&
            parseInt(body.min_students_per_session) >= 0 &&
            parseInt(body.number_of_bundles) >= 0 &&
            body.bundle_title &&
            body.teacher_id
        )) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Invalid values. Please make sure all values are correct.'
            })
        }

        if (body.dates_string === '') {
            body.dates_string = "Flexible"
        }
        if (body.start_time_string === '') {
            body.start_time_string = "Flexible"
        }
        // begin: Make dates_string and star_time_string
        const date_time_array = [];
        const dates_array = body.dates_string.split(',');
        if ((dates_array.find(item => {
            return this.isValidDate(item)
        }) || []).length > 0) {
            if (this.isValidTime(body.start_time_string)) {
                dates_array.forEach(function (element) {
                    let start_time = body.start_time_string.split('T')[1];
                    date_time_array.push({
                        date: element,
                        time: "T" + start_time
                    })
                });
            }
            else {
                dates_array.forEach(function (element) {
                    date_time_array.push({
                        date: element,
                        time: body.start_time_string
                    })
                });
            }
        }
        else {
            if (this.isValidTime(body.start_time_string)) {
                let start_time = body.start_time_string.split('T')[1];

                date_time_array.push({
                    date: body.dates_string,
                    time: "T" + start_time
                })
            } else {
                let start_date = body.dates_string;
                let start_time = body.start_time_string;
                date_time_array.push({
                    date: start_date,
                    time: start_time
                })
            }
        }
        // END:       
        await this.bundleModel.findByIdAndUpdate(bundle_id, {
            $set: {
                teacher_id: body.teacher_id,
                bundle_title: body.bundle_title,
                bundle_title_ch: body.bundle_title_ch,
                number_of_sessions: body.number_of_sessions,
                session_length: body.session_length,
                min_students_per_session: body.min_students_per_session,
                max_students_per_session: body.max_students_per_session,
                tuition: body.tuition,
                date_time: date_time_array,
                tim_zone: body.tim_zone,
                number_of_bundles: body.number_of_bundles,
                cancel_policy: body.cancel_policy,
                membership:body.membership,
                show_on_front:body.show_on_front,

            }
        },{ new: true });

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Package has been successfully updated.'
        })
    }

    @Delete(':id/lessons/:lesson_id')
    @UseGuards(AdminGuard)
    async deleteLesson(
        @Response() res,
        @Param('id') course_id,
        @Param('lesson_id') lesson_id
    ) {
        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is not valid.'
            })
        }

        if (!lesson_id || !ObjectId.isValid(lesson_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Lesson ID is not valid.'
            })
        }

        const lesson = await this.lessonModel.findById(lesson_id);

        if (!lesson) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the lesson.'
            })
        }

        if (lesson.sessions && lesson.sessions.length !== 0) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Lesson has active sessions.'
            })
        }

        await this.lessonModel.findByIdAndDelete(lesson_id);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Lesson has been successfully removed.'
        })
    }

    @Delete(':id/bundles/:bundle_id')
    @UseGuards(AdminGuard)
    async deleteBundle(
        @Response() res,
        @Param('id') course_id,
        @Param('bundle_id') bundle_id
    ) {
        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is not valid.'
            })
        }

        if (!bundle_id || !ObjectId.isValid(bundle_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Package ID is not valid.'
            })
        }

        const bundle = await this.bundleModel.findById(bundle_id);

        if (!bundle) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find Package.'
            })
        }

        const bundle_enrollments = await this.enrollmentsService.getBundleEnrollments({
            course: new ObjectId(course_id),
            bundle: new ObjectId(bundle_id),
        });
        if (bundle_enrollments && bundle_enrollments.length !== 0) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Package has active enrollments.'
            })
        } else {
            await this.bundleModel.findByIdAndDelete(bundle_id);
            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Package has been successfully removed.'
            })
        }
    }

    @Put(':id/bundles/:bundle_id/feature')
    @UseGuards(AdminGuard)
    async setFeaturePackage(
        @Response() res,
        @Param('id') course_id,
        @Param('bundle_id') bundle_id
    ) {
        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is not valid.'
            })
        }

        if (!bundle_id || !ObjectId.isValid(bundle_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Package ID is not valid.'
            })
        }
        const bundle = await this.bundleModel.findById(bundle_id);
        if (!bundle) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find Package.'
            })
        }

        bundle.is_feature = true;
        bundle.save();
        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Package has been set successfully as feature.'
        })

    }

    @Put(':id/bundles/:bundle_id/removefeature')
    @UseGuards(AdminGuard)
    async removeFeaturePackage(
        @Response() res,
        @Param('id') course_id,
        @Param('bundle_id') bundle_id
    ) {
        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is not valid.'
            })
        }

        if (!bundle_id || !ObjectId.isValid(bundle_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Package ID is not valid.'
            })
        }
        const bundle = await this.bundleModel.findById(bundle_id);
        if (!bundle) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find Package.'
            })
        }

        bundle.is_feature = false;
        bundle.save();
        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Package has been deleted from Feature successfully'
        })

    }

    @Get(':id/lessons/:lesson_id/sessions/:session_id/materials')
    async getSingleLessonSession(
        @Response() res,
        @Param('id') course_id,
        @Param('lesson_id') lesson_id,
        @Param('session_id') session_id
    ) {
        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is invalid.'
            })
        }
        const course = await this.courseModel.findById(course_id);
        if (!course) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find a course.'
            })
        }

        if (!lesson_id || !ObjectId.isValid(lesson_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Lesson ID is invalid.'
            })
        }

        if (!session_id || !ObjectId.isValid(session_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Session ID is invalid.'
            })
        }

        const materials = await this.lessonModel.aggregate([
            {
                $unwind: "$sessions"
            },
            {
                $match: {
                    _id: new ObjectId(lesson_id),
                    'sessions._id': new ObjectId(session_id)
                }
            },
            {
                $unwind: '$sessions.materials'
            },
            {
                $lookup: {
                    from: 'materials',
                    localField: 'sessions.materials',
                    foreignField: '_id',
                    as: 'material'
                }
            },
            {
                $addFields: {
                    material: {
                        $arrayElemAt: ['$material', 0]
                    }
                }
            },
            {
                $match: {
                    material: {
                        $exists: true
                    }
                }
            },
            {
                $project: {
                    material: 1
                }
            },
            {
                $sort: {
                    'material.date': -1
                }
            }
        ]);

        const data = _.map(materials, v => ({
            ...v.material
        }))

        return res.status(HttpStatus.OK).json({
            status: 200,
            data
        })
    }

    @Post(':id/lessons/:lesson_id/sessions')
    @UseGuards(AdminGuard)
    async createLessonSession(
        @Response() res,
        @Param('id') course_id,
        @Param('lesson_id') lesson_id,
        @Body() body
    ) {
        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is not valid.'
            })
        }

        if (!await this.courseModel.findById(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the course.'
            })
        }

        if (!lesson_id || !ObjectId.isValid(lesson_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Lesson ID is not valid.'
            })
        }

        const lesson = await this.lessonModel.findById(lesson_id);

        if (!lesson) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the lesson.'
            })
        }

        if (!body.sessions) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Sessions field is required.'
            })
        }

        const sessions = Array.prototype.slice.call(lesson.sessions || []);

        for (let session of body.sessions) {
            sessions.push({
                _id: new ObjectId(),
                auto_id: await this.helperService.getNextSequenceValue('sessions'),
                endTime: session.endTime,
                startTime: session.startTime,
                state: 1,
                subject: session.subject,
                subject_ch: session.subject_ch,
                toCreateZoomMeeting: session.toCreateZoomMeeting,
                zoomId: session.zoomId,
                zoomMeetingHost: session.zoomMeetingzost,
                zoomUrl: session.zoomUrl,
                zoomPassword:session.zoomPassword

            })
        }


        await this.lessonModel.findByIdAndUpdate(lesson_id, {
            $set: {
                sessions: sessions
            }
        })

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Session has been successfully created.'
        })
    }

    @Put(':id/lessons/:lesson_id/sessions/:session_id')
    async updateSession(
        @Response() res,
        @Param('id') course_id,
        @Param('lesson_id') lesson_id,
        @Param('session_id') session_id,
        @Body() body
    ) {
        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is not valid.'
            })
        }

        if (!await this.courseModel.findById(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the course.'
            })
        }

        if (!lesson_id || !ObjectId.isValid(lesson_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Lesson ID is not valid.'
            })
        }

        let lesson = await this.lessonModel.findById(lesson_id);

        if (!lesson) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the lesson.'
            })
        }

        lesson = lesson.toObject();

        const materials = _.map(body.materials, v => {
            if (!ObjectId.isValid(v)) {
                throw Error('Invalid material. Please try again.');
            }

            return new ObjectId(v);
        })

        const sessions = _.map(Array.prototype.slice.call(lesson.sessions), (v) => {
            if (v._id == session_id) {
                const newSession = _.pickBy({
                    subject: body.subject,
                    subject_ch: body.subject_ch,
                    startTime: body.startTime,
                    endTime: body.endTime,
                    zoomUrl: body.zoomUrl,
                    zoomId: body.zoomId,
                    zoomPassword: body.zoomPassword,
                    notes: body.notes,
                    state: body.state,
                    materials
                }, _.identity);

                return {
                    ...v,
                    ...newSession
                };
            }

            return v;
        });

        await this.lessonModel.findByIdAndUpdate(lesson_id, {
            $set: {
                sessions: sessions
            }
        })

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Sessions have been successfully updated.'
        })
    }

    @Delete(':id/lessons/:lesson_id/sessions/:session_id')
    @UseGuards(AdminGuard)
    async deleteSession(
        @Response() res,
        @Param('id') course_id,
        @Param('lesson_id') lesson_id,
        @Param('session_id') session_id
    ) {
        try {
            if (!course_id || !ObjectId.isValid(course_id)) {
                throw Error('Course ID is not valid.');
            }

            if (!await this.courseModel.findById(course_id)) {
                throw Error('Could not find the course.')
            }

            if (!lesson_id || !ObjectId.isValid(lesson_id)) {
                throw Error('Lesson ID is not valid.')
            }

            let lesson = await this.lessonModel.findById(lesson_id);

            if (!lesson) {
                throw Error('Could not find the lesson.')
            }

            const enrollments = await this.enrollmentsService.getEnrollments({
                lesson: new ObjectId(lesson_id),
                session: new ObjectId(session_id)
            })

            if (enrollments.length) {
                throw Error(`Cannot delete this session because it has ${enrollments.length} enrollments.`);
            }

            lesson = lesson.toObject();

            const sessions = _.filter(Array.prototype.slice.call(lesson.sessions), (v) => v._id != session_id);

            await this.lessonModel.findByIdAndUpdate(lesson_id, {
                $set: {
                    sessions: sessions
                }
            })

            return {
                status: 200,
                message: 'Sessions have been successfully deleted.'
            }
        } catch ({message}) {
            throw new BadRequestException(message);
        }
    }

    @Post(':id/lessons/:lesson_id/sessions/:session_id/complete')
    async completeSession(
        @Response() res,
        @Param('id') course_id,
        @Param('lesson_id') lesson_id,
        @Param('session_id') session_id
    ) {
        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is not valid.'
            })
        }

        if (!await this.courseModel.findById(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the course.'
            })
        }

        if (!lesson_id || !ObjectId.isValid(lesson_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Lesson ID is not valid.'
            })
        }

        let lesson = await this.lessonModel.findById(lesson_id);

        if (!lesson) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the lesson.'
            })
        }

        lesson = lesson.toObject();

        const session = _.find(lesson.sessions, {_id: new ObjectId(session_id)}) as any;

        if (!session) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the session.'
            })
        }

        const enrollments = await this.enrollmentsService.getEnrollments({
            lesson: new ObjectId(lesson_id),
            session: new ObjectId(session_id),
            state: State.Active
        })

        // const result = {
        //     credits: lesson.teacher_rate_per_session,
        //     attendees: enrollments.length,
        // };

        // creates transaction and gives the credits to the teacher

        // const transaction: Transaction = {
        //     debit_user: TransactionUserType.System,
        //     debit_type: TransactionValueType.InternalCredit,
        //     debit_amount: lesson.teacher_rate_per_session,
        //     credit_user: lesson.teacher_id,
        //     credit_type: TransactionValueType.InternalCredit,
        //     credit_amount: lesson.teacher_rate_per_session,
        //     notes: `Transfer after session completion | Session #${session.auto_id}`,
        //     type: TransactionType.CompleteEnrollment
        // }

        // await this.transactionsService.createTransaction(transaction);


        // Update session status
        const sessions = _.map(Array.prototype.slice.call(lesson.sessions), (v) => {
            if (v._id == session_id) {
                return {
                    ...v,
                    state: State.Completed
                }
            }

            return v;
        });

        await this.lessonModel.findByIdAndUpdate(lesson_id, {
            $set: {
                sessions: sessions
            }
        })

        // Update all enrollments

        await this.enrollmentsService.updateEnrollments({
            lesson: new ObjectId(lesson_id),
            session: new ObjectId(session_id),
            state:State.Active
        }, {
            state: State.Completed
        })

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: `Session has been successfully completed. `
        })
    }

    @Post(':id/lessons/:lesson_id/sessions/:session_id/cancel')
    async cancelSession(
        @Response() res,
        @Param('id') course_id,
        @Param('lesson_id') lesson_id,
        @Param('session_id') session_id
    ) {
        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is not valid.'
            })
        }

        if (!await this.courseModel.findById(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the course.'
            })
        }
        let course = await this.courseModel.findById(course_id);

        if (!lesson_id || !ObjectId.isValid(lesson_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Lesson ID is not valid.'
            })
        }

        let lesson = await this.lessonModel.findById(lesson_id);

        if (!lesson) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the lesson.'
            })
        }

        lesson = lesson.toObject();
        const session = _.find(lesson.sessions, {_id: new ObjectId(session_id)}) as any;
        if (!session) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the session.'
            })
        }

        const enrollments = await this.enrollmentsService.getEnrollments({
            lesson: new ObjectId(lesson_id),
            session: new ObjectId(session_id),
            state:1
        })

        // creates transaction and gives the credits to the teacher
        let user_emails = [];
        for (let i of enrollments) {
            await this.transactionsService.createTransaction({
                debit_user: TransactionUserType.System,
                debit_type: TransactionValueType.InternalCredit,
                debit_amount: lesson.credits_per_session,
                credit_user: i.student_family,
                credit_type: TransactionValueType.InternalCredit,
                credit_amount: lesson.credits_per_session,
                notes: `Session #${session.auto_id} has been canceled`,
                type: TransactionType.CancelEnrollment
            });
            let user_to_sendEmail = await this.usersService.getUserById(i.student_family);
            if (user_to_sendEmail) {
                user_emails.push(user_to_sendEmail.email);
            }
        }
        if (user_emails.length > 0) {
            // send reminder email session canceled
            const msg = {
                to: user_emails,
                from: 'no-reply@bilin.academy',
                subject: 'Your Bilin Academy class has been canceled!',
                html: 'Hi, <br /><br />' +
                    'The following session you enrolled in has been cancelled: <br />' +
                    '<strong><a href="https://bilin.academy/en/courses/' + lesson.course_id + '/lesson/' + lesson._id + '">' + course.topic + '</a>, ' + lesson.subtitle + ': ' + session.subject + '</strong>.<br />' +
                    'If you have any questions or to confirm that you’ve received this, <br />' +
                    'please send us a message by email (learn@bilinacademy.com) or WeChat (ID: bilinstudio).<br /><br />' +
                    'Thank you,<br /><br />' +
                    'Bilin Academy',
            };
            await sgMail.send(msg);
        }

        // Update session status
        const sessions = _.map(Array.prototype.slice.call(lesson.sessions), (v) => {
            if (v._id == session_id) {
                return {
                    ...v,
                    state: State.Canceled
                }
            }

            return v;
        });

        await this.lessonModel.findByIdAndUpdate(lesson_id, {
            $set: {
                sessions: sessions
            }
        })

        // Update all enrollments

        await this.enrollmentsService.updateEnrollments({
            lesson: new ObjectId(lesson_id),
            session: new ObjectId(session_id)
        }, {
            state: State.Canceled
        })

        // Cancel Zoom Meeting

        const teacher = await this.userService.getUserById(lesson.teacher_id);

        if (teacher.zoomId) {
            await this.zoomService.cancelMeetingIfExists(session.zoomId);
        }

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: `${enrollments.length} enrollments have been canceled. ${lesson.credits_per_session * enrollments.length} credits has been transfered to students' accounts`
        })
    }


    @Post(':id/lessons/:lesson_id/sessions/:session_id/reschedule')
    @UseGuards(AdminGuard)
    async rescheduleSession(
        @Response() res,
        @Param('id') course_id,
        @Param('lesson_id') lesson_id,
        @Param('session_id') session_id,
        @Body() body
    ) {
        if (!(body.zoomUrl && body.zoomId)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Please enter valid Zoom URL or Zoom ID.'
            })
        }

        if (!course_id || !ObjectId.isValid(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is not valid.'
            })
        }

        if (!await this.courseModel.findById(course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the course.'
            })
        }

        if (!lesson_id || !ObjectId.isValid(lesson_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Lesson ID is not valid.'
            })
        }

        let lesson = await this.lessonModel.findById(lesson_id);

        if (!lesson) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the lesson.'
            })
        }

        lesson = lesson.toObject();

        const session = _.find(lesson.sessions, {_id: new ObjectId(session_id)}) as any;

        if (!session) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the session.'
            })
        }

        // Update session status
        const sessions = _.map(Array.prototype.slice.call(lesson.sessions), (v) => {
            if (v._id == session_id) {
                return {
                    ...v,
                    zoomUrl: body.zoomUrl,
                    zoomId: body.zoomId,
                    state: State.Active
                }
            }

            return v;
        });

        await this.lessonModel.findByIdAndUpdate(lesson_id, {
            $set: {
                sessions: sessions
            }
        })

        // Delete all enrollments

        await this.enrollmentsService.deleteManyEnrollments({
            lesson: new ObjectId(lesson_id),
            session: new ObjectId(session_id)
        });

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: `Session has been successfully rescheduled.`
        })
    }
}