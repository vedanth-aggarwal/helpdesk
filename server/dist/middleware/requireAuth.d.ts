import type { NextFunction, Request, Response } from "express";
import { auth } from "../auth";
declare global {
    namespace Express {
        interface Request {
            session?: Awaited<ReturnType<typeof auth.api.getSession>>;
        }
    }
}
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=requireAuth.d.ts.map