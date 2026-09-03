import { Strategy } from 'passport-jwt';
import { JwtAccessPayload } from './types';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: JwtAccessPayload): AuthenticatedUser;
}
export {};
