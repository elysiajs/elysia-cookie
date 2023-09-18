import { Elysia } from 'elysia'
import { cookie } from '../src'

import { describe, expect, it } from 'bun:test'

const req = (path: string) => new Request(`http://localhost:8080${path}`)

describe('Cookie', () => {
    it('should set cookie', async () => {
        const app = new Elysia()
            .use(cookie())
            .get('/', ({ cookie: { user }, setCookie }) => {
                setCookie('user', 'saltyaom')

                return user
            })

        const res = await app.handle(req('/'))
        expect(res.headers.get('set-cookie')).toBe('user=saltyaom; Path=/')
    })

    it('should remove cookie', async () => {
        const app = new Elysia().use(cookie()).get('/', ({ removeCookie }) => {
            removeCookie('user')

            return 'unset'
        })

        const res = await app.handle(
            new Request('http://localhost/', {
                headers: {
                    cookie: 'user=saltyaom'
                }
            })
        )
        expect(res.headers.get('set-cookie')).toBe(
            'user=; path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
        )
    })

    it('skip cookie removal if cookie is absent', async () => {
        const app = new Elysia().use(cookie()).get('/', ({ removeCookie }) => {
            removeCookie('user')

            return 'unset'
        })

        const res = await app.handle(req('/'))
        expect(res.headers.get('set-cookie')).toBe(null)
    })

    it('sign cookie', async () => {
        const app = new Elysia()
            .use(
                cookie({
                    secret: 'Takodachi'
                })
            )
            .get('/', ({ setCookie }) => {
                setCookie('name', 'saltyaom', {
                    signed: true
                })

                return 'unset'
            })

        const res = await app.handle(req('/'))
        expect(res.headers.get('set-cookie')?.includes('.')).toBe(true)
    })

    it('unsign cookie', async () => {
        const app = new Elysia()
            .use(
                cookie({
                    secret: 'Takodachi'
                })
            )
            .get('/', ({ setCookie }) => {
                setCookie('name', 'saltyaom', {
                    signed: true
                })

                return 'unset'
            })
            .get('/unsign', ({ cookie, unsignCookie }) => {
                const { valid, value } = unsignCookie(cookie.name)

                return value
            })

        const authen = await app.handle(req('/'))
        const res = await app
            .handle(
                new Request('http://localhost:8080/unsign', {
                    headers: {
                        cookie: authen.headers.get('set-cookie') ?? ''
                    }
                })
            )
            .then((r) => r.text())

        expect(res).toBe('saltyaom')
    })

    it('should set multiple', async () => {
        const app = new Elysia()
            .use(cookie())
            .get('/', ({ cookie: { user }, setCookie }) => {
                setCookie('a', 'b')
                setCookie('c', 'd')

                return user
            })

        const res = await app.handle(req('/'))
        expect(res.headers.getAll('Set-Cookie')).toEqual(['a=b; Path=/', 'c=d; Path=/'])
    })
})
