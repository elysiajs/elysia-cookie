import type { Plugin } from 'kingworld'

import Cookie, { serialize, parse, type CookieSerializeOptions } from 'cookie'

interface CookieRequest {
    cookie: Record<string, string>
    setCookie: (
        name: string,
        value: string,
        options?: CookieSerializeOptions
    ) => void
    removeCookie: (name: string) => void
}

const expires = new Date('Thu, Jan 01 1970 00:00:00 UTC')

const cookie: Plugin<
    undefined,
    {
        store: {}
        request: CookieRequest
    }
> = (app) => {
    return app.transform((ctx) => {
        let _cookie: Record<string, string>
        const getCookie = () => {
            if (_cookie) return _cookie

            try {
                const headerCookie = ctx.request.headers.get('cookie')
                if (headerCookie) {
                    _cookie = parse(headerCookie)
                } else _cookie = {}
            } catch (error) {
                _cookie = {}
            }

            return _cookie
        }

        const { responseHeaders } = ctx

        Object.assign(ctx, {
            get cookie() {
                return getCookie()
            },
            set cookie(newCookie: Record<string, string>) {
                _cookie = newCookie
            },
            setCookie(name, value, options) {
                responseHeaders.append(
                    'Set-Cookie',
                    serialize(name, value, options)
                )
                if (!_cookie) getCookie()
                _cookie[name] = value
            },
            removeCookie(name: string) {
                if (!getCookie()[name]) return

                responseHeaders.append(
                    'Set-Cookie',
                    serialize(name, '', {
                        expires
                    })
                )
                delete _cookie[name]
            }
        } as CookieRequest)
    })
}

export default cookie
