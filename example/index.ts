import { Elysia } from 'elysia'
import { cookie } from '../src'

const app = new Elysia()
    .use(
        cookie({
            secret: 'Fischl von Luftschloss Narfidort'
        })
    )
    .get(
        '/json',
        ({ setCookie, unsignCookie, cookie: { council: councilSigned } }) => {
            const council = unsignCookie(councilSigned)

            if (!council.valid)
                throw new Error('Fail to decode cookie: council')

            setCookie(
                'council',
                JSON.stringify([
                    {
                        name: 'Rin',
                        affilation: 'Adminstration'
                    }
                ]),
                {
                    signed: true
                }
            )

            return JSON.parse(council.value)
        }
    )
    .get('/', ({ cookie, setCookie }) => {
        console.log(cookie)

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
    .get('/multi', ({ cookie, setCookie }) => {
        setCookie('a', 'b')
        setCookie('c', 'd')

        return cookie
    })
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
