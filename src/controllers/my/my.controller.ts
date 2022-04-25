import { SchoolsService } from './../../services/schools/schools.service';
import { UserType } from './../../schemas/user';
import { AuthService } from './../../services/auth/auth.service';
import { EnrollmentsService } from '../../services/enrollments/enrollments.service';
import { Controller, Get, Request, Put, Body, Query } from '@nestjs/common';
import { ObjectId } from 'bson';
import { TransactionsService } from '../../services/transactions/transactions.service';
import { PaymentsService } from '../../services/payments/payments.service';
import { UsersService } from '../../services/users/users.service';
import { HelperService } from './../../services/helper/helper.service';
import * as _ from 'lodash';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Controller('my')
export class MyController {
  constructor(
    private enrollmentsService: EnrollmentsService,
    private transactionsService: TransactionsService,
    private paymentsService: PaymentsService,
    private usersService: UsersService,
    private authService: AuthService,
    private schoolsService: SchoolsService,
    private helperService: HelperService,
    @InjectModel('Users') private readonly userModel: Model<any>,
    @InjectModel('Enrollments') private readonly enrollmentsModel: Model<any>,
    @InjectModel('Commissions') private readonly commissionModel: Model<any>,
    @InjectModel('BundleEnrollments')
    private readonly bundleEnrollmentsModel: Model<any>,
  ) { }

  @Get('enrollments')
  async getMyEnrollments(@Request() req, @Query('teacher') teacher) {
    let pipes: any = [
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course',
        },
      },
      {
        $lookup: {
          from: 'lessons',
          localField: 'lesson',
          foreignField: '_id',
          as: 'lesson',
        },
      },
      {
        $addFields: {
          course: {
            $arrayElemAt: ['$course', 0],
          },
          lesson: {
            $arrayElemAt: ['$lesson', 0],
          },
        },
      },
    ];

    if (teacher === 'true') {
      pipes = _.concat(pipes, [
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
      ]);
    }

    const enrollments = await this.enrollmentsService.getEnrollments(
      { student_family: new ObjectId(req.user.id) },
      ...pipes,
    );

    return {
      status: 200,
      data: enrollments,
    };
  }

  @Get('bundles')
  async getMyBundles(@Request() req) {
    let pipes: any = [
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
          from: 'bundleenrollments',
          localField: '_id',
          foreignField: 'bundle',
          as: 'enrollment',
        },
      },
      {
        $addFields: {
          bundle: {
            $arrayElemAt: ['$bundle', 0],
          },
        },
      },
    ];

    const bundles = await this.enrollmentsService.getBundleEnrollments(
      { student_family: new ObjectId(req.user.id) },
      ...pipes,
    );
    return {
      status: 200,
      data: bundles,
    };
  }

  @Get('wechat_bundles')
  async getMyWechatBundles(@Request() req) {
    let pipes: any = [
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
          from: 'bundleenrollments',
          localField: '_id',
          foreignField: 'bundle',
          as: 'enrollment',
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course',
        },
      },
      {
        $lookup: {
          from: 'bundleenrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollment',
        },
      },
      {
        $addFields: {
          bundle: {
            $arrayElemAt: ['$bundle', 0],
          },
          course: {
            $arrayElemAt: ['$course', 0],
          },
        },
      },
    ];

    const bundles = await this.enrollmentsService.getBundleEnrollments(
      { student_family: new ObjectId(req.user.id) },
      ...pipes,
    );
    return {
      status: 200,
      data: bundles,
    };
  }

  @Get('transactions')
  async getMyTransactions(@Request() req) {
    return {
      status: 200,
      data: await this.transactionsService.getAllTransactionsForUser(
        req.user.id,
      ),
    };
  }
  @Get('getMypromoterUsers')
  async getMypromoterUsers(
    @Request() req,
    @Query('promoter_id') promoter_id: number = 0) { 
    let lesson_data = await this.userModel.aggregate([
      {
        $match: {
          registerByPromoterId: Number(promoter_id)
        },
      },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'student_family',
          as: 'enrollments',
        },
      },
      {
        $unwind: "$enrollments"
      },        
      {
        $addFields: {
          bundleenrollments: [],
        },
      }, 

    ])
    let bundleData =  
    await this.userModel.aggregate([
      {
        $match: {
          registerByPromoterId: Number(promoter_id)
        },
      },
      {
        $lookup: {
          from: 'bundleenrollments',
          localField: '_id',
          foreignField: 'student_family',
          as: 'bundleenrollments',
        },
      },
      {
        $unwind: "$bundleenrollments"
      },       
      {
        $addFields: {
          enrollments: [],
        },
      }, 
    ])
    let data = lesson_data.concat(bundleData)
    return {
      status: 200,
      data: data
    }
  }
  @Get('getPaidCommission')
  async getPaidCommission( 
    @Request() req,
    @Query('userId') userId: string)  {
      return {
        status: 200,
        data: await this.commissionModel.find({ student_family: userId})
      };
  }

  @Get('payments')
  async getMyPayments(@Request() req) {
    return {
      status: 200,
      data: await this.paymentsService.getPaymentsByUserId(req.user.id),
    };
  }

  @Get('profile')
  async getProfile(@Request() req) {
    let data = await this.usersService.getUserByUsername(req.user.username);
    data = data.toObject();
    if (data.type === UserType.SchoolAdmin) {
      data.adminSchool = await this.schoolsService.getSchoolByAdminId(data._id);
    }
    const response: any = {
      status: 200,
      data,
    };
    if (req.user.exp * 1000 - Date.now() < 86400 * 10000) {
      const { token } = await this.authService.createToken(
        req.user.id,
        req.user.username,
        req.user.isAdmin,
      );

      response.token = token;
    }

    return response;
  }
  @Put('promoter')
  async updatePromoter(@Request() req, @Body() body) {
    var newProfile;
    const user = await this.userModel.findById(body.userID);
    if (body.promotor && user.promoter_id == undefined) {
      newProfile = {
        promotor: body.promotor,
        promotorRate: parseInt(body.promote_rate),
        promoter_id: await this.helperService.getNextSequenceValue('promoters')
      };
    }
    else {
      newProfile = {
        promotor: body.promotor,
        promotorRate: parseInt(body.promote_rate)
      };
    }
    const updated_user = await this.usersService.updateUser(
      body.userID,
      newProfile,
    );
    return {
      status: 200,
      data: updated_user,
      message: 'Promoter has been successfully updated.',
    };
  }
  @Put('profile')
  async updateProfile(@Request() req, @Body() body) {
    let phone = body.phone;
    var newProfile;
    console.log(phone);
    newProfile = {
      name: body.name,
      facebook: body.facebook,
      wechat: body.wechat,
      classin: body.classin,
      profile_picture: body.profile_picture,
    };
    if (phone !== undefined) {
      newProfile = _.pickBy(
        {
          name: body.name,
          phone: body.phone,
          facebook: body.facebook,
          wechat: body.wechat,
          classin: body.classin,
          profile_picture: body.profile_picture,
          children: body.children,
          resume: body.resume,
        },
        _.identity,
      );
    }
    if (typeof body.school !== undefined) {
      newProfile.school = body.school || null;
    }

    // if(typeof newProfile.phone !== undefined){
    if (phone !== undefined) {
      newProfile.phoneVerified = false;
    }

    // if (phone !== undefined) {
    //     let other_user_has_this_phone = await this.usersService.getUserByPhoneandID(body.phone, req.user.id);
    //     if (other_user_has_this_phone.length != 0) {
    //         return {
    //             status: 400,
    //             message: 'Phone number has been registered by others'
    //         }
    //     } else {
    //         await this.usersService.updateUser(req.user.id, newProfile);
    //         return {
    //             status: 200,
    //             message: 'Profile has been successfully updated.'
    //         }
    //     }
    // } else {  
    const updated_user = await this.usersService.updateUser(
      req.user.id,
      newProfile,
    );
    return {
      status: 200,
      data: updated_user,
      message: 'Profile has been successfully updated.',
    };
    // }
  }
  @Put('resume')
  async putResume(@Request() req, @Body() body) {
    var resume;
    resume = {
      resume: body.resume,
    };
    const updated_user = await this.usersService.upLoadresume(
      req.user.id,
      resume,
    );
    return {
      status: 200,
      data: updated_user,
      message: 'Resume has been successfully uploaded.',
    };
  }
}
