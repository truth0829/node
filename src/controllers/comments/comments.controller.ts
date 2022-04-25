import { AdminGuard } from './../../guards/admin.guard';
import { CommentsService } from './../../services/comments/comments.service';
import { Controller, Get, Body, Response, Post, HttpStatus, Delete, Query, Param, UseGuards } from '@nestjs/common';
import { ObjectId } from 'bson';

@Controller('comments')
export class CommentsController {
    constructor(
        private commentsService: CommentsService
    ){}

    @Get('')
    async getComments(
        @Response() res,
        @Query('to') to,
        @Query('from') from
    ){
        if(!(to && ObjectId.isValid(to) || from && ObjectId.isValid(from))){
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Invalid TO or FROM parameter.'
            })
        }

        const match: any = {};

        if(to){
            match.to = new ObjectId(to);
        }

        if(from){
            match.from = new ObjectId(from);
        }

        const comments = await this.commentsService.getComments(match);

        return res.status(HttpStatus.OK).json({
            status: 200,
            data: comments
        })
    }

    @Post('')
    async createComment(
        @Response() res,
        @Body() body
    ){
        if(!(body.name && body.message && body.from && body.to)){
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Name or message is invalid.'
            })
        }

        await this.commentsService.createComment({
            name: body.name,
            message: body.message,
            from: body.from,
            to: body.to
        });

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Comment has been successfully created.'
        });
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    async deleteComment(
        @Response() res,
        @Param('id') id
    ){
        if(!(id && ObjectId.isValid(id))){
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Comment ID is invalid.'
            })
        }

        await this.commentsService.deleteComment(id);

        return res.status(HttpStatus.OK).json({
            status: 200,
            message: 'Comment has been successfully deleted.'
        })
    }
}
