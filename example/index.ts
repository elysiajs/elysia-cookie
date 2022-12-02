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
    .get('/sign-out', ({ cookie, removeCookie }) => {
        removeCookie('name')

        return 'signed out'
    })
    .get('/cookie', ({ cookie }) => (cookie.biscuit = 'tea'))

    .get('/sign/:name', ({ params: { name }, cookie, setCookie }) => {
        setCookie('name', name, {
            signed: true
        })

        return name
    })
    .get('/auth', ({ unsignCookie, cookie: { name }, set }) => {
        const { valid, value } = unsignCookie(name)

        if (!valid) {
            set.status = 401
            return 'Unauthorized'
        }

        return value
    })
    .listen(8080)
