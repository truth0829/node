import {Controller, Get, Param, Response, HttpStatus, Post, Put, Body, Delete, Request} from '@nestjs/common';

import * as _ from 'lodash';
import {SettingsService} from '../../services/settings/settings.service';
import {ObjectId} from "bson";

@Controller('settings')
export class SettingsController {
    constructor(
        private settingsService: SettingsService
    ) {
    }

    @Get(':type')
    async getConfigs(
        @Response() res,
        @Param('type') type,
        @Request() req: any
    ) {
        const settings = await this.settingsService.getSettingsByType(type);

        var language = '';
        if (req.headers.referer) {
            if (req.headers.referer.includes("en")) {
                language = "English";
            }
            if (req.headers.referer.includes("ch")) {
                language = "Chinese";
            }
        } else {
            language = "English";
        }

        if (!settings) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Unknown settings type'
            })
        }

        return res.status(HttpStatus.OK).json({
            status: 200,
            data: settings,
            language: language
        })
    }

    @Put(':type')
    async updateConfigs(
        @Response() res,
        @Param('type') type,
        @Body() body
    ) {
        const settings = await this.settingsService.getSettingsByType(type);

        if (!settings) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Unknown settings type'
            })
        }

        const newSettings = _.pickBy({
            featured: body.featured,
            loginText: body.loginText,
            promotions: body.promotions,
            social: body.social,
            title: body.title,
            title_ch: body.title_ch,
            titleItems: body.titleItems,
            categories: body.categories,
            skills: body.skills,
            creditsToPurchase: body.creditsToPurchase,
            promoterRate:body.promoterRate,
            fees: body.fees,
            pricePerCredit: body.pricePerCredit,
            images: body.images
        }, _.identity);

        await this.settingsService.updateSettingsByType(type, newSettings);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Settings has been successfully updated'
        })
    }

    @Post('addcategory')
    async addCategory(
        @Response() res,
        @Body() body
    ) {
        if (!(body.picture && body.name)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Material is invalid.'
            })
        }
        const settings = await this.settingsService.addCategory(body);
        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Category has been successfully created.',
            categories: settings.new_categories
        })
    }

    @Delete('category/:id')
    async deleteCategory(
        @Response() res,
        @Param('id') id
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Category ID is invalid.'
            })
        }
        const settings = await this.settingsService.deleteCategory(id);
        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Category has been successfully deleted.',
            categories: settings.new_categories
        })
    }

}
