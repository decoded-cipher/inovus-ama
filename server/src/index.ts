
import { Hono } from 'hono'

import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { timeout } from 'hono/timeout'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { trimTrailingSlash } from 'hono/trailing-slash'

import apiRouter from './routes';

const app = new Hono()



// Middleware setup
app.use('*', logger())
app.use('*', requestId());
// app.use(timeout(10000));
app.use(secureHeaders());
app.use(trimTrailingSlash());

app.use(cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  maxAge: 3600,
  credentials: true,
  exposeHeaders: ['Content-Length', 'X-Request-ID']
}));



app.get('/', (c) => c.json({
  status: 'OK',
  message: 'API is working properly',
}, 200));


app.route('/api/v1', apiRouter);


app.use(async (c) => c.json({
  status: 'Not Found',
  message: 'API endpoint not found',
}, 404));



export default app