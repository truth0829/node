import {ObjectId} from 'bson';
import {InjectModel} from '@nestjs/mongoose';
import {Injectable} from '@nestjs/common';
import {Model} from 'mongoose';
import {HelperService} from '../helper/helper.service';
import * as _ from 'lodash';

@Injectable()
export class AssetsService {
    constructor(
        @InjectModel('Drawings') private readonly drawingsModel: Model<any>,
        @InjectModel('Materials') private readonly materialsModel: Model<any>,
        @InjectModel('Homeworks') private readonly homeworksModel: Model<any>,
        private helperService: HelperService
    ) {
    }

    async getDrawings(match = {}) {
        return await this.drawingsModel.aggregate([
            {
                $match: match
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
                    localField: 'uploaded_by',
                    foreignField: '_id',
                    as: 'uploaded_by'
                }
            },
            {
                $addFields: {
                    course: {
                        $arrayElemAt: ['$course', 0]
                    },
                    uploaded_by: {
                        $arrayElemAt: ['$uploaded_by', 0]
                    }
                }
            },
        ])
    }

    async getDrawingsByPaginate(queryOption: any = {}, match = {}) {
        return await this.drawingsModel.aggregate([
            {
                $match: match
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
                    localField: 'uploaded_by',
                    foreignField: '_id',
                    as: 'uploaded_by'
                }
            },
            {
                $addFields: {
                    course: {
                        $arrayElemAt: ['$course', 0]
                    },
                    uploaded_by: {
                        $arrayElemAt: ['$uploaded_by', 0]
                    }
                }
            },
        ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
    }

    async getNumberOfDrawings(match = {}) {
        const result = await this.drawingsModel.aggregate([
            {
                $match: match
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
                    localField: 'uploaded_by',
                    foreignField: '_id',
                    as: 'uploaded_by'
                }
            },
            {
                $addFields: {
                    course: {
                        $arrayElemAt: ['$course', 0]
                    },
                    uploaded_by: {
                        $arrayElemAt: ['$uploaded_by', 0]
                    }
                }
            },
        ])
        return result.length;
    }


    async getDrawingById(id) {
        return await this.drawingsModel.findById(id);
    }

    async createDrawing(data) {
        return await (new this.drawingsModel({
            course_id: new ObjectId(data.course_id),
            lesson_id: new ObjectId(data.lesson_id),
            session_id: new ObjectId(data.session_id),
            uploaded_by: new ObjectId(data.uploaded_by),
            date: new Date().toISOString(),
            type: data.type,
            url: data.url,
            auto_id: await this.helperService.getNextSequenceValue('drawings')
        })).save();
    }

    async deleteDrawing(id) {
        return await this.drawingsModel.findByIdAndDelete(id);
    }

    async getMaterials() {
        const materials = await this.materialsModel.find().sort({date: -1});

        const materialsCounts = await this.materialsModel.aggregate([
            {
                $lookup: {
                    from: 'lessons',
                    localField: '_id',
                    foreignField: 'sessions.materials',
                    as: 'session'
                }
            },
            {
                $unwind: '$session'
            },
            {
                $addFields: {
                    session: '$session.sessions'
                }
            },
            {
                $unwind: '$session'
            },
            {
                $project: {
                    materials: {
                        $filter: {
                            input: '$session.materials',
                            as: 'material',
                            cond: {
                                $eq: ['$_id', '$$material']
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    materials: {
                        $arrayElemAt: ['$materials', 0]
                    }
                }
            },
            {
                $group: {
                    _id: '$materials',
                    count: {$sum: 1}
                }
            },
            {
                $match: {
                    _id: {
                        $ne: null
                    }
                }
            }
        ]);

        return _.map(materials, v => {
            const countsItem = _.find(materialsCounts, {_id: v._id});

            v = v.toObject();
            v.count = countsItem ? countsItem.count : 0;

            return v;
        });
    }

    async getMaterialsByPaginate(queryOption: any = {}, search_key: any = {}) {
        if (search_key.field === "" && search_key.value === "") {
            const materials = await this.materialsModel.find().sort({date: -1})
                .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                .limit(Number(queryOption.limit));
            const materialsCounts = await this.materialsModel.aggregate([
                {
                    $lookup: {
                        from: 'lessons',
                        localField: '_id',
                        foreignField: 'sessions.materials',
                        as: 'session'
                    }
                },
                {
                    $sort: {date: -1}
                },
                {
                    $unwind: '$session'
                },
                {
                    $addFields: {
                        session: '$session.sessions'
                    }
                },
                {
                    $unwind: '$session'
                },
                {
                    $project: {
                        materials: {
                            $filter: {
                                input: '$session.materials',
                                as: 'material',
                                cond: {
                                    $eq: ['$_id', '$$material']
                                }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        materials: {
                            $arrayElemAt: ['$materials', 0]
                        }
                    }
                },
                {
                    $group: {
                        _id: '$materials',
                        count: {$sum: 1}
                    }
                },
                {
                    $match: {
                        _id: {
                            $ne: null
                        }
                    }
                }
            ])
                .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                .limit(Number(queryOption.limit));

            return _.map(materials, v => {
                const countsItem = _.find(materialsCounts, {_id: v._id});

                v = v.toObject();
                v.count = countsItem ? countsItem.count : 0;

                return v;
            });
        } else {
            switch (search_key.field) {
                case "Description": {
                    const materials = await this.materialsModel.find({
                        description: new RegExp('^' + search_key.value + '$', "i")
                    })
                        .sort({date: -1})
                        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                        .limit(Number(queryOption.limit));
                    const materialsCounts = await this.materialsModel.aggregate([
                        {
                            $match: {
                                description: new RegExp('^' + search_key.value + '$', "i")
                            }
                        },
                        {
                            $sort: {date: -1}
                        },
                        {
                            $lookup: {
                                from: 'lessons',
                                localField: '_id',
                                foreignField: 'sessions.materials',
                                as: 'session'
                            }
                        },
                        {
                            $unwind: '$session'
                        },
                        {
                            $addFields: {
                                session: '$session.sessions'
                            }
                        },
                        {
                            $unwind: '$session'
                        },
                        {
                            $project: {
                                materials: {
                                    $filter: {
                                        input: '$session.materials',
                                        as: 'material',
                                        cond: {
                                            $eq: ['$_id', '$$material']
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $addFields: {
                                materials: {
                                    $arrayElemAt: ['$materials', 0]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: '$materials',
                                count: {$sum: 1}
                            }
                        },
                        {
                            $match: {
                                _id: {
                                    $ne: null
                                }
                            }
                        }
                    ])
                        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
                        .limit(Number(queryOption.limit));

                    return _.map(materials, v => {
                        const countsItem = _.find(materialsCounts, {_id: v._id});

                        v = v.toObject();
                        v.count = countsItem ? countsItem.count : 0;

                        return v;
                    });
                }

            }
        }

    }

    async getNumberOfMaterials(search_key: any = {}) {
        if (search_key.field === "" && search_key.value === "") {
            const materials = await this.materialsModel.find().sort({date: -1});
            const materialsCounts = await this.materialsModel.aggregate([
                {
                    $lookup: {
                        from: 'lessons',
                        localField: '_id',
                        foreignField: 'sessions.materials',
                        as: 'session'
                    }
                },
                {
                    $sort: {date: -1}
                },
                {
                    $unwind: '$session'
                },
                {
                    $addFields: {
                        session: '$session.sessions'
                    }
                },
                {
                    $unwind: '$session'
                },
                {
                    $project: {
                        materials: {
                            $filter: {
                                input: '$session.materials',
                                as: 'material',
                                cond: {
                                    $eq: ['$_id', '$$material']
                                }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        materials: {
                            $arrayElemAt: ['$materials', 0]
                        }
                    }
                },
                {
                    $group: {
                        _id: '$materials',
                        count: {$sum: 1}
                    }
                },
                {
                    $match: {
                        _id: {
                            $ne: null
                        }
                    }
                }
            ]);

            const result = _.map(materials, v => {
                const countsItem = _.find(materialsCounts, {_id: v._id});

                v = v.toObject();
                v.count = countsItem ? countsItem.count : 0;

                return v;
            });
            return result.length;
        } else {
            switch (search_key.field) {
                case "Description": {
                    const materials = await this.materialsModel.find({
                        description: new RegExp('^' + search_key.value + '$', "i")
                    }).sort({date: -1});
                    const materialsCounts = await this.materialsModel.aggregate([
                        {
                            $match: {
                                description: new RegExp('^' + search_key.value + '$', "i")
                            }
                        },
                        {
                            $sort: {date: -1}
                        },
                        {
                            $lookup: {
                                from: 'lessons',
                                localField: '_id',
                                foreignField: 'sessions.materials',
                                as: 'session'
                            }
                        },
                        {
                            $unwind: '$session'
                        },
                        {
                            $addFields: {
                                session: '$session.sessions'
                            }
                        },
                        {
                            $unwind: '$session'
                        },
                        {
                            $project: {
                                materials: {
                                    $filter: {
                                        input: '$session.materials',
                                        as: 'material',
                                        cond: {
                                            $eq: ['$_id', '$$material']
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $addFields: {
                                materials: {
                                    $arrayElemAt: ['$materials', 0]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: '$materials',
                                count: {$sum: 1}
                            }
                        },
                        {
                            $match: {
                                _id: {
                                    $ne: null
                                }
                            }
                        }
                    ]);

                    const result = _.map(materials, v => {
                        const countsItem = _.find(materialsCounts, {_id: v._id});

                        v = v.toObject();
                        v.count = countsItem ? countsItem.count : 0;

                        return v;
                    });
                    return result.length;
                }

            }
        }
    }


    async getMaterialById(id) {
        const materialData = await this.materialsModel.aggregate([
            {
                $match: {
                    _id: new ObjectId(id)
                }
            },
            {
                $lookup: {
                    from: 'lessons',
                    localField: '_id',
                    foreignField: 'sessions.materials',
                    as: 'lessons'
                }
            },
            {
                $unwind: '$lessons'
            },
            {
                $unwind: '$lessons.sessions'
            },
            {
                $unwind: '$lessons.sessions.materials'
            },
            {
                $project: {
                    date: 1,
                    description: 1,
                    url: 1,
                    auto_id: 1,
                    lessons: {
                        $cond: {
                            if: {
                                $eq: ['$lessons.sessions.materials', '$_id']
                            },
                            then: '$lessons',
                            else: 0
                        }
                    }
                }
            },
            {
                $match: {
                    lessons: {
                        $ne: 0
                    }
                }
            },
            {
                $group: {
                    _id: '$_id',
                    date: {
                        $first: '$date'
                    },
                    description: {
                        $first: '$description'
                    },
                    url: {
                        $first: '$url'
                    },
                    auto_id: {
                        $first: '$auto_id'
                    },
                    lessons: {
                        $push: '$lessons'
                    }
                }
            }
        ])

        if (!materialData.length) {
            return await this.materialsModel.findById(id);
        }

        let material = _.first(materialData);

        material.lessons = _.map(material.lessons, v => ({
            session_id: v.sessions._id,
            lesson_id: v._id,
            course_id: v.course_id,
            subject: v.sessions.subject,
            subtitle: v.subtitle
        }))

        return material;
    }

    async createMaterial(data) {
        return await (new this.materialsModel({
            course_id: new ObjectId(data.course_id),
            lesson_id: new ObjectId(data.lesson_id),
            session_id: new ObjectId(data.session_id),
            date: new Date().toISOString(),
            type: data.type,
            description: data.description,
            url: data.url,
            auto_id: await this.helperService.getNextSequenceValue('materials')
        })).save();
    }

    async deleteMaterial(id) {
        return await this.materialsModel.findByIdAndDelete(id);
    }

    async getHomeworks($match = {}) {
        return await this.homeworksModel.aggregate([
            {
                $match
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
                    course: {
                        $arrayElemAt: ['$course', 0]
                    }
                }
            }
        ]);
    }

    async createHomework(data) {
        return await (new this.homeworksModel({
            course_id: new ObjectId(data.course_id),
            date: new Date().toISOString(),
            url: data.url,
            user_id: data.user_id,
            auto_id: await this.helperService.getNextSequenceValue('homeworks')
        })).save();
    }
}
