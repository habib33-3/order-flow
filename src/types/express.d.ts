/* eslint-disable @typescript-eslint/consistent-type-definitions */
import "express";

import { JwtPayload } from "./types";

declare module "express" {
    export interface Request {
        user?: JwtPayload;
    }
}
