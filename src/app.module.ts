import {HomeworksSchema} from './schemas/homeworks';
import {SchoolsSchema} from './schemas/schools';
import {CommentsSchema} from './schemas/comments';
import {PaymentsSchema} from './schemas/payments';
import {MaterialsSchema} from './schemas/materials';
import {TransactionsSchema} from './schemas/transactions';
import {EnrollmentsSchema} from './schemas/enrollments';
import {BundleEnrollmentsSchema} from './schemas/bundleenrollments';
import {CommissionSchema} from './schemas/commissions';
import {SettingsSchema} from './schemas/settings';
import {JwtStrategy} from './services/auth/jwt.strategy';
import {UserSchema} from './schemas/user';
import {CountersSchema} from './schemas/counters';
import {CourseSchema} from './schemas/course';
import {Module, MiddlewareConsumer, RequestMethod} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {CoursesController} from './controllers/courses/courses.controller';
import {AuthService} from './services/auth/auth.service';
import {UsersService} from './services/users/users.service';
import {HelperService} from './services/helper/helper.service';
import {LessonSchema} from './schemas/lesson';
import {BundleSchema} from './schemas/bundle';
import {AuthController} from './controllers/auth/auth.controller';
import {UsersController} from './controllers/users/users.controller';
import {SettingsController} from './controllers/settings/settings.controller';
import {EnrollmentsController} from './controllers/enrollments/enrollments.controller';
import {TransactionsService} from './services/transactions/transactions.service';
import {EnrollmentsService} from './services/enrollments/enrollments.service';
import {CoursesService} from './services/courses/courses.service';
import {FileUploaderController} from './controllers/file-uploader/file-uploader.controller';
import {AssetsController} from './controllers/assets/assets.controller';
import {DrawingsSchema} from './schemas/drawings';
import {AssetsService} from './services/assets/assets.service';
import {ReviewsSchema} from './schemas/reviews';
import {ReviewsController} from './controllers/reviews/reviews.controller';
import {ReviewsService} from './services/reviews/reviews.service';
import {MyController} from './controllers/my/my.controller';
import {PaymentsController} from './controllers/payments/payments.controller';
import {PaymentsService} from './services/payments/payments.service';
import {CommentsService} from './services/comments/comments.service';
import {CommentsController} from './controllers/comments/comments.controller';
import {AdminController} from './controllers/admin/admin.controller';
import {SettingsService} from './services/settings/settings.service';
import {ZoomController} from './controllers/zoom/zoom.controller';
import {ZoomService} from './services/zoom/zoom.service';
import {SchoolsService} from './services/schools/schools.service';
import {SchoolsController} from './controllers/schools/schools.controller';
import {TestimonialService} from './services/testimonial/testimonial.service';
import {PartnersService} from './services/partners/partners.service';

import * as passport from 'passport';

import * as dotenv from 'dotenv';
import {TestimonialSchema} from "./schemas/testimonials";
import {PartnerSchema} from "./schemas/partners";

dotenv.config();

console.log(`Connecting to MONGODB: ${process.env.MONGODB}`);

@Module({
    imports: [
        MongooseModule.forRoot(process.env.MONGODB, {
            useFindAndModify: false,
            useNewUrlParser: true,
            db: {
                readPreference: 'nearest'
            }
        }),
        MongooseModule.forFeature([
            {name: 'Courses', schema: CourseSchema},
            {name: 'Counters', schema: CountersSchema},
            {name: 'Lessons', schema: LessonSchema},
            {name: 'Bundles', schema: BundleSchema},
            {name: 'Users', schema: UserSchema},
            {name: 'Testimonial', schema: TestimonialSchema},
            {name: 'Partners', schema: PartnerSchema},
            {name: 'Settings', schema: SettingsSchema},
            {name: 'Enrollments', schema: EnrollmentsSchema},
            {name: 'BundleEnrollments', schema: BundleEnrollmentsSchema},
            {name: 'Transactions', schema: TransactionsSchema},
            {name: 'Materials', schema: MaterialsSchema},
            {name: 'Drawings', schema: DrawingsSchema},
            {name: 'Reviews', schema: ReviewsSchema},
            {name: 'Payments', schema: PaymentsSchema},
            {name: 'Comments', schema: CommentsSchema},
            {name: 'Schools', schema: SchoolsSchema},
            {name: 'Homeworks', schema: HomeworksSchema},
            {name: 'Commissions', schema: CommissionSchema}
        ])
    ],
    controllers: [CoursesController, AuthController, UsersController, SettingsController, EnrollmentsController, FileUploaderController, AssetsController, ReviewsController, MyController, PaymentsController, CommentsController, AdminController, ZoomController, SchoolsController],
    providers: [TestimonialService, PartnersService, AuthService, UsersService, HelperService, JwtStrategy, TransactionsService, EnrollmentsService, CoursesService, AssetsService, ReviewsService, PaymentsService, CommentsService, SettingsService, ZoomService, SchoolsService],
    exports: [AuthService, UsersService]
})
export class AppModule {
    public configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(passport.authenticate('jwt', {session: false}))
            .forRoutes(
                {path: '/courses', method: RequestMethod.POST}, // admin
                {path: '/courses/:id', method: RequestMethod.PUT}, // admin
                {path: '/courses/:id', method: RequestMethod.DELETE}, // admin

                {path: '/courses/:id/lessons', method: RequestMethod.POST}, // admin
                {path: '/courses/:id/lessons/:lesson_id', method: RequestMethod.PUT}, // admin
                {path: '/courses/:id/lessons/:lesson_id', method: RequestMethod.DELETE}, // admin

                {path: '/courses/:id/lessons/:lesson_id/sessions', method: RequestMethod.POST}, // admin
                {path: '/courses/:id/lessons/:lesson_id/sessions/:session_id', method: RequestMethod.PUT}, // admin
                {path: '/courses/:id/lessons/:lesson_id/sessions/:session_id', method: RequestMethod.DELETE}, // admin
                {path: '/courses/:id/lessons/:lesson_id/sessions/:session_id/complete', method: RequestMethod.POST}, // admin / teacher
                {path: '/courses/:id/lessons/:lesson_id/sessions/:session_id/cancel', method: RequestMethod.POST}, // admin / teacher
                {path: '/courses/:id/lessons/:lesson_id/sessions/:session_id/reschedule', method: RequestMethod.POST}, // admin

                {path: '/settings/:type', method: RequestMethod.PUT},

                {path: '/users', method: RequestMethod.GET}, // admin
                {path: '/users/:id', method: RequestMethod.DELETE}, // admin
                {path: '/users/teachers', method: RequestMethod.POST},
                {path: '/users/teachers/:tid/approve', method: RequestMethod.PUT}, // admin

                {path: '/enrollments', method: RequestMethod.POST},
                {path: '/enrollments/:id', method: RequestMethod.PUT}, // admin
                {path: '/enrollments/:id', method: RequestMethod.DELETE}, // admin

                {path: '/assets/homeworks', method: RequestMethod.GET},
                {path: '/assets/homeworks', method: RequestMethod.POST}, // admin or teacher or student

                {path: '/assets/drawings', method: RequestMethod.GET},
                {path: '/assets/drawings', method: RequestMethod.POST}, // admin or teacher or student
                {path: '/assets/drawings/:id', method: RequestMethod.DELETE}, // admin or teacher

                {path: '/assets/materials', method: RequestMethod.GET},
                {path: '/assets/materials', method: RequestMethod.POST}, // admin or teacher
                {path: '/assets/materials/:id', method: RequestMethod.DELETE}, // admin or teacher

                {path: '/reviews', method: RequestMethod.POST},
                {path: '/reviews/:id', method: RequestMethod.DELETE}, // admin

                {path: '/auth/twilio-verify-phone-check', method: RequestMethod.POST},
                {path: '/auth/tencent-verify-phone', method: RequestMethod.POST},
                {path: '/auth/twilio-verify-phone', method: RequestMethod.POST},
                {path: '/auth/tencent-verify-phone-check', method: RequestMethod.POST},

                {path: '/auth/verify-email', method: RequestMethod.GET},
                {path: '/auth/update', method: RequestMethod.PUT},
                {path: '/auth/update/password', method: RequestMethod.PUT},
                {path: '/auth/profile', method: RequestMethod.GET},

                {path: '/payments/*', method: RequestMethod.ALL}, // student

                {path: '/comments', method: RequestMethod.GET}, // student / teacher
                {path: '/comments', method: RequestMethod.POST}, // student / teacher
                {path: '/comments/:id', method: RequestMethod.DELETE}, // admin

                {path: '/my/*', method: RequestMethod.ALL}, // student/teacher
                {path: '/admin/*', method: RequestMethod.ALL}, // admin
                {path: '/zoom/*', method: RequestMethod.ALL} // admin

            );
    }
}
