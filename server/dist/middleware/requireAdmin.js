"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
function requireAdmin(req, res, next) {
    if (req.session?.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
}
//# sourceMappingURL=requireAdmin.js.map