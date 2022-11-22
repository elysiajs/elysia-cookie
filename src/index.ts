import type { Handler } from 'kingworld'

import type KingWorld from 'kingworld'
import Cookie, { serialize, parse, type CookieSerializeOptions } from 'cookie'

export interface CookieRequest {
    cookie: Record<string, string>
    setCookie: (
        name: string,
        value: string,
        options?: CookieSerializeOptions
    ) => void
    removeCookie: (name: string) => void
}

export const cookie = () => (app: KingWorld) =>
    app.onTransform((ctx) => {
        let _cookie: Record<string, string>

        const getCookie = () => {
            if (_cookie) return _cookie

            try {
                const headerCookie = ctx.request.headers.get('cookie')

                _cookie = headerCookie ? parse(headerCookie) : {}
            } catch (error) {
                _cookie = {}
            }

            return _cookie
        }

        Object.assign(ctx, {
            get cookie() {
                return getCookie()
            },
            set cookie(newCookie: Record<string, string>) {
                _cookie = newCookie
            },
            setCookie(name, value, options) {
                ctx.set.headers['Set-Cookie'] = serialize(name, value, {
                    path: '/',
                    ...options
                })

                if (!_cookie) getCookie()
                _cookie[name] = value
            },
            removeCookie(name: string) {
                if (!getCookie()[name]) return

                ctx.set.headers['Set-Cookie'] = serialize(name, '', {
                    expires: new Date('Thu, Jan 01 1970 00:00:00 UTC')
                })

                delete _cookie[name]
            }
        } as CookieRequest)
    }) as unknown as KingWorld<{
        store: {}
        request: CookieRequest
        schema: {}
    }>

export default cookie
