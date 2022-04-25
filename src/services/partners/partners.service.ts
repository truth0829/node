import {InjectModel} from '@nestjs/mongoose';
import {Injectable} from '@nestjs/common';
import {Model} from 'mongoose';

@Injectable()
export class PartnersService {
    constructor(
        @InjectModel('Partners') private readonly partnersModel: Model<any>,
    ) {
    }

    async getAllPartnersByPaginate(queryOption: any = {}) {
        return await this.partnersModel.find()
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit));
    }
    async getAllPartnersForHome() {
        return await this.partnersModel.find();
    }
    async getAllNumberOfPartners() {
        return await this.partnersModel.find().countDocuments;
    }

    async createPartners(data) {
        return await (new this.partnersModel({
            name: data.name,
            icon: data.icon,
            description: data.description
        })).save();
    }

    async deletePartners(id) {
        return await this.partnersModel.findByIdAndDelete(id);
    }

    async editPartners(id, data) {
        if (data.icon !== ""){
            return await this.partnersModel.findByIdAndUpdate(id, {
                name: data.name,
                icon: data.icon,
                description: data.description
            });
        } else {
            const last_document = await this.partnersModel.findById(id);
            return await this.partnersModel.findByIdAndUpdate(id, {
                name: data.name,
                icon: last_document.icon,
                description: data.description
            });
        }

    }
}
