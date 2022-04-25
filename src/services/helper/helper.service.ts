import { CountersSchema } from './../../schemas/counters';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

interface Counters{
    _id: String;
    sequence_value: Number;
}

@Injectable()
export class HelperService {
    constructor(
        @InjectModel('Counters') private readonly countersModel: Model<any>,
    ){}

    async getNextSequenceValue(sequenceName){
        if (!await this.countersModel.findById(sequenceName)) {
            await (new this.countersModel({
                _id: sequenceName,
                sequence_value:0
            })).save();
        }
        const {sequence_value} = await this.countersModel.findOneAndUpdate({
            _id: sequenceName
        }, {$inc: {sequence_value:1}}, {new: true});
         
        return sequence_value;
    }     

}
