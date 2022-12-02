import KingWorld from 'kingworld'

import { cookie } from '../src/index'

const app = new KingWorld()
    .use(
        cookie({
            secret: 'abc'
        })
    )
    .get('/', ({ cookie, setCookie }) => {
        setCookie(
            'counter',
            cookie.counter ? `${+cookie.counter + 1}`.toString() : `1`
        )

        return cookie.counter
    })
    .get('/cookie', ({ cookie }) => (cookie.biscuit = 'tea'))
    .get('/sign/:name', ({ params: { name }, cookie, setCookie }) => {
        setCookie('name', name, {
            signed: true
        })

        return name
    })
    .get('/sign-out', ({ cookie, removeCookie }) => {
        removeCookie('name')

        return 'signed out'
    })
    .get(
        '/auth',
        ({ unsignCookie, cookie: { name }, set }) => {
            const { valid, value } = unsignCookie(name)

            if (!valid) {
                set.status = 401
                return 'Unauthorized'
            }

            return value
        },
        {
            beforeHandle({ cookie, set }) {
                if (!cookie.name) {
                    set.status = 401
                    return 'Unauthorized'
                }
            }
        }
    )
    .listen(8080)
