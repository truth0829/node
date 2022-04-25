import {UsersService} from './../../services/users/users.service';
import {CoursesService} from './../../services/courses/courses.service';
import {UserType} from './../../schemas/user';
import {ObjectId} from 'bson';
import {AssetsService} from './../../services/assets/assets.service';
import {
    Controller,
    Get,
    Response,
    HttpStatus,
    Post,
    Body,
    Delete,
    Param,
    Query,
    UseGuards,
    Request
} from '@nestjs/common';
import {AdminGuard} from "../../guards/admin.guard";

@Controller('assets')
export class AssetsController {
    constructor(
        private assetsService: AssetsService,
        private coursesService: CoursesService,
        private usersService: UsersService
    ) {
    }

    @Get('drawings')
    async getDrawings(
        @Response() res,
        @Query('session_id') session_id
    ) {
        const params: any = {};

        if (session_id && ObjectId.isValid(session_id)) {
            params.session_id = new ObjectId(session_id);
        }

        const drawings = await this.assetsService.getDrawings(params);

        return res.status(HttpStatus.OK).json({
            status: 200,
            data: drawings
        })
    }

    @Get('paginate-drawings')
    @UseGuards(AdminGuard)
    async getDrawingsByPaginate(
        @Query('session_id') session_id,
        @Query('page') request_page: number = 1,
        @Query('first_load') first_load: number = 1
    ) {

        const params: any = {};

        if (session_id && ObjectId.isValid(session_id)) {
            params.session_id = new ObjectId(session_id);
        }

        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const data = await this.assetsService.getDrawingsByPaginate(
            queryOption, params
        );
        if (Number(first_load) == 1) {

            const number_of_users = await this.assetsService.getNumberOfDrawings(params);
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

    @Post('drawings')
    async createDrawing(
        @Response() res,
        @Body() body
    ) {
        if (!(body.course_id && body.lesson_id && body.session_id && body.uploaded_by && body.url)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Drawing is invalid.'
            })
        }

        await this.assetsService.createDrawing(body);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Drawing has been successfully created.'
        })
    }

    @Delete('drawings/:id')
    async deleteDrawing(
        @Response() res,
        @Param('id') id
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Drawing ID is invalid.'
            })
        }

        const drawing = await this.assetsService.getDrawingById(id);

        if (!drawing) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Could not find the drawing.'
            })
        }

        await this.assetsService.deleteDrawing(id);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Drawing has been successfully deleted.'
        })
    }


    @Get('materials')
    async getMaterials(
        @Response() res
    ) {
        const materials = await this.assetsService.getMaterials();

        return res.status(HttpStatus.OK).json({
            status: 200,
            data: materials
        })
    }

    @Get('paginate-materials')
    @UseGuards(AdminGuard)
    async getMaterialsByPaginate(
        @Query('page') request_page: number = 1,
        @Query('field') field: string = "",
        @Query('value') value: string = "",
        @Query('first_load') first_load: number = 1
    ) {
        let limit = 20;
        const queryOption: any = {
            offset: request_page,
            limit: limit
        };
        const search_key: any = {
            field: field,
            value: value
        };
        // console.log(aggregatePipe)
        const data = await this.assetsService.getMaterialsByPaginate(
            queryOption, search_key
        );
        if (Number(first_load) == 1) {

            const number_of_users = await this.assetsService.getNumberOfMaterials(search_key);

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


    @Get('materials/:id')
    async getSingleMaterial(
        @Response() res,
        @Param('id') id
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Material ID is invalid.'
            })
        }

        const data = await this.assetsService.getMaterialById(id);

        return res.status(HttpStatus.OK).json({data})
    }

    @Get('homeworks')
    async getHomeworks(
        @Request() req: any,
        @Response() res,
        @Body() body
    ) {
        let query: any = {};

        const user = await this.usersService.getUserById(req.user.id);

        if (user.type === UserType.Student) {
            query.user_id = new ObjectId(req.user.id);
        }

        if (user.type === UserType.Teacher) {
            const coursesByTeacher = (await this.coursesService.getLessonsByTeacherId(req.user.id)).map(v => v.course_id);

            if (!coursesByTeacher || !coursesByTeacher.length) {
                return res.status(200).json({data: []});
            }

            query.course_id = {
                $in: coursesByTeacher
            }
        }

        const data = await this.assetsService.getHomeworks(query);

        return res.status(HttpStatus.OK).json({data});
    }

    @Post('homeworks')
    async createHomeworks(
        @Request() req: any,
        @Response() res,
        @Body() body
    ) {
        if (!(body.url && body.course_id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Material is invalid.'
            })
        }

        body.user_id = req.user.id;

        const {_id} = await this.assetsService.createHomework(body);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Homework has been successfully created.',
            _id
        })
    }

    @Post('materials')
    async createMaterial(
        @Response() res,
        @Body() body
    ) {
        if (!(body.url && body.description)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Material is invalid.'
            })
        }

        const {_id} = await this.assetsService.createMaterial(body);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Material has been successfully created.',
            _id
        })
    }

    @Delete('materials/:id')
    async deleteMaterial(
        @Response() res,
        @Param('id') id
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Material ID is invalid.'
            })
        }

        await this.assetsService.deleteMaterial(id);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Material has been successfully deleted.'
        })
    }

}
