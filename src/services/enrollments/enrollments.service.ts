import { HelperService } from './../helper/helper.service';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { State } from '../../schemas/transactions';
import { ObjectId } from 'bson';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel('Enrollments') private readonly enrollmentsModel: Model<any>,
    @InjectModel('BundleEnrollments')
    private readonly bundleEnrollmentsModel: Model<any>,
    private helperService: HelperService,
  ) { }

  async getEnrollmentsByPaginate(
    queryOption: any = {},
    search_key: any = {},
    params,
  ) {
    if (search_key.field === '' && search_key.value === '') {
      return await this.enrollmentsModel
        .aggregate([
          {
            $match: params,
          },
          {
            $sort: {
              date: -1,
            },
          },
          {
            $lookup: {
              from: 'lessons',
              localField: 'lesson',
              foreignField: '_id',
              as: 'sessions',
            },
          },
          {
            $addFields: {
              sessions: {
                $arrayElemAt: ['$sessions', 0],
              },
            },
          },
          {
            $addFields: {
              sessions: '$sessions.sessions',
            },
          },
        ])
        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
        .limit(Number(queryOption.limit));
    } else {
      switch (search_key.field) {
        case 'student': {
          params.student_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          return await this.enrollmentsModel
            .aggregate([
              {
                $match: params,
              },
              {
                $sort: {
                  date: -1,
                },
              },
              {
                $lookup: {
                  from: 'lessons',
                  localField: 'lesson',
                  foreignField: '_id',
                  as: 'sessions',
                },
              },
              {
                $addFields: {
                  sessions: {
                    $arrayElemAt: ['$sessions', 0],
                  },
                },
              },
              {
                $addFields: {
                  sessions: '$sessions.sessions',
                },
              },
            ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
        }
        case 'parent': {
          params.student_family_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          return await this.enrollmentsModel
            .aggregate([
              {
                $match: params,
              },
              {
                $sort: {
                  date: -1,
                },
              },
              {
                $lookup: {
                  from: 'lessons',
                  localField: 'lesson',
                  foreignField: '_id',
                  as: 'sessions',
                },
              },
              {
                $addFields: {
                  sessions: {
                    $arrayElemAt: ['$sessions', 0],
                  },
                },
              },
              {
                $addFields: {
                  sessions: '$sessions.sessions',
                },
              },
            ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
        }
        case 'course': {
          params.course_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          return await this.enrollmentsModel
            .aggregate([
              {
                $match: params,
              },
              {
                $sort: {
                  date: -1,
                },
              },

              {
                $lookup: {
                  from: 'lessons',
                  localField: 'lesson',
                  foreignField: '_id',
                  as: 'sessions',
                },
              },
              {
                $addFields: {
                  sessions: {
                    $arrayElemAt: ['$sessions', 0],
                  },
                },
              },
              {
                $addFields: {
                  sessions: '$sessions.sessions',
                },
              },
            ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
        }
        case 'teacher': {
          params.teacher_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          return await this.enrollmentsModel
            .aggregate([
              {
                $match: params,
              },
              {
                $sort: {
                  date: -1,
                },
              },

              {
                $lookup: {
                  from: 'lessons',
                  localField: 'lesson',
                  foreignField: '_id',
                  as: 'sessions',
                },
              },
              {
                $addFields: {
                  sessions: {
                    $arrayElemAt: ['$sessions', 0],
                  },
                },
              },
              {
                $addFields: {
                  sessions: '$sessions.sessions',
                },
              },
            ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
        }
      }
    }
  }

  async getNumberOfEnrollments(search_key: any = {}, params) {
    if (search_key.field === '' && search_key.value === '') {
      // const result = await this.enrollmentsModel.aggregate([
      //   {
      //     $match: params,
      //   },
      //   {
      //     $sort: {
      //       date: -1,
      //     },
      //   },

      //   {
      //     $lookup: {
      //       from: 'lessons',
      //       localField: 'lesson',
      //       foreignField: '_id',
      //       as: 'sessions',
      //     },
      //   },
      //   {
      //     $addFields: {
      //       sessions: {
      //         $arrayElemAt: ['$sessions', 0],
      //       },
      //     },
      //   },
      //   {
      //     $addFields: {
      //       sessions: '$sessions.sessions',
      //     },
      //   },
      // ]);
      return await this.enrollmentsModel.countDocuments();
    } else {
      switch (search_key.field) {
        case 'student': {
          params.student_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          const result = await this.enrollmentsModel.aggregate([
            {
              $match: params,
            },

          ]);
          return result.length;
        }
        case 'parent': {
          params.student_family_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          const result = await this.enrollmentsModel.aggregate([
            {
              $match: params,
            },
          ]);
          return result.length;
        }
        case 'course': {
          params.course_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          const result = await this.enrollmentsModel.aggregate([
            {
              $match: params,
            },
          ]);
          return result.length;
        }
        case 'teacher': {
          params.teacher_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          const result = await this.enrollmentsModel.aggregate([
            {
              $match: params,
            },
          ]);
          return result.length;
        }
      }
    }
  }

  async getBundleEnrollmentsByPaginate(
    queryOption: any = {},
    search_key: any = {},
    params,
  ) {
    if (search_key.field === '' && search_key.value === '') {
      return await this.bundleEnrollmentsModel
        .aggregate([
          {
            $match: params,
          },
          {
            $sort: {
              date: -1,
            },
          },
          {
            $lookup: {
              from: 'bundles',
              localField: 'bundle',
              foreignField: '_id',
              as: 'bundle',
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'teacher',
              foreignField: '_id',
              as: 'teacher',
            },
          },
          {
            $addFields: {
              bundle: {
                $arrayElemAt: ['$bundle', 0],
              },
            },
          },
          {
            $addFields: {
              teacher: {
                $arrayElemAt: ['$teacher', 0],
              },
            },
          },
        ])
        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
        .limit(Number(queryOption.limit));
    } else {
      switch (search_key.field) {
        case 'title': {
          return await this.bundleEnrollmentsModel
            .aggregate([
              {
                $sort: {
                  date: -1,
                },
              },
              {
                $lookup: {
                  from: 'bundles',
                  localField: 'bundle',
                  foreignField: '_id',
                  as: 'bundle',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'teacher',
                  foreignField: '_id',
                  as: 'teacher',
                },
              },
              {
                $addFields: {
                  bundle: {
                    $arrayElemAt: ['$bundle', 0],
                  },
                },
              },
              {
                $addFields: {
                  teacher: {
                    $arrayElemAt: ['$teacher', 0],
                  },
                },
              },
              {
                $match: {
                  'bundle.bundle_title': {
                    $regex: search_key.value,
                    $options: 'i',
                  },
                },
              },
              // {
              //     $addFields: {
              //         sessions: '$sessions.sessions'
              //     }
              // }
            ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
        }
        case 'student': {
          params.student_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          return await this.bundleEnrollmentsModel
            .aggregate([
              {
                $match: params,
              },
              {
                $sort: {
                  date: -1,
                },
              },

              {
                $lookup: {
                  from: 'bundles',
                  localField: 'bundle',
                  foreignField: '_id',
                  as: 'bundle',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'teacher',
                  foreignField: '_id',
                  as: 'teacher',
                },
              },
              {
                $addFields: {
                  bundle: {
                    $arrayElemAt: ['$bundle', 0],
                  },
                },
              },
              {
                $addFields: {
                  teacher: {
                    $arrayElemAt: ['$teacher', 0],
                  },
                },
              },
              // {
              //     $addFields: {
              //         sessions: '$sessions.sessions'
              //     }
              // }
            ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
        }
        case 'parent': {
          params.student_family_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          return await this.bundleEnrollmentsModel
            .aggregate([
              {
                $match: params,
              },
              {
                $sort: {
                  date: -1,
                },
              },

              {
                $lookup: {
                  from: 'bundles',
                  localField: 'bundle',
                  foreignField: '_id',
                  as: 'bundle',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'teacher',
                  foreignField: '_id',
                  as: 'teacher',
                },
              },
              {
                $addFields: {
                  bundle: {
                    $arrayElemAt: ['$bundle', 0],
                  },
                },
              },
              {
                $addFields: {
                  teacher: {
                    $arrayElemAt: ['$teacher', 0],
                  },
                },
              },
              // {
              //     $addFields: {
              //         sessions: '$sessions.sessions'
              //     }
              // }
            ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
        }
        case 'course': {
          params.course_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          return await this.bundleEnrollmentsModel
            .aggregate([
              {
                $match: params,
              },
              {
                $sort: {
                  date: -1,
                },
              },

              {
                $lookup: {
                  from: 'bundles',
                  localField: 'bundle',
                  foreignField: '_id',
                  as: 'bundle',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'teacher',
                  foreignField: '_id',
                  as: 'teacher',
                },
              },
              {
                $addFields: {
                  bundle: {
                    $arrayElemAt: ['$bundle', 0],
                  },
                },
              },
              {
                $addFields: {
                  teacher: {
                    $arrayElemAt: ['$teacher', 0],
                  },
                },
              },
              // {
              //     $addFields: {
              //         sessions: '$sessions.sessions'
              //     }
              // }
            ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
        }
        case 'teacher': {
          return await this.bundleEnrollmentsModel
            .aggregate([
              {
                $match: params,
              },
              {
                $sort: {
                  date: -1,
                },              },

              {
                $lookup: {
                  from: 'bundles',
                  localField: 'bundle',
                  foreignField: '_id',
                  as: 'bundle',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'teacher',
                  foreignField: '_id',
                  as: 'teacher',
                },
              },
              {
                $addFields: {
                  bundle: {
                    $arrayElemAt: ['$bundle', 0],
                  },
                },
              },
              {
                $addFields: {
                  teacher: {
                    $arrayElemAt: ['$teacher', 0],
                  },
                },
              },
              {
                $match: {
                  'teacher.name': {
                    $regex: search_key.value,
                    $options: 'i',
                  },
                },
              },
              // {
              //     $addFields: {
              //         sessions: '$sessions.sessions'
              //     }
              // }
            ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
        }
      }
    }
  }

  async getNumberOfBundleEnrollments(search_key: any = {}, params,) {
    if (search_key.field === '' && search_key.value === '') {
      const result = await this.bundleEnrollmentsModel.aggregate([
        {
          $match: params,
        },
      ]);
      return result.length;
    } else {
      switch (search_key.field) {
        case 'title': {
          const result = await this.bundleEnrollmentsModel.aggregate([  
            {
              $lookup: {
                from: 'bundles',
                localField: 'bundle',
                foreignField: '_id',
                as: 'bundle',
              },
            },           
            {
              $addFields: {
                bundle: {
                  $arrayElemAt: ['$bundle', 0],
                },
              },
            },            
            {
              $match: {
                'bundle.bundle_title': {
                  $regex: search_key.value,
                  $options: 'i',
                },
              },
            },
          ]);
          return result.length;
        }
        case 'student': {
          params.student_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          const result = await this.bundleEnrollmentsModel.aggregate([
            {
              $match: params,
            },          
          ]);
          return result.length;
        }
        case 'parent': {
          params.student_family_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          const result = await this.bundleEnrollmentsModel.aggregate([
            {
              $match: params,
            }        
          ]);
          return result.length;
        }
        case 'course': {
          params.course_name = {
            $regex: search_key.value,
            $options: 'i',
          };
          const result = await this.bundleEnrollmentsModel.aggregate([
            {
              $match: params,
            }           
          ]);
          return result.length;
        }
        case 'teacher': {
          const result = await this.bundleEnrollmentsModel.aggregate([
            {
              $match: params,
            },
            {
              $sort: {
                date: -1,
              },
            },   
            {
              $lookup: {
                from: 'users',
                localField: 'teacher',
                foreignField: '_id',
                as: 'teacher',
              },
            },           
            {
              $addFields: {
                teacher: {
                  $arrayElemAt: ['$teacher', 0],
                },
              },
            },
            {
              $match: {
                'teacher.name': {
                  $regex: search_key.value,
                  $options: 'i',
                },
              },
            },
          ]);
          return result.length;
        }
      }
    }
  }

  async createEnrollment(enrollment) {
    const activeEnrollment = await this.enrollmentsModel.findOne({
      course: new ObjectId(enrollment.course),
      lesson: new ObjectId(enrollment.lesson),
      session: new ObjectId(enrollment.session),
      student_family: new ObjectId(enrollment.student_family),
      student: new ObjectId(enrollment.student),
      state: State.Active,
    });

    if (activeEnrollment) {
      throw Error('Enrollment already exists. Please try again.');
    }

    enrollment.date = new Date().toISOString();
    enrollment.state = State.Active;
    enrollment.auto_id = await this.helperService.getNextSequenceValue(
      'enrollments',
    );

    return await new this.enrollmentsModel(enrollment).save();
  }

  async existBundleEnrollment(bundle_enrollment) {
    const existEnrollment = await this.bundleEnrollmentsModel.findOne({
      course: new ObjectId(bundle_enrollment.course),
      bundle: new ObjectId(bundle_enrollment.bundle),
      student_family: new ObjectId(bundle_enrollment.student_family),
      student: new ObjectId(bundle_enrollment.student),
      state: State.Active,
    });

    return existEnrollment;
  }

  async createBundleEnrollment(bundle_enrollment) {
    // const activeEnrollment = await this.bundleEnrollmentsModel.findOne({
    //     course: new ObjectId(bundle_enrollment.course),
    //     bundle: new ObjectId(bundle_enrollment.bundle),
    //     student_family: new ObjectId(bundle_enrollment.student_family),
    //     student: new ObjectId(bundle_enrollment.student),
    //     state: State.Active
    // })

    // if (activeEnrollment) {
    //     throw Error('Presale enrollment already exists. Please try again.');
    //     return false
    // }

    bundle_enrollment.date = new Date().toISOString();
    bundle_enrollment.state = State.Active;
    bundle_enrollment.auto_id = await this.helperService.getNextSequenceValue(
      'bundle_enrollments',
    );

    return await new this.bundleEnrollmentsModel(bundle_enrollment).save();
  }

  async getEnrollments(params, ...pipes) {
    return await this.enrollmentsModel.aggregate([
      {
        $match: params,
      },
      {
        $sort: {
          date: -1,
        },
      },
      ...pipes,
      {
        $lookup: {
          from: 'lessons',
          localField: 'lesson',
          foreignField: '_id',
          as: 'sessions',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'student_family',
          foreignField: '_id',
          as: 'student_family_email',
        },
      },
      {
        $addFields: {
          sessions: {
            $arrayElemAt: ['$sessions', 0],
          },
          student_family_email: {
            $arrayElemAt: ['$student_family_email', 0],
          },
        },
      },
      {
        $addFields: {
          sessions: '$sessions.sessions',
          student_family_email: '$student_family_email.email',
        },
      },
    ]);
  }

  async getBundleEnrollments(params, ...pipes) {
    return await this.bundleEnrollmentsModel.aggregate([
      {
        $match: params,
      },
      {
        $sort: {
          date: -1,
        },
      },
      ...pipes,
    ]);
  }

  async getEnrollmentById(id) {
    return await this.enrollmentsModel.findById(id);
  }

  async getBundleEnrollmentById(id) {
    return await this.bundleEnrollmentsModel.findById(id);
  }

  async updateEnrollment(id, data) {
    return await this.enrollmentsModel.findByIdAndUpdate(id, data);
  }

  async updateBundleEnrollment(id, data) {
    return await this.bundleEnrollmentsModel.findByIdAndUpdate(id, data);
  }

  async updateEnrollments(query, data) {
    return await this.enrollmentsModel.updateMany(query, {
      $set: data,
    });
  }

  async deleteSingleEnrollment(id) {
    return await this.enrollmentsModel.findByIdAndDelete(id);
  }

  async deleteSingleBundleEnrollment(id) {
    return await this.bundleEnrollmentsModel.findByIdAndDelete(id);
  }

  async deleteManyEnrollments(params) {
    return await this.enrollmentsModel.deleteMany(params);
  }
}
