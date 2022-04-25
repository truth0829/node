import {ObjectId} from 'bson';
import {TransactionsService} from './../../services/transactions/transactions.service';
import {TransactionValueType, TransactionUserType, TransactionType} from './../../schemas/transactions';
import {UserType} from './../../schemas/user';
import {SchoolsService} from './../../services/schools/schools.service';
import {AuthService} from './../../services/auth/auth.service';
import {UsersService} from './../../services/users/users.service';
import {
    Controller,
    Post,
    Body,
    Response,
    HttpStatus,
    Put,
    Request,
    Get,
    BadRequestException,
    Param,
    Query
} from '@nestjs/common';
import axios from 'axios';
import * as querystring from 'querystring';
import {Transaction} from '../../schemas/transactions';

import * as validator from 'validator';
import * as sgMail from '@sendgrid/mail';
import * as uuid from 'uuid/v1';
import * as twilio from 'twilio';
import * as moment from 'moment';
import * as tencentcloud from 'tencentcloud-sdk-nodejs';
import * as dotenv from 'dotenv';
dotenv.config();
@Controller('auth')
export class AuthController {
    twilio: any;
    constructor(
        private usersService: UsersService,
        private authService: AuthService,
        private schoolsService: SchoolsService,
        private transactionsService: TransactionsService
    ) {
        sgMail.setApiKey('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');

        this.twilio = twilio('AC2f602726c2ddf380a07022497d743e46', 'b40eb059be1e69b599d1e545ac09c0cc');
    }

    @Post('wechat')
    async loginWithWeChat(
        @Response() res,
        @Body() body
    ) {
        try {
            const {code, type, email} = body;

            if (!code) {
                throw Error('Code is not defined.');
            }

            if (type && email) {
                if (await this.usersService.getUserByUsername(email)) {
                    throw Error('Email is taken.');
                }
            }

            const {data: oauth2} = await axios.get(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.WECHAT_APP}&secret=${process.env.WECHAT_SECRET}&code=${code}&grant_type=authorization_code`);
            const {access_token, openid} = oauth2;
            let user = await this.usersService.getUserByWechatId(openid);
            if (user) {
                user = user.toObject();

                if (user.type === UserType.SchoolAdmin) {
                    user.adminSchool = await this.schoolsService.getSchoolByAdminId(user._id);
                }

                return res.status(HttpStatus.OK).json({
                    ...await this.authService.createToken(user._id, user.username, user.type >= 4),
                    data: user
                });
            }
            if (!type) {
                return res.status(HttpStatus.OK).json({
                    error: 'Please create an account first.'
                })
            }

            const {data: {nickname}} = await axios.get(`https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`);

            const emailKey = uuid();

            const newUser = {
                username: email,
                password: openid,
                name: nickname,
                phone: '',
                type,
                wechatOpenId: openid,
                emailVerified: emailKey
            }

            user = await this.usersService.createUser(newUser);
            delete user.password;

            const {token} = await this.authService.createToken(user._id, user.username, user.type >= 4);

            const msg = {
                to: user.username,
                from: 'no-reply@bilin.academy',
                subject: 'Verify your email',
                html: `<strong>Please click on the link below to verify your email address.</strong><br /><a href="https://bilin.academy/en/authentication/verify-email?q=${user.emailVerified}">Verify Email</a>`,
            };

            await sgMail.send(msg);

            if (user.type === UserType.SchoolAdmin) {
                user.adminSchool = await this.schoolsService.getSchoolByAdminId(user._id);
            }

            // 20 credits balance for students / parents
            if (user.type === UserType.Student) {
                const transaction: Transaction = {
                    debit_user: TransactionUserType.System,
                    debit_type: TransactionValueType.InternalCredit,
                    debit_amount: 20,
                    credit_user: user._id,
                    credit_type: TransactionValueType.InternalCredit,
                    credit_amount: 20,
                    notes: `Initial balance.`,
                    type: TransactionType.AdminModification
                }

                await this.transactionsService.createTransaction(transaction,false,20);
            }

            return res.status(HttpStatus.OK).json({
                status: 200,
                token: token,
                data: user
            })

        } catch ({message}) {
            throw new BadRequestException(message);
        }
    }

    @Post('login')
    async loginUser(@Response() res: any, @Body() body: any) {
        if (!(body && body.username && body.password)) {
            return res.status(HttpStatus.BAD_REQUEST).json({message: 'Username and password are required'});
        }

        let user: any = await this.usersService.compareHash(body.username.toLowerCase(), body.password);

        if (user) {
            user = user.toObject();

            // If logging in from Wechat, save openid
            if (body && body.openid) {
                user = await this.usersService.updateUser(user._id, {
                    wechatOpenId: body.openid
                });
            }
            if (user.type === UserType.SchoolAdmin) {
                user.adminSchool = await this.schoolsService.getSchoolByAdminId(user._id);
            }

            return res.status(HttpStatus.OK).json({
                ...await this.authService.createToken(user._id, user.username, user.type >= 4),
                data: user,
                status: 200,
            });
        }

        return res.status(HttpStatus.BAD_REQUEST).json({message: 'Invalid username or password.'});
    }

    @Post('isEmailRegisterd')
    async isEmailRegisterd(
        @Body() body
    ) {
        try {
            let user = await this.usersService.getUserByUsername(body.email);
            if (user) {
                return {
                    isEmailRegisterd: true,
                    message: 'Email has been registered already'
                }
            }
            else {
                return {
                    isEmailRegisterd: false,
                    message: 'Unique email'
                }
            }

        } catch ({message}) {
            throw new BadRequestException(message);
        }
    }

    @Post('isPhoneRegisterd')
    async isPhoneRegisterd(
        @Body() body
    ) {
        try {         
            let user = await this.usersService.getUserByPhone(body.phone);           
            if (user.length != 0) {
                return {
                    isPhoneRegisterd: true,
                    message: 'Phone number has been used already'
                }
            } else {
                return {
                    isPhoneRegisterd: false,
                    message: 'Unique Phone number'
                }
            }
        } catch ({message}) {
            throw new BadRequestException(message);
        }
    }

    @Post('isOpenIDAccountExist')
    async isOpenIDAccountExist(
        @Body() body
    ) {
        try {
            if (!(body && body.openid)) {
                throw Error('openid is required');
            }
            let user = await this.usersService.getUserByWechatId(body.openid);
            if (user) {
                const {token} = await this.authService.createToken(user._id, user.username, user.type >= 4);
                return {
                    status: 200,
                    data: user,
                    token
                }
            }
            else {
                return {
                    status: 400,
                    message: 'No Account'
                }
            }

        } catch ({message}) {
            throw new BadRequestException(message);
        }
    }

    @Post('register')
    async registerUser(
        @Request() req: any,
        @Body() body
    ) {
        try {
            let language;           
            if (!body.language) {
                language="en";
            }
            else{
                if (body.language=='en'){
                    language="en";
                }
                else{
                    language = "ch";
                }
                
            }
            if (!(body && body.username && body.password && body.type)) {
                throw Error('Email and password are required');
            }

            let user = await this.usersService.getUserByUsername(body.username.toLowerCase());
            if (user) {
                throw Error('Email has been registered already');
            }
            let newUser = {};
            if (body.wechatOpenId) {
                newUser = {
                    username: body.username.toLowerCase(),
                    password: body.password,
                    name: body.name,
                    phone: body.phone,
                    type: body.type,
                    phoneVerified: false,
                    referer_id: body.referer,
                    wechatOpenId: body.wechatOpenId,
                    registerByPromoterId: body.registerByPromoterId,
                }
            } else {
                newUser = {
                    username: body.username.toLowerCase(),
                    password: body.password,
                    name: body.name,
                    phone: body.phone,
                    type: body.type,
                    phoneVerified: false,
                    referer_id: body.referer,
                    registerByPromoterId: body.registerByPromoterId,
                }
            }

            const created_user = await this.usersService.createUser(newUser);
            delete created_user.password;
            const {token} = await this.authService.createToken(created_user._id, created_user.username.toLowerCase(), created_user.type >= 4);            
            const link = req.headers.referer +language+ "/authentication/verify-email?q=" + created_user.emailVerified; 
            const course_link =     req.headers.referer +language+"/courses" ;   
            const package_link =     req.headers.referer +language+"/packages" ;    
            const msg = {
                to: body.username,
                from: 'no-reply@bilin.academy',
                subject: ' Welcome to Bilin Academy ~ 欢迎加入彼邻世界课堂',
                html: `<p data-pm-slice="1 1 []">Welcome to Bilin Academy, <strong>an online class platform offering multilingual learning experiences for children around the world</strong>.<br> Thank you for registering on our website. Here are some things you can do to get started:<br></p><p>&nbsp;</p><ol class="ProsemirrorEditor-list"><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="numbered" style="margin-left: 32px"><p>Explore our <a href="${course_link}" class="ProsemirrorEditor-link">current class offerings</a>, Don’t forget to filter classes by languages and/or topic of interests. </p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="numbered" style="margin-left: 32px"><p>Check out our<a href="${package_link}" class="ProsemirrorEditor-link"> class packages</a> to discover more courses we can offer.</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="numbered" style="margin-left: 32px"><p>Follow us on<a href="https://www.facebook.com/bilinacademy" class="ProsemirrorEditor-link"> Facebook</a>,<a href="https://www.instagram.com/bilinacademy/" class="ProsemirrorEditor-link"> Instagram</a>, or<a href="http://web.wechat.com" class="ProsemirrorEditor-link"> WeChat</a>&nbsp;(ID: bilinstudio) to get the latest news.</p></li></ol><p><br></p><p>Thanks for joining us as we cultivate our next generation into multilingual, global citizens!<br> If you have questions, please feel free to contact us by email learn@bilinacademy.com or WeChat (ID: bilinstudio).</p><p><br></p><p>Sincerely,</p><p>Bilin Academy</p><p><a href="http://www.bilin.academy" class="ProsemirrorEditor-link">www.bilin.academy</a></p>`,
            };

            await sgMail.send(msg);

            if (created_user.type === UserType.SchoolAdmin) {
                created_user.adminSchool = await this.schoolsService.getSchoolByAdminId(created_user._id);
            }
            // give 20 credits
            const transaction: Transaction = {
                debit_user: TransactionUserType.System,
                debit_type: TransactionValueType.InternalCredit,
                debit_amount: 20,
                credit_user: created_user._id,
                credit_type: TransactionValueType.InternalCredit,
                credit_amount: 20,
                notes: `Initial balance.`,
                type: TransactionType.AdminModification
            }

            await this.transactionsService.createTransaction(transaction,false,20);
            // BEGIN: check if user was created from refer or not
            // from referer
            if (body.referer != "") {
                const refer_friend = {
                    refer_friends: [
                        {
                            id: created_user._id,
                            username: created_user.name,
                            email: body.username.toLowerCase(),
                            phoneVerified: false
                        }
                    ]
                }
                await this.usersService.addReferFriend(body.referer, refer_friend)
            }
            // END
            return {
                status: 200,
                token,
                data: created_user
            }
        } catch ({message}) {
            throw new BadRequestException(message);
        }
    }

    // @Post('register')
    // async registerUser(
    //     @Request() req: any,
    //     @Body() body
    // ) {
    //     try {
    //         if (!(body && body.username && body.password && body.type)) {
    //             throw Error('Email and password are required');
    //         }
    //
    //         let user = await this.usersService.getUserByUsername(body.username);
    //
    //         if (user) {
    //             throw Error('Email has been registered already');
    //         }
    //
    //         if (!body.code) {
    //             throw Error('Please enter valid verification code.');
    //         }
    //
    //         try {
    //             const {status} = await this.twilio.verify.services('VAd579cc838c1968efd93ec47e32035260').verificationChecks.create({
    //                 to: body.phone,
    //                 code: body.code
    //             });
    //
    //             if (status !== 'approved') {
    //                 throw Error('You entered invalid verification code.');
    //             }
    //         } catch ({message}) {
    //             throw Error(message);
    //         }
    //
    //         const newUser = {
    //             username: body.username,
    //             password: body.password,
    //             name: body.name,
    //             phone: body.phone,
    //             type: body.type,
    //             phoneVerified: true
    //         }
    //
    //         user = await this.usersService.createUser(newUser);
    //
    //         delete user.password;
    //
    //         const {token} = await this.authService.createToken(user._id, user.username, user.type >= 4);
    //         const link = req.headers.referer.replace('signup', "verify-email?q=" + user.emailVerified);
    //         const msg = {
    //             to: body.username,
    //             from: 'no-reply@bilin.academy',
    //             subject: 'Verify your email',
    //             html: `<strong>Please click on the link below to verify your email address.</strong><br /><a href="${link}">Verify Email</a>`,
    //         };
    //
    //         await sgMail.send(msg);
    //
    //         if (user.type === UserType.SchoolAdmin) {
    //             user.adminSchool = await this.schoolsService.getSchoolByAdminId(user._id);
    //         }
    //
    //         // 20 credits balance for students / parents
    //         if (user.type === UserType.Student) {
    //             const transaction: Transaction = {
    //                 debit_user: TransactionUserType.System,
    //                 debit_type: TransactionValueType.InternalCredit,
    //                 debit_amount: 20,
    //                 credit_user: user._id,
    //                 credit_type: TransactionValueType.InternalCredit,
    //                 credit_amount: 20,
    //                 notes: `Initial balance.`,
    //                 type: TransactionType.AdminModification
    //             }
    //
    //             await this.transactionsService.createTransaction(transaction);
    //         }
    //
    //         return {
    //             status: 200,
    //             token,
    //             data: user
    //         }
    //     } catch ({message}) {
    //         throw new BadRequestException(message);
    //     }
    // }

    @Put('update')
    async updateUser(
        @Request() req: any,
        @Response() res: any,
        @Body() body: any
    ) {
        try {
            if (body.password) {
                await this.usersService.updatePassword(req.user.id, body.password, body.newPassword);

                return res.status(HttpStatus.OK).json({
                    status: 200,
                    message: 'Password has been successfully updated.'
                });
            }

            if (body.school === '') {
                body.school = null;
            }

            return res.status(HttpStatus.OK).json({
                status: 200,
                data: await this.usersService.updateUser(req.user.id, body)
            })
        } catch ({message}) {
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Put('update/password')
    async updateUserPassword(
        @Request() req: any,
        @Response() res: any,
        @Body() body: any
    ) {
        try {
            if (body.where && body.where == "wechat-miniapp") {
                if (!body.password) {
                    throw Error('Password is not defined.');
                }
                await this.usersService.updateWechatMiniAppPassword(req.user.id, body.password);
            } else {
                if (!body.password || !body.newPassword) {
                    throw Error('Password is not defined.');
                }
                await this.usersService.updatePassword(req.user.id, body.password, body.newPassword);
            }
            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Password has been successfully updated.'
            });
        } catch ({message}) {
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }


    @Post('reset')
    async resetPassword(
        @Request() req,
        @Response() res,
        @Body() body
    ) {
        try {
            let language;
            if (!body.email) {
                throw Error('Email is required.');
            }
            if (!body.language) {
                language="en";
            }
            else{
                if (body.language=='en'){
                    language="en";
                }
                else{
                    language = "ch";
                }
                
            }
            if (!validator.isEmail(body.email)) {
                throw Error('Email is invalid.');
            }

            let user = await this.usersService.getUserByUsername(body.email);

            if (user) {
                user = user.toObject();

                // Make password reset key and store to user
                const key = await this.usersService.requestPasswordReset(user._id);  
                const link = req.headers.referer +language+ "/authentication/forgot-password?q=" + key;
                const msg = {
                    to: body.email,
                    from: 'no-reply@bilin.academy',
                    subject: 'Password reset',
                    html: `<strong>Please click on the link below to reset your password.</strong><br /><a href="${link}">Reset password</a>`,
                };
                // const msg = {
                //     to: body.email,
                //     from: 'no-reply@bilin.academy',
                //     subject: 'Password reset',
                //     html: `<strong>Please click on the link below to reset your password.</strong><br /><a href="https://bilin.academy/en/authentication/forgot-password?q=${key}">Reset password</a>`,
                // };

                await sgMail.send(msg);
            } else {
                throw Error('Your email has not been registered.')
            }

            return res.status(HttpStatus.OK).json({
                status: 'success',
                message: 'Your password has been reset. Please check your email.'
            });

        } catch ({message}) {
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Put('reset')
    async resetPasswordSubmit(
        @Response() res,
        @Body() body
    ) {
        try {
            if (!body.code) {
                throw Error('Code is required.');
            }

            if (!body.password || body.password.length < 6) {
                throw Error('Password is not valid or missing.');
            }

            const user = await this.usersService.getUserByPasswordCode(body.code);

            if (!user) {
                throw Error('Invalid code. Please try reseting your password again.');
            }

            await this.usersService.updatePasswordWithoutValidation(user._id, body.password);

            return res.status(HttpStatus.OK).json({status: 'success'});

        } catch ({message}) {
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Put('verify-email-superadmin')
    async verifyEmailSuperAdmin(
        @Response() res,
        @Body() body
    ) {
        try {
            const user = await this.usersService.getUserById(body.id);

            if (!user) {
                throw Error('Invalid user. Please try verifying the email again.');
            }
            const data = await this.usersService.verifyEmailSuperAdmin(body.id);
            return res.status(HttpStatus.OK).json({
                status: 'success',
                data: data
            });
        } catch ({message}) {
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Put('verify-phone-superadmin')
    async verifyPhoneSuperAdmin(
        @Response() res,
        @Body() body
    ) {
        try {
            const user = await this.usersService.getUserById(body.id);

            if (!user) {
                throw Error('Invalid user. Please try verifying Phone again.');
            }
            const data = await this.usersService.verifyPhoneSuperAdmin(body.id);
            return res.status(HttpStatus.OK).json({
                status: 'success',
                data: data
            });
        } catch ({message}) {
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Put('change-password-superadmin')
    async changePasswordSuperAdmin(
        @Response() res,
        @Body() body
    ) {
        try {
            const user = await this.usersService.getUserById(body.id);
            if (!user) {
                throw Error('Invalid user. Please try to change the password again.');
            }
            await this.usersService.changePasswordSuperAdmin(body.id, body.password);
            return res.status(HttpStatus.OK).json({
                status: 'success',
            });
        } catch ({message}) {
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Post('contact')
    async contactUS(
        @Response() res,
        @Body() body
    ) {
        try {
            if (!(body.name && body.subject && body.message && body.email)) {
                throw Error('Invalid form. Please try again.');
            }

            const msg = {
                // to: 'blank.maksym@gmail.com',
                to: 'learn@bilinacademy.com',
                from: 'no-reply@bilin.academy',
                subject: 'Contact Us Form',
                html: `
                    <p><strong>Name:</strong> ${body.name}</p>
                    <p><strong>Email:</strong> ${body.email}</p>
                    <p><strong>Subject:</strong> ${body.subject}</p>
                    <p><strong>Message:</strong> ${body.message}</p>
                `,
            };

            await sgMail.send(msg);

            return res.status(HttpStatus.OK).json({status: 'success'});
        } catch ({message}) {
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Post('twilio-verify-phone')
    async sendTwilioVerifyPhone(
        @Request() req: any,
        @Body() body
    ) {
        try {
            if (!body.phone) {
                throw Error('Please enter valid phone number.');
            }

            await this.twilio.verify.services('VAd579cc838c1968efd93ec47e32035260').verifications.create({
                to: body.phone,
                channel: 'sms'
            });

            return {status: 'success'}
        } catch ({message}) {
            throw new BadRequestException(message);
        }
    }

    @Post('tencent-verify-phone')
    async sendTencentVerifyPhone(
        @Request() req: any,
        @Body() body: any
    ) {
        let user_id = req.user.id;    
        try {
            if (!body.phone) {
                throw Error('Please enter valid phone number.');
            }
            // 导入对应产品模块的client models。
            const smsClient = tencentcloud.sms.v20190711.Client

            /* 实例化要请求产品(以sms为例)的client对象 */
            const client = new smsClient({
            credential: {
            /* 必填：腾讯云账户密钥对secretId，secretKey。
            * 这里采用的是从环境变量读取的方式，需要在环境变量中先设置这两个值。
            * 你也可以直接在代码中写死密钥对，但是小心不要将代码复制、上传或者分享给他人，
            * 以免泄露密钥对危及你的财产安全。
            * CAM密匙查询: https://console.cloud.tencent.com/cam/capi */
                secretId: process.env.secretId,
                secretKey: process.env.secretKey,
            },
            region: "",
            /* 必填：地域信息，可以直接填写字符串ap-guangzhou，或者引用预设的常量 */
            
            /* 非必填:
            * 客户端配置对象，可以指定超时时间等配置 */
            profile: {
                /* SDK默认用TC3-HMAC-SHA256进行签名，非必要请不要修改这个字段 */
                signMethod: "HmacSHA256",
                httpProfile: {
                /* SDK默认使用POST方法。
                * 如果你一定要使用GET方法，可以在这里设置。GET方法无法处理一些较大的请求 */
                reqMethod: "POST",
                /* SDK有默认的超时时间，非必要请不要进行调整
                * 如有需要请在代码中查阅以获取最新的默认值 */
                reqTimeout: 30,
                /**
                 * SDK会自动指定域名。通常是不需要特地指定域名的，但是如果你访问的是金融区的服务
                 * 则必须手动指定域名，例如sms的上海金融区域名： sms.ap-shanghai-fsi.tencentcloudapi.com
                 */
                endpoint: "sms.tencentcloudapi.com"
                },
            },
            })
            let countryCode = body.phone.substring(0, 3);
            let Content = Math.floor(100000 + Math.random() * 900000).toString();   //genarate 6 digit random number
            /* 请求参数，根据调用的接口和实际情况，可以进一步设置请求参数
            * 属性可能是基本类型，也可能引用了另一个数据结构
            * 推荐使用IDE进行开发，可以方便的跳转查阅各个接口和数据结构的文档说明 */
            let Sign = "Bilin Academy";
            let TemplateID = "895882";
            if(countryCode=="+86"){
                Sign = "彼邻客科技";
                TemplateID = "893579";
            }           
            const params = {

            /* 短信应用ID: 短信SdkAppid在 [短信控制台] 添加应用后生成的实际SdkAppid，示例如1400006666 */
            SmsSdkAppid: "1400496541",
            /* 短信签名内容: 使用 UTF-8 编码，必须填写已审核通过的签名，签名信息可登录 [短信控制台] 查看 */
            Sign: Sign,
            /* 短信码号扩展号: 默认未开通，如需开通请联系 [sms helper] */
            ExtendCode: "",
            /* 国际/港澳台短信 senderid: 国内短信填空，默认未开通，如需开通请联系 [sms helper] */
            SenderId: "",
            /* 用户的 session 内容: 可以携带用户侧 ID 等上下文信息，server 会原样返回 */
            
            SessionContext:'',
            /* 下发手机号码，采用 e.164 标准，+[国家或地区码][手机号]
            * 示例如：+8613711112222， 其中前面有一个+号 ，86为国家码，13711112222为手机号，最多不要超过200个手机号*/
            PhoneNumberSet: [body.phone],                   
            /* 模板 ID: 必须填写已审核通过的模板 ID。模板ID可登录 [短信控制台] 查看 */
            TemplateID: TemplateID,
            /* 模板参数: 若无模板参数，则设置为空*/
            TemplateParamSet: [Content,'5'],
            }
            // 通过client对象调用想要访问的接口，需要传入请求对象以及响应回调函数  
            let smsresponse: any; 
            let result = await client.SendSms(params)           
            if ('SendStatusSet' in result) { 
                if (result.SendStatusSet[0].Code =='Ok'){  
                    smsresponse =   result.SendStatusSet[0]  ;                  
                    let smsDate = moment();
                    await this.usersService.updateUser(user_id, {smsCode: Content, smsDate:smsDate});                    
                    return {status: 'success', data: smsresponse}
                } else{
                    return {status: 'fail'}
                }              

            } else{
                return {status: 'fail'}
            }   

        } catch ({message}) {
            throw new BadRequestException(message);
        }
    }

    @Post('tencent-verify-phone-check')
    async checkTencentVerifyPhone(
        @Request() req,
        @Body() body
    ) {
        try {
            if (!body.code || !req.user) {
                throw Error('Invalid request.');
            }
            const user = await this.usersService.getUserById(req.user.id);
            try {
        
                let smsVerifyresult = await this.usersService.smsVerify(req.user.id,body.code);
                if (!smsVerifyresult){
                    throw Error('You entered invalid verification code.');
                }
                let phone_user = await this.usersService.getUserByPhoneandID(user.phone, user._id);
                // if phone number is new
                if (phone_user.length == 0) {
                    // const transaction: Transaction = {
                    //     debit_user: TransactionUserType.System,
                    //     debit_type: TransactionValueType.InternalCredit,
                    //     debit_amount: 10,
                    //     credit_user: user._id,
                    //     credit_type: TransactionValueType.InternalCredit,
                    //     credit_amount: 10,
                    //     notes: `10 credits for phone verification.`,
                    //     type: TransactionType.AdminModification
                    // }
                    // await this.transactionsService.createTransaction(transaction);

                    //    if user is created from referring the invitation
                    if (user.referer_id && user.referer_id != "") {
                        const referer_user = await this.usersService.getUserById(user.referer_id);
                        // referer user gets 10 credits
                        const transaction: Transaction = {
                            debit_user: TransactionUserType.System,
                            debit_type: TransactionValueType.InternalCredit,
                            debit_amount: 10,
                            credit_user: referer_user._id,
                            credit_type: TransactionValueType.InternalCredit,
                            credit_amount: 10,
                            notes: `10 credits for each friend referral.`,
                            type: TransactionType.AdminModification
                        }
                        await this.transactionsService.createTransaction(transaction,false,10);
                    }
                }
                await this.usersService.updateUser(req.user.id, {phoneVerified: true});
                //    if user is created from referring the invitation
                if (user.referer_id && user.referer_id != "") {
                    const refer_user = await this.usersService.getUserById(user.referer_id);
                    const refer_friends = [];
                    refer_user.refer_friends.forEach(friend => {
                        if (friend.id.toString() == user._id.toString()) {
                            refer_friends.push({
                                id: friend.id,
                                username: friend.username,
                                email: friend.email,
                                phoneVerified: true
                            })
                        } else {
                            refer_friends.push({
                                id: friend.id,
                                username: friend.username,
                                email: friend.email,
                                phoneVerified: friend.phoneVerified
                            })
                        }
                    });
                    const refer_friend = {
                        refer_friends: refer_friends
                    };
                    await this.usersService.updateUser(refer_user._id, refer_friend);
                }
            } catch ({message}) {
                throw Error(message);
            }

            return {status: 'success'}
        } catch ({message}) {
            throw new BadRequestException(message);
        }
    }

    @Post('twilio-verify-phone-check')
    async checkTwilioVerifyPhone(
        @Request() req,
        @Body() body
    ) {
        try {
            if (!body.code || !req.user) {
                throw Error('Invalid request.');
            }
            const user = await this.usersService.getUserById(req.user.id);
            try {
                const {status} = await this.twilio.verify.services('VAd579cc838c1968efd93ec47e32035260').verificationChecks.create({
                    to: user.phone,
                    code: body.code
                });

                if (status !== 'approved') {
                    throw Error('You entered invalid verification code.');
                }

                let phone_user = await this.usersService.getUserByPhoneandID(user.phone, user._id);
                // if phone number is new
                if (phone_user.length == 0) {
                    const transaction: Transaction = {
                        debit_user: TransactionUserType.System,
                        debit_type: TransactionValueType.InternalCredit,
                        debit_amount: 10,
                        credit_user: user._id,
                        credit_type: TransactionValueType.InternalCredit,
                        credit_amount: 10,
                        notes: `10 credits for phone verification.`,
                        type: TransactionType.AdminModification
                    }
                    await this.transactionsService.createTransaction(transaction,false,10);

                    //    if user is created from referring the invitation
                    if (user.referer_id && user.referer_id != "") {
                        const referer_user = await this.usersService.getUserById(user.referer_id);
                        // referer user gets 5 credits
                        const transaction: Transaction = {
                            debit_user: TransactionUserType.System,
                            debit_type: TransactionValueType.InternalCredit,
                            debit_amount: 10,
                            credit_user: referer_user._id,
                            credit_type: TransactionValueType.InternalCredit,
                            credit_amount: 10,
                            notes: `10 credits for each friend referral.`,
                            type: TransactionType.AdminModification
                        }
                        await this.transactionsService.createTransaction(transaction);
                    }
                }
                await this.usersService.updateUser(req.user.id, {phoneVerified: true});
                //    if user is created from referring the invitation
                if (user.referer_id && user.referer_id != "") {
                    const refer_user = await this.usersService.getUserById(user.referer_id);
                    const refer_friends = [];
                    refer_user.refer_friends.forEach(friend => {
                        if (friend.id.toString() == user._id.toString()) {
                            refer_friends.push({
                                id: friend.id,
                                username: friend.username,
                                email: friend.email,
                                phoneVerified: true
                            })
                        } else {
                            refer_friends.push({
                                id: friend.id,
                                username: friend.username,
                                email: friend.email,
                                phoneVerified: friend.phoneVerified
                            })
                        }
                    });
                    const refer_friend = {
                        refer_friends: refer_friends
                    };
                    await this.usersService.updateUser(refer_user._id, refer_friend);
                }
            } catch ({message}) {
                throw Error(message);
            }

            return {status: 'success'}
        } catch ({message}) {
            throw new BadRequestException(message);
        }
    }

    @Get('verify-phone')
    async getPhoneVerificationCode(
        @Request() req,
        @Response() res
    ) {
        try {
            const user = await this.usersService.getUserById(req.user.id);

            if (!user || user.phoneVerified === true) {
                throw Error('Account does not exist or has been verified.');
            }

            const code = Math.floor(Math.random() * 1000000 - 1);

            await this.usersService.updateUser(req.user.id, {phoneVerified: code});

            await this.twilio.messages.create({
                body: `Your verification code is ${code}`,
                from: '+16303454753',
                to: user.phone
            })

            return res.status(HttpStatus.OK).json({status: 'success'});
        } catch ({message}) {
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Post('verify-phone')
    async confirmPhoneVerificationCode(
        @Request() req,
        @Response() res,
        @Body() body
    ) {
        try {
            const user = await this.usersService.getUserById(req.user.id);

            if (!user || user.phoneVerified === true) {
                throw Error('Account does not exist or has been verified.');
            }

            if (!body.code || Number.isNaN(parseInt(body.code))) {
                throw Error('Please enter valid code.');
            }

            const {phoneVerified} = await this.usersService.getUserByIdWithEmailKey(req.user.id);

            if (body.code !== phoneVerified) {
                throw Error('Invalid code.');
            }

            await this.usersService.updateUser(req.user.id, {phoneVerified: ''});

            return res.status(HttpStatus.OK).json({status: 'success'});
        } catch ({message}) {

            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Get('verify-email')
    async getVerificationCode(
        @Request() req,
        @Response() res, 
        @Query('language') language: string = "",      
    )  
    {
        try {
            
            const user = await this.usersService.getUserByIdWithEmailKey(req.user.id);

            if (!user || !user.emailVerified) {
                throw Error('Account does not exist or has been verified.');
            }
            const link = req.headers.referer +language+ "/authentication/verify-email?q=" + user.emailVerified;    
            console.log(link)        
            const msg = {
                to: user.username,
                from: 'no-reply@bilin.academy',
                subject: 'Verify your email',
                html: `<strong>Please click on the link below to verify your email address.</strong><br /><a href="${link}">Verify Email</a>`,
            };

            await sgMail.send(msg);

            return res.status(HttpStatus.OK).json({status: 'success'});
        } catch ({message}) {
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Post('verify-email')
    async verifyEmail(
        @Request() req,
        @Response() res,
        @Body() body
    ) {
        try {
            if (!body.code) {
                throw Error('Invalid request. Please try again.')
            }

            if (!await this.usersService.verifyEmail(body.code)) {
                throw Error('Invalid validation request. Please try again.');
            }

            return res.status(HttpStatus.OK).json({status: 'success'});
        } catch ({message}) {
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Post('refer-friend')
    async referFriend(
        @Request() req,
        @Response() res,
        @Body() body
    ) {
        // try {
        const refer_user = await this.usersService.getUserByIdWithEmailKey(body.referer_id);
        if (!refer_user) {
            throw Error('Account does not exist or has been verified.');
        }
        const user = await this.usersService.getUserByUsername(body.email.toLowerCase());
        if (user) {
            return res.status(HttpStatus.OK).json({status: 'error', message: 'Email has been registered already'});
        }

        const link = req.headers.referer.replace('profile', "authentication/signup?referer=" + body.referer_id + "&email=" + body.email.toLowerCase());
        // console.log(link);
        const us_site_link = "https://www.bilin.academy/";
        const cn_site_link = "https://www.bilinacademy.cn/";

        const msg = {
            to: body.email,
            from: 'no-reply@bilin.academy',
            subject: 'Join Bilin Academy with us',
            html: `<p>Join me at Bilin Academy, where children practice their second language while learning about the topics they love.</p>` +
                `<p>Classes in Chinese: Chinese Poetry Painting, Calligraphy Class, Go Class, and more.</p>` +
                `<p>Classes in English: Language Arts, Singapore Math, Chess Master Class, and more.</p><br>` +
                `<p>Get 2 Free Classes:</p>` +
                `<p>. &nbsp; Sign up for $20 free credits</p>` +
                `<p>. &nbsp; Refer 3 friends for $30 free credits</p><br>` +
                `<p>Click the link to join world classrooms at Bilin Academy. <strong><a href="${link}">Join Now</a></strong></p>` +
                `<p>Visit <strong><a href="${us_site_link}">www.bilin.academy</a></strong> (US) or <strong><a href="${cn_site_link}">www.bilinacademy.cn</a></strong> (CN) to learn more about Bilin Academy</p>` +
                `<p>Best regards,</p>` +
                `<p>${refer_user.name}, ${refer_user.email}</p>` +
                `<br><img src="https://bilinstudio-assets.s3.us-east-2.amazonaws.com/7459ec90-d813-11ea-a9e5-ab13c5a9a0d2.png">`,
        };
        await sgMail.send(msg);

        return res.status(HttpStatus.OK).json({status: 'success', message: 'Invite was sent successfully!'});
        // } catch ({message}) {
        //     return res.status(HttpStatus.BAD_REQUEST).json({message});
        // }
    }

    @Get('verify-email/:email')
    async checkVerifyEmail(
        @Param('email') email
    ) {
        let user = await this.usersService.getUserByUsername(email);

        if (!user) {
            return {success: false};
        }

        user = user.toObject();

        return {success: user.emailVerified};
    }
}
