import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import * as jwtDecode from 'jwt-decode';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const request = context.switchToHttp().getRequest();

    const jwtToDecode = _.replace(request.headers.authorization, 'Bearer ', '');
    const decoded = jwtDecode(jwtToDecode);

    if(!decoded || !decoded.isAdmin){
      return false;
    }

    return true;
  }
}
