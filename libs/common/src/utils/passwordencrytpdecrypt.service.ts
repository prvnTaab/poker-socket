import { Injectable } from "@nestjs/common";
import * as crypto from 'crypto';



@Injectable()
export class PasswordencrytpdecryptService {



    private readonly algorithm = 'aes-256-ctr';
    private readonly key = crypto.createHash('sha256').update(String('37LvDSm4XvjYOh9Y')).digest(); // 32 bytes
    private readonly iv = Buffer.alloc(16, 0); // static IV (use random in production)

    encrypt(password: string): { success: boolean; result?: string; info?: string } {
        try {
            const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
            let crypted = cipher.update(password, 'utf8', 'hex');
            crypted += cipher.final('hex');
            return { success: true, result: crypted };
        } catch (ex) {
            return { success: false, info: 'Bad input' };
        }
    }

    decrypt(password: string): { success: boolean; result?: string; info?: string } {
        try {
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
            let dec = decipher.update(password, 'hex', 'utf8');
            dec += decipher.final('utf8');
            return { success: true, result: dec };
        } catch (ex) {
            return { success: false, info: 'Bad input' };
        }
    }



}