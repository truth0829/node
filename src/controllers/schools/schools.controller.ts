import {UsersService} from './../../services/users/users.service';
import {ObjectId} from 'bson';
import {HelperService} from './../../services/helper/helper.service';
import {SchoolsService} from './../../services/schools/schools.service';
import {Controller, Post, Get, Response, Body, Param, Delete, UseGuards, Query} from '@nestjs/common';

import * as _ from 'lodash';
import {AdminGuard} from "../../guards/admin.guard";

@Controller('schools')
export class SchoolsController {
    constructor(
        private schoolsService: SchoolsService,
        private helperService: HelperService,
        private usersService: UsersService
    ) {
    }

    @Get('')
    async getSchools(
        @Response() res
    ) {
        const data = await this.schoolsService.getSchools();

        return res.status(200).json({
            status: 200,
            data
        })
    }

    @Get('paginate-schools')
    @UseGuards(AdminGuard)
    async getSchoolsByPaginate(
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1
    ) {
        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const data = await this.schoolsService.getSchoolsByPaginate(queryOption);
        if (Number(first_load) == 1) {

            const number_of_users = await this.schoolsService.getNumberOfSchools();
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

    @Get(':id')
    async getSchool(
        @Response() res,
        @Param('id') id
    ) {
        const data = await this.schoolsService.getSchoolById(id);

        return res.status(200).json({
            ...data.toObject(),
            teachers: await this.usersService.getUsers({school: new ObjectId(id)})
        });
    }

    @Post('')
    async addSchool(
        @Response() res,
        @Body() body
    ) {
        try {
            if (!(body.admin && ObjectId.isValid(body.admin) && body.name)) {
                throw Error('Invalid school object.')
            }

            const school = _.pick(body, ['name', 'admin']);

            await this.schoolsService.addSchool({
                ...school,
                auto_id: await this.helperService.getNextSequenceValue('schools')
            })

            return res.status(200).json({
                status: 200,
                message: 'School has been successfully created.'
            })

        } catch ({message}) {
            return res.status(400).json({message});
        }
    }

    @Delete('')
    async deleteSchool(
        @Response() res,
        @Body() body,
    ) {
        try {
            if (!body.id || !ObjectId.isValid(body.id)) {
                throw Error('Invalid school object.')
            }

            await this.schoolsService.deleteSchool(body.id);

            return res.status(200).json({
                status: 200,
                message: 'School has been successfully deleted.'
            })

        } catch ({message}) {
            return res.status(400).json({message});
        }
    }
}
