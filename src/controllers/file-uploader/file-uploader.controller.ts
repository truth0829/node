import {
    Controller,
    Post,
    Body,
    Put,
    Res,
    HttpStatus,
    Response,
    Query,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as _ from 'lodash'
import {FilesInterceptor} from "@nestjs/platform-express";


@Controller('file-uploader')
export class FileUploaderController {
    @Post('')
    async asignS3BucketForProfiles(
        @Body() body,
        @Query('uploadToChina') uploadToChina
    ) {
        const storageEast = new AWS.S3({
            accessKeyId: '',
            secretAccessKey: '',
            signatureVersion: 'v4',
            region: 'us-east-2'
        });

        const AWSurl = storageEast.getSignedUrl('putObject', {
            Bucket: `bilinstudio-assets`,
            Key: body.key,
            Expires: 60 * 60,
            ACL: 'public-read',
            ContentType: body.contentType
        });

        const storageChina = new AWS.S3({
            accessKeyId: '',
            secretAccessKey: '',
            signatureVersion: 'v4',
            region: 'cn-north-1'
        });

        const AWSurl_ch = storageChina.getSignedUrl('putObject', {
            Bucket: `bilinstudio-assets`,
            Key: body.key,
            Expires: 60 * 60,
            ACL: 'public-read',
            ContentType: body.contentType
        });

        return {AWSurl, AWSurl_ch};
    }

    @Put('')
    async uploadFiles(
        @Body() body,
        @Response() res
    ) {
        try {
            if (!['material'].includes(body.role)) {
                throw Error('Invalid role');
            }


        } catch ({message}) {
            return res.status(HttpStatus.BAD_REQUEST).json({message});
        }
    }

    @Post('upload')
    @UseInterceptors(FilesInterceptor('file'))

    async uploadFile(
        @UploadedFiles() file
    ) {
        const storageChina = new AWS.S3({
            accessKeyId: '',
            secretAccessKey: '/EFK',
            signatureVersion: 'v4',
            region: 'cn-north-1'
        });
        const storageEast = new AWS.S3({
            accessKeyId: '',
            secretAccessKey: '',
            signatureVersion: 'v4',
            region: 'us-east-2'
        });

        // upload file to S3 in China
        const AWSurl_ch = await storageChina.upload({
            Bucket: 'bilinstudio-assets',
            Key: file[0]['originalname'],
            Body: file[0]['buffer'],
            ACL: 'public-read'
        }).promise();
        // console.log("Uploaded successfully to China S3");

        // upload file to S3 in US
        const AWSurl_east = await storageEast.upload({
            Bucket: 'bilinstudio-assets',
            Key: file[0]['originalname'],
            Body: file[0]['buffer'],
            ACL: 'public-read'
        }).promise();
        // console.log("Uploaded successfully to US S3");
        return {AWSurl_ch, AWSurl_east};
    }

    @Post('us')
    async asignUSS3BucketForProfiles(
        @Body() body,
        @Query('uploadToUS') uploadToUS
    ) {
        const storageEast = new AWS.S3({
            accessKeyId: '',
            secretAccessKey: '',
            signatureVersion: 'v4',
            region: 'us-east-2'
        });
        const AWSurl = storageEast.getSignedUrl('putObject', {
            Bucket: 'bilinstudio-assets',
            Key: body.key,
            Expires: 60 * 60,
            ACL: 'public-read',
            ContentType: body.contentType
        });
        return {AWSurl};
    }
    @Post('china')
    async asignChinaS3BucketForProfiles(
        @Body() body,
        @Query('uploadToChina') uploadToChina
    ) {
        const storageChina = new AWS.S3({
            accessKeyId: '',
            secretAccessKey: '/EFK',
            signatureVersion: 'v4',
            region: 'cn-north-1'
        });
        const AWSurl = storageChina.getSignedUrl('putObject', {
            Bucket: 'bilinstudio-assets',
            Key: body.key,
            Expires: 60 * 60,
            ACL: 'public-read',
            ContentType: body.contentType
        });
        return {AWSurl};
    }
}

