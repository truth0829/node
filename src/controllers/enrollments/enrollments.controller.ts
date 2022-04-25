import {AdminGuard} from './../../guards/admin.guard';
import {TransactionsService} from './../../services/transactions/transactions.service';
import {TransactionValueType, TransactionUserType, TransactionType, State} from './../../schemas/transactions';
import {CoursesService} from './../../services/courses/courses.service';
import {ObjectId} from 'bson';
import {Controller, Get, Query, Response, HttpStatus, Post, Body, Param, Delete, Put, UseGuards} from '@nestjs/common';
import {EnrollmentsService} from '../../services/enrollments/enrollments.service';
import {UsersService} from '../../services/users/users.service';

import * as _ from 'lodash';
import {Transaction} from '../../schemas/transactions';
import * as moment from 'moment';
import * as sgMail from "@sendgrid/mail";
@Controller('enrollments')
export class EnrollmentsController {
    constructor(
        private coursesService: CoursesService,
        private enrollmentsService: EnrollmentsService,
        private usersService: UsersService,
        private transactionsService: TransactionsService,
    ) {
    }

    @Get('')
    async getEnrollments(
        @Response() res,
        @Query('lesson') lesson,
        @Query('course') course,
        @Query('teacher') teacher,
        @Query('student_family') student_family,
        @Query('session') session,
        @Query('state') state
    ) {
        const aggregatePipe: any = {};

        if (lesson && ObjectId.isValid(lesson)) {
            aggregatePipe.lesson = new ObjectId(lesson);
        }

        if (course && ObjectId.isValid(course)) {
            aggregatePipe.course = new ObjectId(course);
        }

        if (teacher && ObjectId.isValid(teacher)) {
            aggregatePipe.teacher = new ObjectId(teacher);
        }

        if (student_family && ObjectId.isValid(student_family)) {
            aggregatePipe.student_family = new ObjectId(student_family);
        }

        if (session && ObjectId.isValid(session)) {
            aggregatePipe.session = new ObjectId(session);
        }

        if (state && !Number.isNaN(parseInt(state))) {
            aggregatePipe.state = parseInt(state);
        }

        return res.status(HttpStatus.OK).json({
            status: 200,
            data: await this.enrollmentsService.getEnrollments(aggregatePipe)
        })
    }

    @Get('bundles')
    async getBundleEnrollments(
        @Response() res,
        @Query('course') course,
        @Query('bundle') bundle,
        @Query('teacher') teacher,
        @Query('student_family') student_family,
        @Query('state') state
    ) {
        const aggregatePipe: any = {};

        if (course && ObjectId.isValid(course)) {
            aggregatePipe.course = new ObjectId(course);
        }

        if (teacher && ObjectId.isValid(teacher)) {
            aggregatePipe.teacher = new ObjectId(teacher);
        }

        if (student_family && ObjectId.isValid(student_family)) {
            aggregatePipe.student_family = new ObjectId(student_family);
        }

        if (bundle && ObjectId.isValid(bundle)) {
            aggregatePipe.bundle = new ObjectId(bundle);
        }

        if (state && !Number.isNaN(parseInt(state))) {
            aggregatePipe.state = parseInt(state);
        }

        return res.status(HttpStatus.OK).json({
            status: 200,
            data: await this.enrollmentsService.getBundleEnrollments(aggregatePipe)
        })
    }

    @Get('paginate-enrollments')
    @UseGuards(AdminGuard)
    async getEnrollmentsByPaginate(       
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1,
        @Query('field') field: string = "",
        @Query('value') value: string = ""
    ) {
        const aggregatePipe: any = {};

        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const search_key: any = {
            field: field,
            value: value
        };
    
        const data = await this.enrollmentsService.getEnrollmentsByPaginate(
            queryOption, search_key, aggregatePipe
        );
        if (Number(first_load) == 1) {

            const number_of_users = await this.enrollmentsService.getNumberOfEnrollments(search_key, aggregatePipe);

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

    @Get('paginate-bundle-enrollments')
    @UseGuards(AdminGuard)
    async getBundleEnrollmentsByPaginate(
        @Query('course') course,
        @Query('bundle') bundle,
        @Query('teacher') teacher,
        @Query('student_family') student_family,
        @Query('state') state,
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1,
        @Query('field') field: string = "",
        @Query('value') value: string = ""
    ) {
        const aggregatePipe: any = {};
        // if (course && ObjectId.isValid(course)) {
        //     aggregatePipe.course = new ObjectId(course);
        // }

        // if (teacher && ObjectId.isValid(teacher)) {
        //     aggregatePipe.teacher = new ObjectId(teacher);
        // }

        // if (student_family && ObjectId.isValid(student_family)) {
        //     aggregatePipe.student_family = new ObjectId(student_family);
        // }

        // if (bundle && ObjectId.isValid(bundle)) {
        //     aggregatePipe.bundle = new ObjectId(bundle);
        // }

        // if (state && !Number.isNaN(parseInt(state))) {
        //     aggregatePipe.state = parseInt(state);
        // }

        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const search_key: any = {
            field: field,
            value: value
        };

        const data = await this.enrollmentsService.getBundleEnrollmentsByPaginate(
            queryOption, search_key, aggregatePipe
        );
        if (Number(first_load) == 1) {

            const number_of_users = await this.enrollmentsService.getNumberOfBundleEnrollments(search_key, aggregatePipe);

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

    @Post('')
    async enroll(
        @Response() res,
        @Body() body
    ) {
        // Checking students
        if (!body.student) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Invalid Students.'
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


        // if (!body.session || !ObjectId.isValid(body.session)) {
        //     return res.status(HttpStatus.BAD_REQUEST).json({
        //         message: 'Session ID is not valid.'
        //     })
        // }
        if (!body.session) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Session ID is not valid.'
            })
        }
        try {
            for (let index = 0; index < body.student.length; index++) {
                let student = _.find(student_family.children, {_id: new ObjectId(body.student[index])}) as any;
                if (!student) {
                    return res.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Could not find the student.'
                    })
                }
                for (let i = 0; i < body.session.length; i++) {
                    const session = await this.coursesService.getSessionById(body.lesson, body.session[i]);

                    if (!session) {
                        return res.status(HttpStatus.BAD_REQUEST).json({
                            message: 'Could not find the session.'
                        })
                    }

                    const enrollments = await this.enrollmentsService.getEnrollments({
                        lesson: new ObjectId(lesson._id),
                        course: new ObjectId(course._id),
                        session: new ObjectId(session._id),
                        state: State.Active
                    })
                          
                    if (enrollments.length >= lesson.max_students) {
                        return res.status(HttpStatus.BAD_REQUEST).json({
                            message: `Course has a limit of ${lesson.max_students} students per session.`
                        })
                    }

                    // Checking if user has enough balance
                    if (student_family.balance < lesson.credits_per_session) {
                        return res.status(HttpStatus.BAD_REQUEST).json({
                            message: 'You don\'t have enough credits'
                        })
                    }
                    // get paid credit, not freebalance 
                    let realPayamount = 0
                    if(student_family.free_balance==undefined){
                       realPayamount = lesson.credits_per_session
                    }
                    else{
                        if(lesson.credits_per_session > student_family.free_balance){
                            realPayamount = lesson.credits_per_session - student_family.free_balance
                        }
                    }
                    // Creting a transaction                 
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
                    let transactions = await this.transactionsService.createTransaction(transaction);
                    let current_date = moment();
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
                        session_auto_id: session.auto_id,
                        date: current_date,
                        transaction:transactions._id,
                        price:lesson.credits_per_session,
                        realPay:realPayamount                        
                    });

                    // send reminder email session enrolled
                    const msg = {
                        to: student_family.email,
                        from: 'no-reply@bilin.academy',
                        subject: 'Thanks for enrolling with Bilin Academy',
                        html: 'Hi, <br /><br />' +
                            'Thanks for enrolling in ' +
                            '<strong><a href="https://bilin.academy/en/courses/' + lesson.course_id + '/lesson/' + lesson._id + '">' + course.topic + '</a>, ' + lesson.subtitle + ': ' + session.subject + '</strong>.<br />' +
                            'Please refer to our website for class time in your time zone. !<br />' +
                            'To view your enrollment and join the class, please go to <strong><a href="https://bilin.academy/en/profile">my account</a>.<br /> '+
                            'If you have any questions, please send us a message by email (learn@bilinacademy.com) or WeChat (ID: bilinstudio).<br /><br />' +
                            'Thank you,<br /><br />' +
                            'Bilin Academy<br /><br />'+
                             '** Please note that the classes will be recorded for quality and safety purposes. If any video is used for any other purposes, we will contact parents for consent beforehand.<br /><br />',
                    };
                    await sgMail.send(msg);
                }
            }
            return res.status(HttpStatus.OK).json({
                status: 200,
            })
        } catch (e) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: e.message
            })
        }
    }

    // @Post('bundle')
    // async bundleEnroll(
    //     @Response() res,
    //     @Body() body
    // ) {
    //     // Checking students
    //     if (!body.student || !ObjectId.isValid(body.student)) {
    //         return res.status(HttpStatus.BAD_REQUEST).json({
    //             message: 'Student ID is not valid.'
    //         })
    //     }
    //
    //     if (!body.student_family || !ObjectId.isValid(body.student_family)) {
    //         return res.status(HttpStatus.BAD_REQUEST).json({
    //             message: 'Student Family ID is not valid.'
    //         })
    //     }
    //
    //     const student_family = await this.usersService.getUserById(body.student_family);
    //
    //     if (!student_family) {
    //         return res.status(HttpStatus.BAD_REQUEST).json({
    //             message: 'Could not find the student family.'
    //         })
    //     }
    //
    //     const student = _.find(student_family.children, {_id: new ObjectId(body.student)}) as any;
    //
    //     if (!student) {
    //         return res.status(HttpStatus.BAD_REQUEST).json({
    //             message: 'Could not find the student.'
    //         })
    //     }
    //
    //     // Checking course, lesson & session
    //     if (!body.course || !ObjectId.isValid(body.course)) {
    //         return res.status(HttpStatus.BAD_REQUEST).json({
    //             message: 'Course ID is not valid.'
    //         })
    //     }
    //
    //     const course = await this.coursesService.getCourseById(body.course);
    //     if (!course) {
    //         return res.status(HttpStatus.BAD_REQUEST).json({
    //             message: 'Could not find the course.'
    //         })
    //     }
    //
    //     if (!body.bundle || !ObjectId.isValid(body.bundle)) {
    //         return res.status(HttpStatus.BAD_REQUEST).json({
    //             message: 'Bundle ID is not valid.'
    //         })
    //     }
    //
    //     const bundle = await this.coursesService.getBundleById(body.bundle);
    //     if (!bundle) {
    //         return res.status(HttpStatus.BAD_REQUEST).json({
    //             message: 'Could not find the bundle.'
    //         })
    //     }
    //
    //
    //     const bundle_enrollments = await this.enrollmentsService.getBundleEnrollments({
    //         course: new ObjectId(course._id),
    //         bundle: new ObjectId(bundle._id),
    //     });
    //
    //     // Allow number_of_bundles * max_students_per_session to enroll this bundle
    //     if (bundle_enrollments.length >= bundle.number_of_bundles * bundle.max_students_per_session) {
    //         return res.status(HttpStatus.BAD_REQUEST).json({
    //             message: `Bundle has a limit of ${bundle.number_of_bundles * bundle.max_students_per_session} students`
    //         })
    //     }
    //
    //     // Checking if user has enough balance
    //     if (student_family.balance < bundle.tuition) {
    //         return res.status(HttpStatus.BAD_REQUEST).json({
    //             message: 'You don\'t have enough credits'
    //         })
    //     }
    //     // check if enrollment exist or not
    //     const exist_enrollment = await this.enrollmentsService.existBundleEnrollment({
    //         student: student._id,
    //         student_name: student.name,
    //         student_family: student_family._id,
    //         student_family_name: student_family.name,
    //         course: course._id,
    //         course_name: course.topic,
    //         bundle: bundle._id,
    //         teacher: bundle.teacher_id,
    //         teacher_name: body.teacher_name,
    //     });
    //     if (exist_enrollment) {
    //         return res.status(HttpStatus.BAD_REQUEST).json({
    //             message: 'Bundle enrollment already exists.'
    //         })
    //     } else {
    //         // Creting a transaction
    //         const transaction: Transaction = {
    //             debit_user: student_family._id,
    //             debit_type: TransactionValueType.InternalCredit,
    //             debit_amount: bundle.tuition,
    //             credit_user: TransactionUserType.System,
    //             credit_type: TransactionValueType.InternalCredit,
    //             credit_amount: bundle.tuition,
    //             notes: `Enrollment to ${course.topic} | Bundle #${bundle.auto_id}`,
    //             type: TransactionType.Enrollment
    //         };
    //
    //         await this.transactionsService.createTransaction(transaction);
    //
    //         const bundle_enrollment = await this.enrollmentsService.createBundleEnrollment({
    //             student: student._id,
    //             student_name: student.name,
    //             student_family: student_family._id,
    //             student_family_name: student_family.name,
    //             course: course._id,
    //             course_name: course.topic,
    //             bundle: bundle._id,
    //             teacher: bundle.teacher_id,
    //             teacher_name: body.teacher_name,
    //         });
    //         return res.status(HttpStatus.OK).json({
    //             status: 200,
    //             data: bundle_enrollment,
    //             message: "Enrolled successfully!"
    //         })
    //     }
    // }
    @Post('bundle')
    async bundleEnroll(
        @Response() res,
        @Body() body
    ) {
        let membership = false;
        if (body && body.length > 0) {
            for (let i = 0; i < body.length; i++) {
                // Checking students
                if (!body[i].student) {
                    return res.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Invalid Students'
                    })
                }

                if (!body[i].student_family || !ObjectId.isValid(body[i].student_family)) {
                    return res.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Student Family ID is not valid.'
                    })
                }

                const student_family = await this.usersService.getUserById(body[i].student_family);

                if (!student_family) {
                    return res.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Could not find the student family.'
                    })
                }


                // Checking course, lesson & session
                if (!body[i].course || !ObjectId.isValid(body[i].course)) {
                    return res.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Course ID is not valid.'
                    })
                }

                const course = await this.coursesService.getCourseById(body[i].course);
                if (!course) {
                    return res.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Could not find the course.'
                    })
                }

                if (!body[i].bundle || !ObjectId.isValid(body[i].bundle)) {
                    return res.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Bundle ID is not valid.'
                    })
                }

                const bundle = await this.coursesService.getBundleById(body[i].bundle);
                if (!bundle) {
                    return res.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Could not find Package.'
                    })
                }

                for (let student_index = 0; student_index < body[i].student.length; student_index++) {
                    let student = _.find(student_family.children, {_id: new ObjectId(body[i].student[student_index])}) as any;

                    if (!student) {
                        return res.status(HttpStatus.BAD_REQUEST).json({
                            message: 'Could not find the student.'
                        })
                    }
                    if(bundle.membership !=null){
                        membership = bundle.membership;
                    }
                    let realPayamount = 0
                    if(membership){
                        realPayamount = bundle.tuition
                    }
                    else{

                        if(student_family.free_balance==undefined){
                            realPayamount = bundle.tuition
                         }
                         else{
                             if(bundle.tuition > student_family.free_balance){
                                 realPayamount = bundle.tuition - student_family.free_balance
                             }
                         }
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
                        price:bundle.tuition,
                        realPay:realPayamount
                    });                 
                    // Creating a transaction
                    const transaction: Transaction = {
                        debit_user: student_family._id,
                        debit_type: TransactionValueType.InternalCredit,
                        debit_amount: bundle.tuition,
                        credit_user: TransactionUserType.System,
                        credit_type: TransactionValueType.InternalCredit,
                        credit_amount: bundle.tuition,
                        notes: `Enrollment to ${course.topic} | Package #${bundle.auto_id}`,
                        type: TransactionType.Enrollment
                    };

                    await this.transactionsService.createTransaction(transaction,membership);
                }


            }
            return res.status(HttpStatus.OK).json({
                status: 200,
                message: "Purchased successfully!"
            })
        }
        else {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Invalid request'
            })
        }
    }

    @Put(':id')
    @UseGuards(AdminGuard)
    async updateEnrollment(
        @Response() res,
        @Param('id') id,
        @Body() body
    ) {         
        let membership = false;
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Enrollment ID is not valid.'
            })
        }

        const enrollment = await this.enrollmentsService.getEnrollmentById(id);

        if (!enrollment) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: `Could not find the enrollment.`
            })
        }

        const newEnrollment = _.pickBy({
            state: body.state
        }, v => v === 0 || !!v);

        await this.enrollmentsService.updateEnrollment(id, newEnrollment);

        if (body.state === State.Canceled) {          
            // const course = await this.coursesService.getCourseById(enrollment.course);
            const lesson = await this.coursesService.getLessonById(enrollment.lesson);   
            if(enrollment.transaction != null){
                let last_transaction = await this.transactionsService.getTransactionsByID(enrollment.transaction);
                if(last_transaction != null){
                    let free_balance = last_transaction.free_credit;                                       
                    await this.transactionsService.createTransaction({
                        debit_user: TransactionUserType.System,
                        debit_type: TransactionValueType.InternalCredit,
                        debit_amount: lesson.credits_per_session,
                        credit_user: enrollment.student_family,
                        credit_type: TransactionValueType.InternalCredit,
                        credit_amount: lesson.credits_per_session,
                        notes: `Enrollment #${enrollment.auto_id} has been canceled`,
                        type: TransactionType.CancelEnrollment
                    },membership,free_balance);
                }   
                else{
                    await this.transactionsService.createTransaction({
                        debit_user: TransactionUserType.System,
                        debit_type: TransactionValueType.InternalCredit,
                        debit_amount: lesson.credits_per_session,
                        credit_user: enrollment.student_family,
                        credit_type: TransactionValueType.InternalCredit,
                        credit_amount: lesson.credits_per_session,
                        notes: `Enrollment #${enrollment.auto_id} has been canceled`,
                        type: TransactionType.CancelEnrollment
                    });
                }                        
             
            } 
            else{                      
                await this.transactionsService.createTransaction({
                    debit_user: TransactionUserType.System,
                    debit_type: TransactionValueType.InternalCredit,
                    debit_amount: lesson.credits_per_session,
                    credit_user: enrollment.student_family,
                    credit_type: TransactionValueType.InternalCredit,
                    credit_amount: lesson.credits_per_session,
                    notes: `Enrollment #${enrollment.auto_id} has been canceled`,
                    type: TransactionType.CancelEnrollment
                });

            }  
        }

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: `Enrollment has been successfully updated.`
        })

    }

    @Post('cancel')
    // @UseGuards(AdminGuard)
    async cancelEnrollmentsFromUser(
        @Response() res,
        @Body() body
    ) {
        const enrollment_ids = body.ids;
        let membership = false;
        if (!enrollment_ids) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'No Enrollments IDs'
            })
        }
        else {
            for (let id of enrollment_ids) {
                let enrollment = await this.enrollmentsService.getEnrollmentById(id);
                if (!enrollment) {
                    return res.status(HttpStatus.BAD_REQUEST).json({
                        message: `Could not find the enrollment.`
                    })
                }
                else {
                    let lesson_id = enrollment.lesson;
                    let session_id = enrollment.session;
                    let session =await this.coursesService.getSessionById(lesson_id,session_id);
                    let startTime = moment(session.startTime);
                    // check it was enrolled 24 hours before
                    // let enrolled_date = moment(enrollment.date);
                    let current_date = moment();
                    // let hours = current_date.diff(enrolled_date, 'hours', true);
                    let hours = startTime.diff(current_date, 'hours', true);
                    if (hours > 24) {
                        let newEnrollment = _.pickBy({
                            state: 0
                        }, v => v === 0 || !!v);

                        await this.enrollmentsService.updateEnrollment(id, newEnrollment);

                        // const course = await this.coursesService.getCourseById(enrollment.course);
                        const lesson = await this.coursesService.getLessonById(enrollment.lesson);
                        if(enrollment.transaction != null){
                            let last_transaction = await this.transactionsService.getTransactionsByID(enrollment.transaction);
                            if(last_transaction != null){
                                let free_balance = last_transaction.free_credit;                      
                                await this.transactionsService.createTransaction({
                                    debit_user: TransactionUserType.System,
                                    debit_type: TransactionValueType.InternalCredit,
                                    debit_amount: lesson.credits_per_session,
                                    credit_user: enrollment.student_family,
                                    credit_type: TransactionValueType.InternalCredit,
                                    credit_amount: lesson.credits_per_session,
                                    notes: `Enrollment #${enrollment.auto_id} has been canceled`,
                                    type: TransactionType.CancelEnrollment
                                },membership,free_balance);
                            }   
                            else{
                                await this.transactionsService.createTransaction({
                                    debit_user: TransactionUserType.System,
                                    debit_type: TransactionValueType.InternalCredit,
                                    debit_amount: lesson.credits_per_session,
                                    credit_user: enrollment.student_family,
                                    credit_type: TransactionValueType.InternalCredit,
                                    credit_amount: lesson.credits_per_session,
                                    notes: `Enrollment #${enrollment.auto_id} has been canceled`,
                                    type: TransactionType.CancelEnrollment
                                });
                            }                        
                         
                        } 
                        else{                      
                            await this.transactionsService.createTransaction({
                                debit_user: TransactionUserType.System,
                                debit_type: TransactionValueType.InternalCredit,
                                debit_amount: lesson.credits_per_session,
                                credit_user: enrollment.student_family,
                                credit_type: TransactionValueType.InternalCredit,
                                credit_amount: lesson.credits_per_session,
                                notes: `Enrollment #${enrollment.auto_id} has been canceled`,
                                type: TransactionType.CancelEnrollment
                            });

                        }      

                    }
                    else {
                        return res.status(HttpStatus.BAD_REQUEST).json({
                            message: `Enrollment may not be cancelled within 24 hours of the start of class`
                        })
                    }

                }
            }

            if (enrollment_ids.length > 1) {
                return res.status(HttpStatus.OK).json({
                    status: 200,
                    message: `Enrollments have been successfully canceled.`
                })
            }

            else if (enrollment_ids.length == 1) {
                return res.status(HttpStatus.OK).json({
                    status: 200,
                    message: `Enrollment has been successfully canceled.`
                })
            }
        }
    }

    @Put('bundle/:id')
    @UseGuards(AdminGuard)
    async updateBundleEnrollment(
        @Response() res,
        @Param('id') id,
        @Body() body
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Package Enrollment ID is not valid.'
            })
        }

        const enrollment = await this.enrollmentsService.getBundleEnrollmentById(id);

        if (!enrollment) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: `Could not find the Package enrollment.`
            })
        }

        const newBundleEnrollment = _.pickBy({
            state: body.state
        }, v => v === 0 || !!v);

        await this.enrollmentsService.updateBundleEnrollment(id, newBundleEnrollment);

        if (body.state === State.Canceled) {
            // const course = await this.coursesService.getCourseById(enrollment.course);
            const bundle = await this.coursesService.getBundleById(enrollment.bundle);
            await this.transactionsService.createTransaction({
                debit_user: TransactionUserType.System,
                debit_type: TransactionValueType.InternalCredit,
                debit_amount: bundle.tuition,
                credit_user: enrollment.student_family,
                credit_type: TransactionValueType.InternalCredit,
                credit_amount: bundle.tuition,
                notes: `Package Enrollment #${enrollment.auto_id} has been canceled`,
                type: TransactionType.CancelEnrollment
            });
        }

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: `Package Enrollment has been successfully canceled.`
        })

    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    async deleteEnrollment(
        @Response() res,
        @Param('id') id
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Enrollment ID is not valid.'
            })
        }

        await this.enrollmentsService.deleteSingleEnrollment(id);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Enrollment has been successfully deleted.'
        })
    }

    @Delete('bundle/:id')
    @UseGuards(AdminGuard)
    async deleteBundleEnrollment(
        @Response() res,
        @Param('id') id
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Package Enrollment ID is not valid.'
            })
        }
        await this.enrollmentsService.deleteSingleBundleEnrollment(id);
        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Package Enrollment has been successfully deleted.'
        })
    }
}
