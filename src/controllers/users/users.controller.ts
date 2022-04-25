import {AdminGuard} from './../../guards/admin.guard';
import {UserType} from './../../schemas/user';
import {
    Controller,
    Get,
    Query,
    Body,
    Response,
    Post,
    HttpStatus,
    Param,
    Put,
    Delete,
    UseGuards,
    Request
} from '@nestjs/common';
import {UsersService} from '../../services/users/users.service';
import {ObjectId} from 'bson';
import {EnrollmentsService} from '../../services/enrollments/enrollments.service';
import * as sgMail from '@sendgrid/mail';

import * as _ from 'lodash';
import {TestimonialService} from "../../services/testimonial/testimonial.service";
import {PartnersService} from "../../services/partners/partners.service";
import {State} from './../../schemas/transactions';

@Controller('users')
export class UsersController {
    constructor(
        private usersService: UsersService,
        private enrollmentsService: EnrollmentsService,
        private testimonialService: TestimonialService,
        private partnersService: PartnersService
    ) {
        sgMail.setApiKey('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');
    }

    @Get('')
    @UseGuards(AdminGuard)
    async getAll(
        @Query('q') query,
        @Query('type') type
    ) {
        const aggregatePipe: any = {
            name: {
                $regex: new RegExp(query || ''),
                $options: 'gi'
            }
        };

        if (type && !Number.isNaN(parseInt(type))) {
            type = _.split(type, ',');
            aggregatePipe.type = {
                $in: _.map(type, v => parseInt(v))
            }
        }

        return {
            status: 200,
            data: await this.usersService.getUsers(aggregatePipe)
        }
    }
    @Get('getCommissions')
    @UseGuards(AdminGuard)
    async getCommissions(
        @Query('id') id   
    ){     
        const data = await this.usersService.getCommissions(id)   
        return {
            status: 200,
            data
        }
    }
    @Delete('deleteCommision/:id')
    @UseGuards(AdminGuard)
    async deleteCommision(
        @Response() res,
        @Param('id') id
    ){   
        console.log(id);
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Commission ID is not valid.'
            })
        }
        await this.usersService.deleteCommision(id)   ;
        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Commission has been successfully removed.'
        })
     
    }
    @Post('addCommission')
    @UseGuards(AdminGuard)
    async addCommisssions(
        @Response() res,
        @Body() body 
    ){
        if (!(body.amount)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Please enter valid amount.'
            })
        }
        const commission = {
            amount: body.amount,
            student_family: body.userID,
            date: new Date().toISOString()     
        }
        await this.usersService.addCommission(commission); 
        const data = await this.usersService.getCommissions(body.userID)
        return res.status(HttpStatus.OK).json({
            status: 200,
            data: data
        })
    }
    @Get('paginate-balanceusers')
    @UseGuards(AdminGuard)
    async getBalanceUsersByPaginate(
        @Query('q') query,
        @Query('type') type,
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1
    ) {
        const aggregatePipe: any = {
            name: {
                $regex: new RegExp(query || ''),
                $options: 'gi'
            }
        };

        if (type && !Number.isNaN(parseInt(type))) {
            type = _.split(type, ',');
            aggregatePipe.type = {
                $in: _.map(type, v => parseInt(v))
            }
        }

        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };

        const data = await this.usersService.getBalanceUsersByPaginate(
            queryOption, aggregatePipe
        );
        if (Number(first_load) == 1) {

            const number_of_users = await this.usersService.getNumberOfBalanceUsers(aggregatePipe);
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

    @Get('paginate-users')
    @UseGuards(AdminGuard)
    async getUsersByPaginate(
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1,
        @Query('field') field: string = "",
        @Query('value') value: string = "",
        @Query('school') school: string = "",
        @Query('user_type') user_type:string = ""
    ) {
        let limit = 20;
        let userType;
        let promoter = false;
        if(user_type == "teachers"){
            userType = [1,3]
        };
        if(user_type == "students"){
            userType = [2]
        };
        if(user_type == "admin"){
            userType = [4,5]
        };
        if(user_type == "all"){
            userType = [1,2,3,4,5]
        };
        if(user_type == "promoters"){
            userType = [1,2,3,4,5]
            promoter = true
        };
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const search_key: any = {
            field: field,
            value: value
        };
        const data = await this.usersService.getUsersByPaginate(
            queryOption, search_key, school, userType, promoter
        );     
        if (Number(first_load) == 1) {
            const number_of_users = await this.usersService.getNumberOfUsers(search_key, school,userType,promoter);
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

    @Get('paginate-adminusers')
    @UseGuards(AdminGuard)
    async getAdminUsersByPaginate(
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1
    ) {
        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const data = await this.usersService.getAdminUsersByPaginate(queryOption);
        if (Number(first_load) == 1) {

            const number_of_users = await this.usersService.getNumberOfAdminUsers();
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


    @Get('paginate-featureteachers')
    @UseGuards(AdminGuard)
    async getFeatureTeachersByPaginate(
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1
    ) {
        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const data = await this.usersService.getFeatureTeachersByPaginate(queryOption);
        if (Number(first_load) == 1) {

            const number_of_users = await this.usersService.getNumberOfFeatureTeachers();
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

    @Get('featureteachersforhome')
    // @UseGuards(AdminGuard)
    async getFeatureTeachersForHome(
        @Query('limit') limit: number = 3
    ) {
        const queryOption: any = {
            offset: 1,
            limit: limit
        };
        const data = await this.usersService.getFeatureTeachersByPaginate(queryOption);
        return {
            status: 200,
            data
        }
    }

    @Get('testimonialforhome')
    async getTestimonialForHome(
        @Request() req: any,
        @Query('limit') limit: number = 3
    ) {
        var language = '';
        if (req.headers.referer) {
            if (req.headers.referer.includes("en")) {
                language = "English";
            }
            if (req.headers.referer.includes("ch")) {
                language = "Chinese";
            }
        } else {
            language = "English";
        }

        const data = await this.testimonialService.getAllTestimonialForHome(language);
        return {
            status: 200,
            data
        }
    }

    @Get('partnersforhome')
    async getPartnersForHome(
        @Query('limit') limit: number = 5,
    ) {
        const data = await this.partnersService.getAllPartnersForHome();
        return {
            status: 200,
            data
        }
    }

    @Get('children')
    @UseGuards(AdminGuard)
    async getUsersByChildName(
        @Query('q') query
    ) {
        const data = await this.usersService.getUsers(
            {type: UserType.Student},
            {
                $unwind: '$children'
            },
            {
                $match: {
                    'children.name': {
                        $regex: new RegExp(query || ''),
                        $options: 'gi'
                    }
                }
            }
        );
        return {
            status: 200,
            data
        }
    }

    @Get('teachers')
    async getTeachers(
        @Query('q') query,
        @Query('courses_offering') courses_offering,
        @Query('rating') rating
    ) {
        const aggregatePipe = {
            name: {
                $regex: new RegExp(query || ''),
                $options: 'gi'
            },
            type: UserType.Teacher,
            is_retired: {
                $ne: true
            }
        };

        // let extraPipes: any = [
        //     {
        //         $project: {
        //             password: 0,
        //         }
        //     }
        // ];
        let extraPipes = [];
        if (courses_offering) {
            extraPipes = _.concat([], extraPipes, [
                {
                    $lookup: {
                        from: 'lessons',
                        localField: '_id',
                        foreignField: 'teacher_id',
                        as: 'courses_offering'
                    }
                },
                {
                    $project: {
                        courses_offering: {
                            $filter: {
                                input: "$courses_offering",
                                as: "item",
                                cond: {
                                    $eq: ["$$item.state", 1]
                                }
                            }
                        },
                        _id: true,
                        name: true,
                        profile_picture: true,
                        introduction: true,
                        introduction_ch: true,
                        rating: true
                    }
                },
                {
                    $addFields: {
                        courses_offering: {
                            $size: '$courses_offering'
                        }
                    }
                }
            ])
        }

        if (rating) {
            extraPipes = _.concat([], extraPipes, [
                {
                    $lookup: {
                        from: 'reviews',
                        localField: '_id',
                        foreignField: 'to',
                        as: 'rating'
                    }
                },
                {
                    $addFields: {
                        rating: {
                            $avg: '$rating.stars'
                        }
                    }
                }
            ])
        }

        return {
            status: 200,
            data: await this.usersService.getUsers(aggregatePipe, ...extraPipes)
        }
    }

    @Get(':id')
    async getSingleUser(
        @Response() res,
        @Param('id') id
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'User ID is not valid.'
            })
        }

        return res.status(HttpStatus.OK).json({
            status: 200,
            data: await this.usersService.getUserById(id),
            is_feature: await this.usersService.isFeature(id)
        })
    }

    @Post('students')
    async createStudent(
        @Response() res,
        @Body() body
    ) {
        if (!(body.email && body.name && body.password && body.phone)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Please enter all fields.'
            })
        }

        const user = {
            username: body.email,
            email: body.email,
            name: body.name,
            password: body.password,
            phone: body.phone,
            children: body.children,
            type: UserType.Student
        }

        const newUser = await this.usersService.createUser(user);

        delete newUser.password;
        delete newUser.emailVerified;

        const {emailVerified} = await this.usersService.getUserByIdWithEmailKey(newUser._id);

        const msg = {
            to: newUser.email,
            from: 'no-reply@bilin.academy',
            subject: 'Verify your email',
            html: `<strong>Please click on the link below to verify your email address.</strong><br /><a href="https://bilin.academy/en/authentication/verify-email?q=${emailVerified}">Verify Email</a>`,
        };
        try {
            await sgMail.send(msg);
            return res.status(HttpStatus.OK).json({
                status: 200,
                data: newUser,
                message: 'Student has been successfully created'
            })
        } catch (e) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Error in sending email to ' + body.email
            })
        }
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    async deleteSingleUser(
        @Response() res,
        @Param('id') id
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'User ID is not valid.'
            })
        }

        const user = await this.usersService.getUserById(id);

        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: `Could not find the user.`
            })
        }

        if (user.type === UserType.SchoolAdmin || user.type === UserType.SuperAdmin) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: `You don't have permissions to delete this user.`
            })
        }

        const aggregatePipe: any = {};

        if (user.type === UserType.Student) {
            aggregatePipe.student_family = new ObjectId(id);
        } else {
            aggregatePipe.teacher = new ObjectId(id);
        }

        await this.usersService.deleteUser(id);
        await this.enrollmentsService.deleteManyEnrollments(aggregatePipe);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: `User has been successfully removed.`
        })
    }

    @Post('teachers')
    async createTeacher(
        @Response() res,
        @Body() body
    ) {
        if (!(body.email && body.name && body.password && body.phone && body.profile_picture && body.introduction)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Please enter all fields.'
            })
        }

        const user = {
            username: body.email,
            email: body.email,
            name: body.name,
            password: body.password,
            phone: body.phone,
            profile_picture: body.profile_picture,
            introduction: body.introduction,
            introduction_ch: body.introduction_ch,
            type: UserType.Teacher,
            emailVerified: ''
        }

        const newUser = await this.usersService.createUser(user);

        delete newUser.password;
        delete newUser.emailVerified;

        return res.status(HttpStatus.OK).json({
            status: 200,
            data: newUser,
            message: 'Teacher has been successfully created'
        })
    }

    @Put('teachers/:tid/approve')
    @UseGuards(AdminGuard)
    async approveTeacher(
        @Param('tid') tid,
        @Response() res
    ) {
        if (!tid || !ObjectId.isValid(tid)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Teacher ID is not valid.'
            })
        }

        const user = await this.usersService.getUserById(tid);

        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'User doesn\'t exist'
            })
        }

        if (user.type !== UserType.UnApprovedTeacher) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: `User is not a teacher or has been approved already.`
            })
        }

        await this.usersService.updateUser(tid, {
            type: UserType.Teacher
        })

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: `Teacher has been successfully approved.`
        })
    }

    @Put('teachers/:tid/featureteacher')
    @UseGuards(AdminGuard)
    async setFeatureTeacher(
        @Param('tid') tid,
        @Response() res
    ) {
        if (!tid || !ObjectId.isValid(tid)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Teacher ID is not valid.'
            })
        }

        const user = await this.usersService.getUserById(tid);

        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Teacher doesn\'t exist'
            })
        } else {
            // set this Teacher as feature
            user.is_feature = true;
            user.save();

            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Teacher has been successfully set as Feature.',
            })
        }

        // if (user.type !== UserType.UnApprovedTeacher) {
        //     return res.status(HttpStatus.BAD_REQUEST).json({
        //         message: `User is not a teacher or has been approved already.`
        //     })
        // }
    }


    @Put('teachers/:tid/retireTeacher')
    @UseGuards(AdminGuard)
    async setRetireTeacher(
        @Param('tid') tid,
        @Response() res
    ) {
        if (!tid || !ObjectId.isValid(tid)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Teacher ID is not valid.'
            })
        }

        const user = await this.usersService.getUserById(tid);

        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Teacher doesn\'t exist'
            })
        } else {
            // set the teacher retired
            user.is_retired = true;
            user.save();

            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Teacher got retired successfully.',
            })
        }
    }

    @Put('teachers/:tid/removeRetireTeacher')
    @UseGuards(AdminGuard)
    async removeRetireTeacher(
        @Param('tid') tid,
        @Response() res
    ) {
        if (!tid || !ObjectId.isValid(tid)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Teacher ID is not valid.'
            })
        }

        const user = await this.usersService.getUserById(tid);

        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Teacher doesn\'t exist'
            })
        } else {
            // set the teacher not retired
            user.is_retired = false;
            user.save();

            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Teacher did not get retired successfully.',
            })
        }
    }

    @Put('teachers/:tid/removefeatureteacher')
    @UseGuards(AdminGuard)
    async removeFeatureTeacher(
        @Param('tid') tid,
        @Response() res
    ) {
        if (!tid || !ObjectId.isValid(tid)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Teacher ID is not valid.'
            })
        }

        const user = await this.usersService.getUserById(tid);

        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Teacher doesn\'t exist'
            })
        } else {
            user.is_feature = false;
            user.save();
            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Teacher has been successfully deleted from Feature.'
            })
        }

        // if (user.type !== UserType.UnApprovedTeacher) {
        //     return res.status(HttpStatus.BAD_REQUEST).json({
        //         message: `User is not a teacher or has been approved already.`
        //     })
        // }
    }
}
