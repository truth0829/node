import { createParamDecorator } from '@nestjs/common';

export const JwtData = createParamDecorator((data, req) => {
    return req.user;
});
