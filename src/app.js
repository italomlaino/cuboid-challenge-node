import Koa from 'koa';
import koaBody from 'koa-body';

import * as middleware from './middleware';
import router from './router';

const app = new Koa();

app.use(middleware.logger);
app.use(middleware.errors);
app.use(middleware.parser);
app.use(koaBody());
app.use(middleware.serializer);
app.use(router.routes());
app.use(router.allowedMethods());

export default app;