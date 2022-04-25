import {AdminGuard} from './../../guards/admin.guard';
import {UserType} from './../../schemas/user';
import {CoursesService} from './../../services/courses/courses.service';
import {CommentsService} from './../../services/comments/comments.service';
import {Controller, Get, Body, Post, Response, HttpStatus, Param, Delete, Put, UseGuards, Query} from '@nestjs/common';
import {ReviewsService} from '../../services/reviews/reviews.service';
import {PaymentsService} from '../../services/payments/payments.service';
import {TransactionsService} from '../../services/transactions/transactions.service';
import {ObjectId} from 'bson';
import {SettingsService} from '../../services/settings/settings.service';
import {UsersService} from '../../services/users/users.service';
import * as _ from 'lodash';
import {EnrollmentsService} from '../../services/enrollments/enrollments.service';
import {isEmail} from 'validator';
import {TransactionValueType, TransactionUserType, TransactionType} from '../../schemas/transactions';
import {Transaction} from '../../schemas/transactions';
import {TestimonialService} from "../../services/testimonial/testimonial.service";
import {PartnersService} from "../../services/partners/partners.service";

@Controller('admin')
export class AdminController {
    constructor(
        private coursesService: CoursesService,
        private commentsService: CommentsService,
        private reviewsService: ReviewsService,
        private paymentsService: PaymentsService,
        private transactionsService: TransactionsService,
        private usersService: UsersService,
        private enrollmentsService: EnrollmentsService,
        private testimonialService: TestimonialService,
        private partnersService: PartnersService
    ) {
    }

    @Post('')
    @UseGuards(AdminGuard)
    async addAdmin(
        @Response() res,
        @Body() body
    ) {
        try {
            if (!body.userid || Number.isNaN(parseInt(body.userid))) {
                throw Error('Invalid user ID.');
            }

            const user = await this.usersService.getUserByAutoId(parseInt(body.userid));

            if (!user) {
                throw Error('Could not find the user.');
            }

            if (user.type === UserType.SuperAdmin || user.type === UserType.SchoolAdmin) {
                throw Error('User is already an admin.');
            }

            await this.usersService.updateUser(user._id, {
                type: UserType.SchoolAdmin
            })

            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Admin has been successfully created.'
            })

        } catch (e) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: e.message
            })
        }

    }

    @Put('teachers/:id')
    @UseGuards(AdminGuard)
    async editAdminTeachers(
        @Param('id') id,
        @Response() res,
        @Body() body
    ) {
        try {
            if (!ObjectId.isValid(id)) {
                throw Error('ID is not valid.');
            }

            if (!(body.teachers && Array.isArray(body.teachers))) {
                throw Error('Invalid teachers list.');
            }

            const teachers = [];

            for (let teacher of body.teachers) {
                if (isEmail(teacher)) {
                    const u = await this.usersService.getUserByUsername(teacher);

                    if (u && u._id && u.type === 1) {
                        teachers.push(u._id);
                    }
                } else if (ObjectId.isValid(teacher)) {
                    const u = await this.usersService.getUserById(teacher);

                    if (u && u._id && u.type === 1) {
                        teachers.push(u._id);
                    }
                }
            }

            await this.usersService.updateAdmin(id, {
                localTeachers: _.uniq(teachers)
            })

            return res.status(HttpStatus.OK).json({
                status: 200,
                message: `${teachers.length} teachers have been added to admin's account.`
            })

        } catch ({message}) {
            return res.status(400).json({message});
        }
    }

    @Get('comments')
    @UseGuards(AdminGuard)
    async getAllComments() {
        return {
            status: 200,
            data: await this.commentsService.getAllComments()
        }
    }

    @Get('paginate-comments')
    @UseGuards(AdminGuard)
    async getCommentsByPaginate(
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1
    ) {
        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const data = await this.commentsService.getAllCommentsByPaginate(
            queryOption
        );
        if (Number(first_load) == 1) {

            const number_of_users = await this.commentsService.getAllNumberOfComments();
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

    @Get('reviews')
    @UseGuards(AdminGuard)
    async getAllReviews() {
        return {
            status: 200,
            data: await this.reviewsService.getAllReviews()
        };
    }

    @Get('paginate-reviews')
    @UseGuards(AdminGuard)
    async getReviewsByPaginate(
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1
    ) {
        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const data = await this.reviewsService.getAllReviewsByPaginate(
            queryOption
        );
        if (Number(first_load) == 1) {

            const number_of_users = await this.reviewsService.getAllNumberOfReviews();
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

    @Get('payments')
    @UseGuards(AdminGuard)
    async getAllPayments() {
        return {
            status: 200,
            data: await this.paymentsService.getAllPayments()
        };
    }

    @Get('paginate-payments')
    @UseGuards(AdminGuard)
    async getPaymentsByPaginate(
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1
    ) {
        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const data = await this.paymentsService.getAllPaymentsByPaginate(
            queryOption
        );
        if (Number(first_load) == 1) {

            const number_of_users = await this.paymentsService.getAllNumberOfPayments();
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

    @Get('transactions')
    @UseGuards(AdminGuard)
    async getAllTransactions() {
        return {
            status: 200,
            data: await this.transactionsService.getAllTransactions()
        };
    }

    @Get('paginate-transactions')
    @UseGuards(AdminGuard)
    async getTransactionsByPaginate(
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1,
        @Query('field') field: string = "",
        @Query('value') value: string = "",
    ) {
        let limit = 30;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const search_key: any = {
            field: field,
            value: value
        };

        const data = await this.transactionsService.getAllTransactionsByPaginate(
            queryOption, search_key
        );
        if (Number(first_load) == 1) {
            const number_of_users = await this.transactionsService.getAllNumberOfTransactions(search_key);
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

    @Post('transactions')
    @UseGuards(AdminGuard)
    async createTransaction(
        @Response() res,
        @Body() body
    ) {
        if (!((body.debit_user === 0 || ObjectId.isValid(body.debit_user)) && (body.credit_user === 0 || ObjectId.isValid(body.credit_user)) && body.credit_type && body.debit_type && body.debit_amount && body.credit_amount)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Transaction is invalid.'
            })
        }

        await this.transactionsService.createTransaction({
            debit_user: body.debit_user,
            debit_amount: body.debit_amount,
            debit_type: body.debit_type,
            credit_user: body.credit_user,
            credit_amount: body.credit_amount,
            credit_type: body.credit_type,
            notes: body.notes,
            type: body.type
        })

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Transaction has been successfully created.'
        })
    }

    @Post('enrollments')
    @UseGuards(AdminGuard)
    async enroll(
        @Response() res,
        @Body() body
    ) {
        // Checking students
        if (!body.student || !ObjectId.isValid(body.student)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Student ID is not valid.'
            })
        }

        if (!body.student_family || !ObjectId.isValid(body.student_family)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Student Family ID is not valid.'
            })
        }

        const student_family = await this.usersService.getUserById(body.student_family);

        if (!student_family) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the student family.'
            })
        }

        const student = _.find(student_family.children, {_id: new ObjectId(body.student)}) as any;

        if (!student) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the student.'
            })
        }

        // Checking course, lesson & session
        if (!body.course || !ObjectId.isValid(body.course)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Course ID is not valid.'
            })
        }

        const course = await this.coursesService.getCourseById(body.course);

        if (!course) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the course.'
            })
        }

        if (!body.lesson || !ObjectId.isValid(body.lesson)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Lesson ID is not valid.'
            })
        }

        const lesson = await this.coursesService.getLessonById(body.lesson);

        if (!lesson) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the lesson.'
            })
        }


        if (!body.session || !ObjectId.isValid(body.session)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Session ID is not valid.'
            })
        }

        const session = await this.coursesService.getSessionById(body.lesson, body.session);

        if (!session) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the session.'
            })
        }

        try {
            // Checking if user has enough balance
            if (student_family.balance < lesson.credits_per_session) {
                throw Error('Student doesn\'t have enough credits');
            }          

            const enrollment = await this.enrollmentsService.createEnrollment({
                student: student._id,
                student_name: student.name,

                student_family: student_family._id,
                student_family_name: student_family.name,

                course: course._id,
                course_name: course.topic,

                lesson: lesson._id,

                teacher: lesson.teacher_id,
                teacher_name: body.teacher_name,

                session: session._id,
                session_auto_id: session.auto_id
            });
            const transaction: Transaction = {
                debit_user: student_family._id,
                debit_type: TransactionValueType.InternalCredit,
                debit_amount: lesson.credits_per_session,
                credit_user: TransactionUserType.System,
                credit_type: TransactionValueType.InternalCredit,
                credit_amount: lesson.credits_per_session,
                notes: `Enrollment to ${course.topic} | Lesson #${lesson.auto_id} Session #${session.auto_id}`,
                type: TransactionType.Enrollment
            }

            await this.transactionsService.createTransaction(transaction);

            return res.status(HttpStatus.OK).json({
                status: 200,
                data: enrollment
            })
        } catch (e) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: e.message
            })
        }
    }

    @Post('bundle-enrollments')
    @UseGuards(AdminGuard)
    async enrollBundle(
        @Response() res,
        @Body() body
    ) {
        // Checking students
        if (!body.student || !ObjectId.isValid(body.student)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Student ID is not valid.'
            })
        }

        if (!body.student_family || !ObjectId.isValid(body.student_family)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Student Family ID is not valid.'
            })
        }

        const student_family = await this.usersService.getUserById(body.student_family);

        if (!student_family) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the student family.'
            })
        }

        const student = _.find(student_family.children, {_id: new ObjectId(body.student)}) as any;

        if (!student) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the student.'
            })
        }
        const bundle = await this.coursesService.getBundleById(body.bundle);
        if (!bundle) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find Package.'
            })
        }

        const course = await this.coursesService.getCourseById(bundle.course_id);
        if (!course) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the course.'
            })
        }

        try {
            // Checking if user has enough balance
            if (student_family.balance < bundle.tuition) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Student doesn\'t have enough credits'
                })
            }

            const bundle_enrollment = await this.enrollmentsService.createBundleEnrollment({
                student: student._id,
                student_name: student.name,
                student_family: student_family._id,
                student_family_name: student_family.name,
                course: course._id,
                course_name: course.topic,
                bundle: bundle._id,
                teacher: bundle.teacher_id,
                teacher_name: body.teacher_name,
            });

            // Creting a transaction
            const transaction: Transaction = {
                debit_user: student_family._id,
                debit_type: TransactionValueType.InternalCredit,
                debit_amount: bundle.tuition,
                credit_user: TransactionUserType.System,
                credit_type: TransactionValueType.InternalCredit,
                credit_amount: bundle.tuition,
                notes: `Enrollment to ${course.topic} | Package #${bundle.auto_id}`,
                type: TransactionType.Enrollment
            }

            await this.transactionsService.createTransaction(transaction);

            return res.status(HttpStatus.OK).json({
                status: 200,
                data: bundle_enrollment
            })

        } catch (e) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: e.message
            })
        }
    }

    @Put('users/:id')
    @UseGuards(AdminGuard)
    async updateUser(
        @Response() res,
        @Param('id') id,
        @Body() body
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'User ID is invalid.'
            })
        }

        const user = await this.usersService.getUserById(id);

        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the user.'
            })
        }

        const newuser = _.pickBy({
            type: body.type,
            zoomId: body.zoomId,
            status: body.status
        }, _.identity);

        if (typeof body.school !== 'undefined') {
            newuser.school = body.school || null;
        }
        if (typeof body.introduction !== 'undefined') {
            if (body.en_or_ch == 'en') {
                newuser.introduction = body.introduction || null;
            }
            else if (body.en_or_ch == 'ch') {
                newuser.introduction_ch = body.introduction || null;
            }
        }
        await this.usersService.updateUser(id, newuser);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'User has been successfully updated.'
        })
    }

    @Get('paginate-testimonial')
    @UseGuards(AdminGuard)
    async getTestimonialByPaginate(
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1
    ) {
        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const data = await this.testimonialService.getAllTestimonialByPaginate(
            queryOption
        );
        if (Number(first_load) == 1) {
            const number_of_users = await this.testimonialService.getAllNumberOfTestimonial();
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


    @Post('testimonial')
    async addTestimonial(
        @Response() res,
        @Body() body
    ) {
        try {
            await this.testimonialService.createTestimonial(body);
            return res.status(200).json({
                status: 200,
                message: 'Testimonial has been successfully created.'
            })

        } catch ({message}) {
            return res.status(400).json({message});
        }
    }

    @Delete('testimonial/:id')
    async deleteTestimonial(
        @Response() res,
        @Param('id') id
    ) {
        try {
            if (!id || !ObjectId.isValid(id)) {
                throw Error('Invalid testimonial object.');
            }
            await this.testimonialService.deleteTestimonial(id);
            return res.status(200).json({
                status: 200,
                message: 'Testimonial has been successfully deleted.'
            })
        } catch ({message}) {
            return res.status(400).json({message});
        }
    }

    @Put('testimonial/:id')
    async editTestimonial(
        @Response() res,
        @Param('id') id,
        @Body() body
    ) {
        try {
            if (!id || !ObjectId.isValid(id)) {
                throw Error('Invalid testimonial object.');
            }
            await this.testimonialService.editTestimonial(id, body);
            return res.status(200).json({
                status: 200,
                message: 'Testimonial has been successfully updated.'
            })
        } catch ({message}) {
            return res.status(400).json({message});
        }
    }

    //    controller for partners
    @Get('paginate-partners')
    @UseGuards(AdminGuard)
    async getPartnersByPaginate(
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1
    ) {
        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const data = await this.partnersService.getAllPartnersByPaginate(
            queryOption
        );
        if (Number(first_load) == 1) {
            const number_of_users = await this.partnersService.getAllNumberOfPartners();
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

    @Post('partners')
    async addPartners(
        @Response() res,
        @Body() body
    ) {
        try {
            await this.partnersService.createPartners(body);
            return res.status(200).json({
                status: 200,
                message: 'Partner has been successfully created.'
            })

        } catch ({message}) {
            return res.status(400).json({message});
        }
    }

    @Delete('partners/:id')
    async deletePartners(
        @Response() res,
        @Param('id') id
    ) {
        try {
            if (!id || !ObjectId.isValid(id)) {
                throw Error('Invalid Partner object.');
            }
            await this.partnersService.deletePartners(id);
            return res.status(200).json({
                status: 200,
                message: 'Partner has been successfully deleted.'
            })
        } catch ({message}) {
            return res.status(400).json({message});
        }
    }

    @Put('partners/:id')
    async editPartners(
        @Response() res,
        @Param('id') id,
        @Body() body
    ) {
        try {
            if (!id || !ObjectId.isValid(id)) {
                throw Error('Invalid Partner object.');
            }
            await this.partnersService.editPartners(id, body);
            return res.status(200).json({
                status: 200,
                message: 'Partner has been successfully updated.'
            })
        } catch ({message}) {
            return res.status(400).json({message});
        }
    }
}

