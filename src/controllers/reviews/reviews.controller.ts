import {AdminGuard} from './../../guards/admin.guard';
import {Controller, Get, Query, HttpStatus, Response, Body, Post, Res, Delete, Param, UseGuards} from '@nestjs/common';
import {ReviewsService} from '../../services/reviews/reviews.service';
import {ObjectId} from 'bson';

@Controller('reviews')
export class ReviewsController {
    constructor(
        private reviewsService: ReviewsService
    ) {
    }

    @Get('')
    async getReviews(
        @Query('from') from,
        @Query('to') to,
        @Response() res
    ) {
        if (!(from && ObjectId.isValid(from) || to && ObjectId.isValid(to))) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Reviews request is invalid.'
            })
        }

        const query: any = {};

        if (from) {
            query.from = new ObjectId(from);
        }

        if (to) {
            query.to = new ObjectId(to);
        }

        const reviews = await this.reviewsService.getReviews(query);

        return res.status(HttpStatus.OK).json({
            status: 200,
            data: reviews
        })
    }


    @Post('')
    async createReview(
        @Body() body,
        @Response() res
    ) {
        if (!(body.message && body.stars && body.from && body.to && body.type)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Review is invalid.'
            })
        }

        await this.reviewsService.createReview(body);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Review has been successfully created.'
        })
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    async deleteReview(
        @Param('id') id,
        @Response() res
    ) {
        if (!id || !ObjectId.isValid(id)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Review ID is invalid.'
            })
        }

        await this.reviewsService.deleteReview(id);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Review has been successfully deleted.'
        })

    }
}
