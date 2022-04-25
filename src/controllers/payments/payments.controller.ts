import { PaymentType } from './../../schemas/payments';
import { TransactionUserType, TransactionType } from './../../schemas/transactions';
import { Controller, Post, Body, HttpStatus, Response, Request, Query, UseGuards, Get } from '@nestjs/common';
import { PaymentsService } from '../../services/payments/payments.service';
import { TransactionsService } from '../../services/transactions/transactions.service';
import { TransactionValueType } from '../../schemas/transactions';
import { ObjectId } from 'bson';
import { SettingsService } from './../../services/settings/settings.service';
import {UsersService} from '../../services/users/users.service';
import axios from 'axios';

@Controller('payments')
export class PaymentsController {
    constructor(
        private paymentsService: PaymentsService,
        private transactionsService: TransactionsService,
        private usersService: UsersService,
        private settingsService: SettingsService
    ){}

    @Post('')
    async createPayment(
        @Request() req,
        @Response() res,
        @Body() body
    ){
        if(!(body.credits && body.create_time && body.paypal_id && body.payer_id && body.payer_email_address && body.status && body.update_time && body.amount && body.currency)){
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Invalid payment request.'
            })
        }

        const payment = await this.paymentsService.createPayment({
            ...body,
            payment_type: PaymentType.PayPal,
            payment_id: body.paypal_id,
            user_id: req.user.id
        })

        await this.transactionsService.createTransaction({
            debit_user: req.user.id,
            debit_type: TransactionValueType.USD,
            debit_amount: parseFloat(body.amount),
            credit_user: TransactionUserType.System,
            credit_type: TransactionValueType.USD,
            credit_amount: parseFloat(body.amount),
            notes: `Purchased via Paypal | Payment #${payment.auto_id}`,
            type: TransactionType.PurchaseCurrency,
            payment_id: new ObjectId(payment._id)
        })

        await this.transactionsService.createTransaction({
            debit_user: TransactionUserType.System,
            debit_type: TransactionValueType.InternalCredit,
            debit_amount: parseInt(body.credits),
            credit_user: req.user.id,
            credit_type: TransactionValueType.InternalCredit,
            credit_amount: parseInt(body.credits),
            notes: `Credits added to your balance | Payment #${payment.auto_id}`,
            type: TransactionType.PurchaseInternalCredit
        })

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Payment has been successfully created.'
        })
    }

    @Get('alipay')
    async createAliPayToken(
        @Request() req,
        @Response() res,
        @Query('b') balance,
        @Query('c') currency,
        @Query('r') return_url
    ){
        try{
            if(!(balance && parseInt(balance) && !Number.isNaN(parseInt(balance)) && parseInt(balance) >= 1 && parseInt(balance) <= 1000)){
                throw Error('Invalid balance. Please try again.');
            }

            if(!(currency && ['USD'].includes(currency))){
                throw Error('Invalid currency. Please try again.');
            }

            if(!return_url){
                throw Error('Return URL is required.');
            }

            const source = await this.paymentsService.createAliPayToken(balance, currency, decodeURI(return_url));

            const payment = await this.paymentsService.createPayment({
                amount: balance,
                create_time: new Date(),
                currency: currency,
                client_secret: source.client_secret,
                payment_id: source.id,
                payment_type: PaymentType.AliPay,
                status: 'PENDING',
                user_id: new ObjectId(req.user.id)
            })

            return res.status(HttpStatus.OK).json({
                status: 200,
                source: {
                    url: source.url,
                    id: payment._id
                }
            })

        }catch({message}){
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Post('stripe')
    async createStripePayment(
        @Request() req,
        @Response() res,
        @Body() body
    ){
        try{
            if(!body){
                throw Error('Invalid request.');
            }

            const {token} = body;

            if(!token){
                throw Error('Payment Id is invalid.')
            }

            const {token: {tokenId}, amount} = token;

            const {data: {payment_id}} = await axios.post('', {
                token: tokenId,
                amount: amount * 100
            })

            const payment = await this.paymentsService.createStripeAppPayment({amount, payment_id, user_id: req.user.id});

            await this.transactionsService.createTransaction({
                debit_user: req.user.id,
                debit_type: TransactionValueType.USD,
                debit_amount: parseFloat(payment.amount),
                credit_user: TransactionUserType.System,
                credit_type: TransactionValueType.USD,
                credit_amount: parseFloat(payment.amount),
                notes: `Purchased via Stripe App | Payment #${payment.auto_id}`,
                type: TransactionType.PurchaseCurrency,
                payment_id: new ObjectId(payment._id)
            })

            const {pricePerCredit} = await this.settingsService.getSettingsByType('configs');
    
            await this.transactionsService.createTransaction({
                debit_user: TransactionUserType.System,
                debit_type: TransactionValueType.InternalCredit,
                debit_amount: parseInt(payment.amount) * (pricePerCredit || 1),
                credit_user: req.user.id,
                credit_type: TransactionValueType.InternalCredit,
                credit_amount: parseInt(payment.amount) * (pricePerCredit || 1),
                notes: `Credits added to your balance | Payment #${payment.auto_id}`,
                type: TransactionType.PurchaseInternalCredit
            })

            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Payment has been successfully approved.'
            })

        }catch({message}){
            // console.log(message);

            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Post('alipay')
    async createAliPayPayment(
        @Request() req,
        @Response() res,
        @Body() body
    ){
        try{
            if(!(body && body.id && ObjectId.isValid(body.id))){
                throw Error('Payment Id is invalid.')
            }

            const payment = await this.paymentsService.createAliPayPayment(body.id);

            await this.transactionsService.createTransaction({
                debit_user: req.user.id,
                debit_type: TransactionValueType.USD,
                debit_amount: parseFloat(payment.amount),
                credit_user: TransactionUserType.System,
                credit_type: TransactionValueType.USD,
                credit_amount: parseFloat(payment.amount),
                notes: `Purchased via AliPay | Payment #${payment.auto_id}`,
                type: TransactionType.PurchaseCurrency,
                payment_id: new ObjectId(payment._id)
            })

            const {pricePerCredit} = await this.settingsService.getSettingsByType('configs');
    
            await this.transactionsService.createTransaction({
                debit_user: TransactionUserType.System,
                debit_type: TransactionValueType.InternalCredit,
                debit_amount: parseInt(payment.amount) * (pricePerCredit || 1),
                credit_user: req.user.id,
                credit_type: TransactionValueType.InternalCredit,
                credit_amount: parseInt(payment.amount) * (pricePerCredit || 1),
                notes: `Credits added to your balance | Payment #${payment.auto_id}`,
                type: TransactionType.PurchaseInternalCredit
            })

            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Payment has been successfully approved.'
            })

        }catch({message}){
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Get('wechat')
    async createWeChatToken(
        @Request() req,
        @Response() res,
        @Query('b') balance,
        @Query('c') currency
    ){
        try{
            if(!(balance && parseInt(balance) && !Number.isNaN(parseInt(balance)) && parseInt(balance) >= 1 && parseInt(balance) <= 1000)){
                throw Error('Invalid balance. Please try again.');
            }

            if(!(currency && ['USD'].includes(currency))){
                throw Error('Invalid currency. Please try again.');
            }

            const source = await this.paymentsService.createWeChatToken(balance, currency);

            const payment = await this.paymentsService.createPayment({
                amount: balance,
                create_time: new Date(),
                currency: currency,
                payment_id: source.id,
                payment_type: PaymentType.WeChat,
                status: 'PENDING',
                user_id: new ObjectId(req.user.id)
            })

            return res.status(HttpStatus.OK).json({
                status: 200,
                source: {
                    url: source.url,
                    id: payment._id
                }
            })

        }catch({message}){
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Post('wechat')
    async createWeChatPayment(
        @Request() req,
        @Response() res,
        @Body() body
    ){
        try{
            if(!(body && body.id && ObjectId.isValid(body.id))){
                throw Error('Payment Id is invalid.')
            }

            const payment = await this.paymentsService.createWeChatPayment(body.id);

            await this.transactionsService.createTransaction({
                debit_user: req.user.id,
                debit_type: TransactionValueType.USD,
                debit_amount: parseFloat(payment.amount),
                credit_user: TransactionUserType.System,
                credit_type: TransactionValueType.USD,
                credit_amount: parseFloat(payment.amount),
                notes: `Purchased via WeChat | Payment #${payment.auto_id}`,
                type: TransactionType.PurchaseCurrency,
                payment_id: new ObjectId(payment._id)
            })

            const {pricePerCredit} = await this.settingsService.getSettingsByType('configs');
    
            await this.transactionsService.createTransaction({
                debit_user: TransactionUserType.System,
                debit_type: TransactionValueType.InternalCredit,
                debit_amount: parseInt(payment.amount) * (pricePerCredit || 1),
                credit_user: req.user.id,
                credit_type: TransactionValueType.InternalCredit,
                credit_amount: parseInt(payment.amount) * (pricePerCredit || 1),
                notes: `Credits added to your balance | Payment #${payment.auto_id}`,
                type: TransactionType.PurchaseInternalCredit
            })

            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Payment has been successfully approved.'
            })

        }catch({message}){
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Post('mini_app_wechat')
    async createMiniAppWeChatPayment(
        @Request() req,
        @Response() res,
        @Body() body
    ){
        try{
            if(!(body && body.amount)){
                throw Error('Invalid body in request.')
            }

            await this.transactionsService.createTransaction({
                debit_user: req.user.id,
                debit_type: TransactionValueType.USD,
                debit_amount: parseFloat(body.amount),
                credit_user: TransactionUserType.System,
                credit_type: TransactionValueType.USD,
                credit_amount: parseFloat(body.amount),
                notes: `Purchased via WeChat Mini app`,
                type: TransactionType.PurchaseCurrency
            })

            const {pricePerCredit} = await this.settingsService.getSettingsByType('configs');

            await this.transactionsService.createTransaction({
                debit_user: TransactionUserType.System,
                debit_type: TransactionValueType.InternalCredit,
                debit_amount: parseInt(body.amount) * (pricePerCredit || 1),
                credit_user: req.user.id,
                credit_type: TransactionValueType.InternalCredit,
                credit_amount: parseInt(body.amount) * (pricePerCredit || 1),
                notes: `Credits added to your balance`,
                type: TransactionType.PurchaseInternalCredit
            })

            const user = await this.usersService.getUserById(req.user.id);

            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Payment has been successfully approved.',
                data: user
            })

        }catch({message}){
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }
}
