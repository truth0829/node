import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as rp from 'request-promise';
import { ObjectId } from 'bson';
import * as _ from 'lodash';

const API_KEY = 'urXMahzpRjim_oUmmIHSeA';
const API_SECRET = '4PerNavS05guKPstZIiGNP2OXUWk36Czh1Hj';

@Injectable()
export class ZoomService {
    baseUrl: string;
    headers: any;

    constructor(){
        const payload = {
            iss: API_KEY,
            exp: ((new Date()).getTime() + 1000 * 60 * 60 * 24)
        };
          
        const token = jwt.sign(payload, API_SECRET);

        // console.log(token);
          
        this.baseUrl = 'https://api.zoom.us/v2/';
          
        this.headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    async createZoomUser(email: string){
        return new Promise(async (resolve, reject) => {
            rp({
                url: `${this.baseUrl}users`,
                method: 'POST',
                json: true,
                body: {
                    action: 'create',
                    user_info: {
                        email: email,
                        type: 2
                    }
                },
                headers: this.headers
            }).then((data) => {
                // console.log(data);

                resolve(data.id);
            }).catch(async (e) => {
                if(!_.startsWith(e.error.message, 'User already in the account')){
                    return reject(new Error(e.error.message));
                }
    
                let body = await rp({
                    url: `${this.baseUrl}users?page_size=300`,
                    method: 'GET',
                    headers: this.headers
                }).catch(e => {throw Error(e.error.message)});
    
                body = JSON.parse(body);
    
                const zoomUser = _.find(body.users, {
                    email: email
                }) as any;
    
                if(!zoomUser){
                    return reject(new Error('Cannot find this user.'));
                }
    
                resolve(zoomUser.id);
            });
        })
    }

    deleteUser(zoomId){
        return rp({
            url: `${this.baseUrl}users/${zoomId}?action=delete`,
            method: 'DELETE',
            headers: this.headers
          }).catch((e) => JSON.parse(e.error).message); 
    }

    async createMeeting({userid, topic, start_time, duration, timezone}){
        return await rp({
            url: `${this.baseUrl}users/${userid}/meetings`,
            method: 'POST',
            json: true,
            body: {
                timezone,
                topic,
                start_time,
                duration,
                settings: {
                    alternative_hosts: userid === 'CrqiQ6bDQLifEjYbnAC5OQ' ? undefined : 'CrqiQ6bDQLifEjYbnAC5OQ'
                }
            },
            headers: this.headers
        })
    }

    getPastMeetings(meetingId){
        return rp({
            url: `${this.baseUrl}past_meetings/${meetingId}`,
            method: 'GET',
            headers: this.headers,
            json: true
        });
    }

    async cancelMeetingIfExists(meetingId){
        return new Promise(async(resolve) => {
            try{
                await rp({
                    url: `${this.baseUrl}meetings/${meetingId}`,
                    method: 'DELETE',
                    headers: this.headers,
                    json: true
                });

                resolve(true);
            }catch(e){
                resolve(false);
            }
        })
    }
}
