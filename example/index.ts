import KingWorld from 'kingworld'

import cookie from '../src/index'

const app = new KingWorld()
    .use(cookie)
    .get('/', ({ cookie, setCookie }) => {
        setCookie(
            'counter',
            cookie.counter ? `${+cookie.counter + 1}`.toString() : `1`,
            {
                httpOnly: true
            }
        )

        setCookie(
            'counter2',
            cookie?.counter ? `${+cookie.counter + 1}`.toString() : `1`,
            {
                httpOnly: true
            }
        )

        return cookie.counter
    })
    .listen(8080)
