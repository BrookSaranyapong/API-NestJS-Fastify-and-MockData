<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Endpoint
| Endpoint          | Method | Roles allowed   |
| ----------------- | ------ | --------------- |
| `/auth/register`  | POST   | public          |
| `/auth/login`     | POST   | public          |
| `/auth/refresh`   | POST   | public          |
| `/auth/me`        | GET    | `user`, `admin` |
| `/auth/logout`    | POST   | `user`, `admin` |
| `/products`       | GET    | `user`, `admin` |
| `/products/:id`   | GET    | `user`, `admin` |
| `/products`       | POST   | `admin`         |
| `/products/:id`   | PATCH  | `admin`         |
| `/products/:id`   | DELETE | `admin`         |
| `/products/seed`  | POST   | `admin`         |
| `/products/reset` | POST   | `admin`         |

## Authentication Flow
POST /auth/register
Body { "email": "user@example.com", "name": "User", "password": "secret123" }
Response { "id": 1, "email": "user@example.com", "name": "User", "roles": ["user"] }

POST /auth/login
Body { "email": "user@example.com", "password": "secret123" }
Response
{
  "user": { "id": 1, "email": "user@example.com", "name": "User", "roles": ["user"] },
  "accessToken": "<JWT_ACCESS>",
  "refreshToken": "<JWT_REFRESH>"
}

GET /auth/me
Headers: Authorization: Bearer <JWT_ACCESS>
Response { "id": 1, "email": "user@example.com", "name": "User", "roles": ["user"] }

Refresh Token
POST /auth/refresh
Body { "refreshToken": "<JWT_REFRESH>" }
Response
{
  "user": { "id": 1, "email": "user@example.com", "name": "User", "roles": ["user"] },
  "accessToken": "<NEW_JWT_ACCESS>",
  "refreshToken": "<NEW_JWT_REFRESH>"
}

ระบบใช้ rotation: refresh ตัวเก่าถูกยกเลิกทันที และออกคู่ใหม่

Logout
POST /auth/logout
Headers: Authorization: Bearer <JWT_ACCESS>
Body ตัวเลือก

ล็อกเอาต์เฉพาะ refresh token นั้นๆ:
{ "refreshToken": "<JWT_REFRESH>" }

ล็อกเอาต์ทุกอุปกรณ์ของผู้ใช้:
{ "all": true }

Response
{ "ok": true }

หมายเหตุสำคัญ: ระบบนี้ รีโวคเฉพาะ refresh token (ผ่าน jti)
Access token ที่ออกไปแล้วจะยังใช้ได้จนหมดอายุ (เช่น 15 นาที) ตามพฤติกรรมปกติของ JWT

## Products API

ทุก endpoint ต้องแนบ Authorization: Bearer <JWT_ACCESS>
สิทธิ์ :
user: อ่านได้ (GET)
admin: CRUD + seed/reset

List Products (user/admin)
GET /products
Query

page: หมายเลขหน้า (เริ่ม 1)
limit: จำนวนต่อหน้า (เริ่ม 10)
q: ค้นหาชื่อสินค้า (optional)

Response
{
  "meta": { "page": 1, "limit": 10, "total": 42 },
  "items": [
    { "id": 1, "name": "Keyboard", "price": 1290, "stock": 10, "createdAt": "...", "updatedAt": "..." }
  ]
}

Get Product (user/admin)
GET /products/:id
Response { "id": 1, "name": "Keyboard", "price": 1290, "stock": 10, "createdAt": "...", "updatedAt": "..." }


Create Product (admin)
POST /products
Body { "name": "Keyboard", "price": 1290, "stock": 10 }
Response { "id": 7, "name": "Keyboard", "price": 1290, "stock": 10, "createdAt": "...", "updatedAt": "..." }


Update Product (admin)
PATCH /products/:id
Body { "name": "Keyboard Pro", "price": 1490, "stock": 8 }
Response { "id": 7, "name": "Keyboard Pro", "price": 1490, "stock": 8, "createdAt": "...", "updatedAt": "..." }
 
 
Delete Product (admin)
DELETE /products/:id
Response { "ok": true }

Seed Products (admin)
POST /products/seed?count=20
Response { "ok": true, "inserted": 20 }

Reset Products (admin)
POST /products/reset
Response { "ok": true }

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
"# API-NestJS-and-MockData" 
