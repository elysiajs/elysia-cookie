import type { Handler } from 'kingworld'

import type KingWorld from 'kingworld'
import Cookie, { serialize, parse, type CookieSerializeOptions } from 'cookie'
import { sign } from 'cookie-signature'

export interface SetCookieOptions extends CookieSerializeOptions {
    // Should cookie be signed or not
    signed?: boolean
}

export interface CookieOptions extends SetCookieOptions {
    /**
     * Secret key for signing cookie
     *
     * If array is passed, will use Key Rotation.
     *
     * Key rotation is when an encryption key is retired
     * and replaced by generating a new cryptographic key.
     */
    secret?: string | string[]
}

export interface CookieRequest {
    cookie: Record<string, string>
    setCookie: (name: string, value: string, options?: SetCookieOptions) => void
    removeCookie: (name: string) => void
    unsignCookie: (value: string) =>
        | {
              valid: true
              value: string
          }
        | {
              valid: false
              value: undefined
          }
}

// ? Bun doesn't support `crypto.timingSafeEqual` yet, using string equality instead
// Temporary fix until native support
const unsign = (input: string, secret: string | null) => {
    if (secret === null) throw new TypeError('Secret key must be provided')
    if (!input) return false

    const value = input.slice(0, input.lastIndexOf('.'))

    return input === sign(value, secret) ? value : false
}

export const cookie =
    ({ signed, secret: secretKey, ...defaultOptions }: CookieOptions = {}) =>
    (app: KingWorld) => {
        const secret = !secretKey
            ? undefined
            : typeof secretKey === 'string'
            ? secretKey
            : secretKey[0]

        const isStringKey = typeof secret === 'string'

        return app.inject((context) => {
            let _cookie: Record<string, string>

            const getCookie = () => {
                if (_cookie) return _cookie

                try {
                    const headerCookie = context.request.headers.get('cookie')

                    _cookie = headerCookie ? parse(headerCookie) : {}
                } catch (error) {
                    _cookie = {}
                }

                return _cookie
            }

            return {
                get cookie() {
                    return getCookie()
                },
                set cookie(newCookie: Record<string, string>) {
                    _cookie = newCookie
                },
                setCookie(name, value, { signed = false, ...options } = {}) {
                    if (signed) {
                        if (!secret)
                            throw new Error(
                                'No secret is provided to cookie plugin'
                            )

                        value = sign(value, secret)
                    }

                    context.set.headers['Set-Cookie'] = serialize(name, value, {
                        path: '/',
                        ...defaultOptions,
                        ...options
                    })

                    if (!_cookie) getCookie()
                    _cookie[name] = value
                },
                removeCookie(name: string) {
                    if (!getCookie()[name]) return

                    context.set.headers['Set-Cookie'] = serialize(name, '', {
                        expires: new Date('Thu, Jan 01 1970 00:00:00 UTC')
                    })

                    delete _cookie[name]
                },
                unsignCookie(value: string) {
                    if (!secret)
                        throw new Error(
                            'No secret is provided to cookie plugin'
                        )

                    let unsigned: false | string = isStringKey
                        ? unsign(value, secret)
                        : false

                    if (isStringKey === false) {
                        for (let i = 0; i < secret.length; i++) {
                            const temp = unsign(value, secret[i])

                            if (temp) {
                                unsigned = temp
                                break
                            }
                        }
                    }

                    return {
                        valid: unsigned !== false,
                        value: unsigned || undefined
                    }
                }
            } as CookieRequest
        })
    }

export default cookie
