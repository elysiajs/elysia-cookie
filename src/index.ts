import { Elysia, Handler } from 'elysia'

import { serialize, parse, type CookieSerializeOptions } from 'cookie'
import { sign, unsign } from 'cookie-signature'

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
}

export const cookie = (options: CookieOptions = {}) => {
    const { signed, secret: secretKey, ...defaultOptions } = options

    const secret = !secretKey
        ? undefined
        : typeof secretKey === 'string'
        ? secretKey
        : secretKey[0]

    const isStringKey = typeof secret === 'string'

    return new Elysia({
        name: '@elysiajs/cookie',
        seed: options
    })
        .decorate('unsignCookie', ((value: string) => {
            if (!secret)
                throw new Error('No secret is provided to cookie plugin')

            let unsigned: false | string = isStringKey
                ? unsign(value, secret)
                : false

            if (isStringKey === false)
                for (let i = 0; i < secret.length; i++) {
                    const temp = unsign(value, secret[i])

                    if (temp) {
                        unsigned = temp
                        break
                    }
                }

            return {
                valid: unsigned !== false,
                value: unsigned || undefined
            }
        }) as (value: string) =>
            | {
                  valid: true
                  value: string
              }
            | {
                  valid: false
                  value: undefined
              })
        .derive((context) => {
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
                setCookie(name, value, { signed = false, ...options } = {}) {
                    if (signed) {
                        if (!secret)
                            throw new Error(
                                'No secret is provided to cookie plugin'
                            )

                        value = sign(value, secret)
                    }

                    if (!Array.isArray(context.set.headers['Set-Cookie']))
                        // @ts-ignore
                        context.set.headers['Set-Cookie'] = []

                    // @ts-ignore
                    context.set.headers['Set-Cookie'].push(
                        serialize(name, value, {
                            path: '/',
                            ...defaultOptions,
                            ...options
                        })
                    )

                    if (!_cookie) getCookie()
                    _cookie[name] = value
                },
                removeCookie(name: string) {
                    if (!getCookie()[name]) return

                    context.set.headers['Set-Cookie'] = serialize(name, '', {
                        expires: new Date('Thu, Jan 01 1970 00:00:00 UTC')
                    })

                    delete _cookie[name]
                }
            } as CookieRequest
        })
}

export default cookie
