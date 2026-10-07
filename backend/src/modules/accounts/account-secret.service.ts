import { Inject, Injectable } from '@nestjs/common'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import type { AppConfig } from '../../config/app.config'
import { APP_CONFIG } from '../../config/config.tokens'
import { operation, serviceFailure, success, type ServiceResult } from '../../common/errors/result'

@Injectable()
export class AccountSecretService {
  /** Receive the configuration containing the dedicated account encryption key. */
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  /**
   * Validate the configured 64-character hexadecimal key and decode it into a 32-byte
   * encryption key.
   */
  private key(): ServiceResult<Buffer> {
    const value = this.config.accountEncryptionKey

    if (!value || !/^[0-9a-f]{64}$/i.test(value)) {
      return serviceFailure(
        'CONFIGURATION_ERROR',
        'ACCOUNT_ENCRYPTION_KEY must contain 64 hexadecimal characters',
        500,
      )
    }

    return success(Buffer.from(value, 'hex'))
  }

  /**
   * Encrypt a secret with AES-256-GCM, a fresh nonce, and the account ID as
   * authenticated data in a versioned envelope.
   */
  encrypt(accountId: string, secret: string): Promise<ServiceResult<string>> {
    return operation(() => {
      const key = this.key()

      if (key.code !== 0) {
        return key
      }

      const iv = randomBytes(12)
      const cipher = createCipheriv('aes-256-gcm', key.data, iv)
      cipher.setAAD(Buffer.from(accountId))
      const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])

      return success(
        [
          'v1',
          iv.toString('base64url'),
          cipher.getAuthTag().toString('base64url'),
          ciphertext.toString('base64url'),
        ].join('.'),
      )
    })
  }

  /**
   * Validate and decrypt a versioned AES-256-GCM envelope, rejecting tampering or a
   * mismatched account ID.
   */
  decrypt(accountId: string, encrypted: string): Promise<ServiceResult<string>> {
    return operation(() => {
      const key = this.key()

      if (key.code !== 0) {
        return key
      }

      const [version, iv, tag, ciphertext, extra] = encrypted.split('.')

      if (version !== 'v1' || !iv || !tag || !ciphertext || extra !== undefined) {
        return serviceFailure('INTERNAL_ERROR', 'Invalid encrypted secret key', 500)
      }

      const decipher = createDecipheriv('aes-256-gcm', key.data, Buffer.from(iv, 'base64url'))
      decipher.setAAD(Buffer.from(accountId))
      decipher.setAuthTag(Buffer.from(tag, 'base64url'))

      return success(
        Buffer.concat([
          decipher.update(Buffer.from(ciphertext, 'base64url')),
          decipher.final(),
        ]).toString('utf8'),
      )
    })
  }
}
