import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {ObjectId} from "bson";

@Injectable()
export class SettingsService {
    constructor(
        @InjectModel('Settings') private readonly settingsModel: Model<any>
    ){}

    async getSettingsByType(type: string){
        return await this.settingsModel.findOne({type: type});
    }

    async updateSettingsByType(type: string, data: any){
        return await this.settingsModel.findOneAndUpdate({type: type}, {
            $set: data
        })
    }
    async addCategory(data) {
        const settings = await this.settingsModel.findOne({type: 'configs'});
        settings.new_categories.push(data);
        settings.save();
        return settings;
    }
    async deleteCategory(id) {
        const settings = await this.settingsModel.findOne({type: 'configs'});
        settings.new_categories.pull({
            _id: id
        });
        settings.save();
        return settings;
    }
}
