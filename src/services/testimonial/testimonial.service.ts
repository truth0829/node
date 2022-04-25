import {InjectModel} from '@nestjs/mongoose';
import {Injectable} from '@nestjs/common';
import {Model} from 'mongoose';

@Injectable()
export class TestimonialService {
    constructor(
        @InjectModel('Testimonial') private readonly testimonialModel: Model<any>,
    ) {
    }

    async getAllTestimonialByPaginate(queryOption: any = {}) {
        return await this.testimonialModel.find()
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
    }

    async getAllTestimonialForHome(language: string) {
        if (language == '') {
            return await this.testimonialModel.find();
        } else {
            return await this.testimonialModel.find({
                language: language
            });
        }
    }

    async getAllNumberOfTestimonial() {
        return await this.testimonialModel.find().countDocuments;
    }

    async createTestimonial(data) {
        return await (new this.testimonialModel({
            name: data.name,
            testimony: data.testimony,
            language: data.language
        })).save();
    }

    async deleteTestimonial(id) {
        return await this.testimonialModel.findByIdAndDelete(id);
    }

    async editTestimonial(id, data) {
        return await this.testimonialModel.findByIdAndUpdate(id, {
            name: data.name,
            testimony: data.testimony,
            language: data.language
        });
    }
}
