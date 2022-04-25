import {InjectModel} from '@nestjs/mongoose';
import {Injectable} from '@nestjs/common';
import {Model} from 'mongoose';
import {HelperService} from '../helper/helper.service';
import {ObjectId} from 'bson';
import * as Stripe from 'stripe';

@Injectable()
export class PaymentsService {
    private stripe;

    constructor(
        @InjectModel('Payments') private readonly paymentsModel: Model<any>,
        private helperService: HelperService
    ) {
        // this.stripe = new Stripe('');
        this.stripe = new Stripe('');
    }

    async getAllPayments() {
        return await this.paymentsModel.aggregate([
            {
                $sort: {
                    update_time: -1
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $addFields: {
                    user: {
                        $arrayElemAt: ['$user', 0]
                    }
                }
            },
            {
                $project: {
                    'user.password': 0
                }
            }
        ])
    }

    async getAllPaymentsByPaginate(queryOption: any = {}) {
        return await this.paymentsModel.aggregate([
            {
                $sort: {
                    update_time: -1
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $addFields: {
                    user: {
                        $arrayElemAt: ['$user', 0]
                    }
                }
            },
            {
                $project: {
                    'user.password': 0
                }
            }
        ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
    }

    async getAllNumberOfPayments() {  
        return await this.paymentsModel.countDocuments();
    }

    async createAliPayToken(amount, currency, return_url) {
        const source = await this.stripe.sources.create({
            type: 'alipay',
            amount: amount * 100,
            currency: currency,
            statement_descriptor: 'Bilin Studio Account Balance',
            redirect: {
                return_url,
            }
        });

        return {
            client_secret: source.client_secret,
            url: source.redirect.url,
            id: source.id
        };
    }

    async createWeChatToken(amount, currency) {
        const source = await this.stripe.sources.create({
            type: 'wechat',
            amount: amount * 100,
            currency: currency,
            statement_descriptor: 'Bilin Studio Account Balance'
        });

        return {
            url: source.wechat.qr_code_url,
            id: source.id
        };
    }

    async createStripeAppPayment({payment_id, amount, user_id}) {
        return await (new this.paymentsModel({
            auto_id: await this.helperService.getNextSequenceValue('payments'),
            amount,
            create_time: new Date(),
            currency: 'USD',
            payment_id,
            payment_type: 'Stripe APP',
            status: 'COMPLETED',
            update_time: new Date(),
            user_id
        })).save();
    }

    async createAliPayPayment(id) {
        const payment = await this.paymentsModel.findById(id);

        if (!payment) {
            throw Error('Could not find your payment.');
        }

        const {status, amount, currency, id: source} = await this.stripe.sources.retrieve(payment.payment_id);

        if (status !== 'chargeable') {
            throw Error('Payment has not been authorized. Please authorize your payment and then procceed.');
        }

        await this.stripe.charges.create({
            amount,
            currency,
            source
        })

        await this.paymentsModel.findByIdAndUpdate(id, {
            update_time: new Date(),
            status: 'COMPLETED'
        })

        return await this.paymentsModel.findById(id);
    }

    async createWeChatPayment(id) {
        const payment = await this.paymentsModel.findById(id);

        if (!payment) {
            throw Error('Could not find your payment.');
        }

        const {status, amount, currency, id: source} = await this.stripe.sources.retrieve(payment.payment_id);

        if (status !== 'chargeable') {
            throw Error('Payment has not been authorized. Please authorize your payment and then procceed.');
        }

        await this.stripe.charges.create({
            amount,
            currency,
            source
        })

        await this.paymentsModel.findByIdAndUpdate(id, {
            update_time: new Date(),
            status: 'COMPLETED'
        })

        return await this.paymentsModel.findById(id);
    }

    async createPayment(data) {
        return await (new this.paymentsModel({
            auto_id: await this.helperService.getNextSequenceValue('payments'),
            amount: data.amount,
            create_time: data.create_time,
            currency: data.currency,
            payment_id: data.payment_id,
            client_secret: data.client_secret,
            payment_type: data.payment_type,
            status: data.status,
            update_time: data.update_time,
            user_id: data.user_id
        })).save();
    }

    async getPaymentsByUserId(uid: string) {
        return await this.paymentsModel.aggregate([
            {
                $match: {
                    user_id: new ObjectId(uid),
                    status: 'COMPLETED'
                }
            },
            {
                $sort: {
                    create_time: -1
                }
            }
        ])
    }
}
