import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from '@shared/security/IPasswordHasher';

/**
 * Cost 12 per tech-stack.md. Behind IPasswordHasher so argon2id remains a
 * swap of one binding rather than a change across the application layer.
 */
export const BCRYPT_COST = 12;

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, BCRYPT_COST);
  }

  verify(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}
