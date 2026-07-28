import { Injectable } from "@nestjs/common";

import { env } from "./common/env/env";

@Injectable()
export class AppService {
    getHello() {
        return {
            doc:
                env.NODE_ENV === "production"
                    ? "https://order-flow-ek0j.onrender.com/api/docs"
                    : `http://localhost:${env.PORT}/api/docs`,
        };
    }
}
