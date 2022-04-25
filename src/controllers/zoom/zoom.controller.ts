import { ZoomService } from './../../services/zoom/zoom.service';
import { AdminGuard } from './../../guards/admin.guard';
import { CoursesService } from './../../services/courses/courses.service';
import { UsersService } from '../../services/users/users.service';
import { Controller, Get, Post, Body, HttpStatus, Response, Delete, Param, UseGuards } from '@nestjs/common';
import * as rp from 'request-promise';
import { ObjectId } from 'bson';
import * as _ from 'lodash';
import * as moment from 'moment';
import 'moment-timezone';

@Controller('zoom')
export class ZoomController {
    headers: any;
    baseUrl: string;

    constructor(
        private usersService: UsersService,
        private coursesService: CoursesService,
        private zoomService: ZoomService
    ){}

    @Post('')
    @UseGuards(AdminGuard)
    async requestZoomId(
        @Response() res,
        @Body() body
    ){
        try{
            const {userid} = body;

            if(!userid || !ObjectId.isValid(userid)){
                throw Error('User ID is not valid.');
            }

            const user = await this.usersService.getUserById(userid);

            if(!user){
                throw Error('Could not find the user.');
            }

            const newZoomId = await this.zoomService.createZoomUser(user.email);

            if(!newZoomId){
                throw Error('Zoom API doesn\'t work');
            }

            await this.usersService.updateUser(user._id, {
                zoomId: newZoomId
            })

            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Zoom ID has been successfully added.'
            });
        }catch(e){
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: e.message
            })
        }
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    async deleteZoomId(
        @Response() res,
        @Param('id') id
    ){
        try{
            if(!id || !ObjectId.isValid(id)){
                throw Error('User ID is invalid.');
            }
            
            const user = await this.usersService.getUserById(id);

            if(!user){
                throw Error('Could not find the user.');
            }

            const {zoomId} = user;

            // console.log(zoomId);
        
            if(!zoomId){
              throw Error('Zoom ID is not defined.');
            }

            await this.usersService.updateUser(id, {
                zoomId: ''
            });
        
            await this.zoomService.deleteUser(zoomId);
        
            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Zoom information has been successfully updated.'
            })
        }catch(e){
            res.status(HttpStatus.BAD_REQUEST).json({
                message: e.message
            })
        }
    }

    @Post('meeting')
    @UseGuards(AdminGuard)
    async createMeeting(
        @Response() res,
        @Body() body
    ){
        try{
            const {start_time, duration, topic, userid, timezone} = body;
  
            if(!start_time){
                throw Error('Start time is not defined.');
            }
        
            if(!duration){
                throw Error('Duration is not defined.');
            }
        
            if(!topic){
                throw Error('Topic is not defined.');
            }
        
            if(!userid){
                throw Error('UserID is not defined.');
            }

            if(!timezone){
                throw Error('TimeZone is not defined.');
            }

            const data = await this.zoomService.createMeeting({userid, topic, start_time: moment(start_time).tz(timezone).format('YYYY-MM-DDTHH:mm:ss'), duration, timezone});
          
            return res.status(HttpStatus.OK).json({data: data});

        }catch(e){
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: e.message
            })
        }
    }

    @Post('completion')
    async checkSessionCompletion(
        @Response() res,
        @Body() body
    ){
        try{
            const {meetingId, courseId} = body;

            if(!meetingId){
                throw Error('Meeting ID is not found.');
            }

            if(!courseId || !ObjectId.isValid(courseId)){
                throw Error('Course ID is invalid.')
            }

            const course = await this.coursesService.getCourseById(courseId);

            if(!course){
                throw Error('Could not find the course.');
            }

            let pastMeeting = await this.zoomService.getPastMeetings(meetingId);

            if(!pastMeeting || !pastMeeting.participants_count || !pastMeeting.total_minutes){
                throw Error('Looks like you did\'t complete the session. Please contact support team.');
            }

            // if(pastMeeting.participants_count < 2){
            //     throw Error('Looks like you didn\'t have any participants. Please contact support team')
            // }

            // if(pastMeeting.total_minutes < parseInt(course.session_duration) * 0.9){
            //     throw Error(`Your session was only ${pastMeeting.total_minutes} minutes. Please contact support team`);
            // }

            return res.status(HttpStatus.OK).json({
                status: 200,
                message: 'Session has been successfully validated.'
            });

        }catch(e){
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: e.message
            })
        }
    }
}