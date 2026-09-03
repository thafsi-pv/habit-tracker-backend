"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    process.on('unhandledRejection', (err) => {
        console.error('Unhandled Rejection:', err);
    });
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
    });
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, '');
    const appUrl = normalizeOrigin(process.env.APP_URL ?? 'http://localhost:5173');
    const additionalOrigins = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map(normalizeOrigin)
        .filter(Boolean);
    const allowedOrigins = [appUrl, ...additionalOrigins];
    app.enableCors({
        origin: (origin) => {
            if (!origin)
                return true;
            return allowedOrigins.includes(normalizeOrigin(origin));
        },
        credentials: true,
    });
    app.use((0, cookie_parser_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    let port = Number(process.env.PORT) || 3000;
    if (process.env.RENDER) {
        if (!process.env.PORT || port === 3000) {
            port = 10000;
        }
    }
    await app.listen(port, '0.0.0.0');
    console.log(`API listening on ${port} (RENDER=${process.env.RENDER ?? 'false'})`);
    console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
}
bootstrap();
//# sourceMappingURL=main.js.map