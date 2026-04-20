"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authStore = exports.InMemoryAuthStore = void 0;
class InMemoryAuthStore {
    usersByEmail = new Map();
    sequence = 1;
    findByEmail(email) {
        return this.usersByEmail.get(email.toLowerCase());
    }
    create(input) {
        const user = {
            ...input,
            id: String(this.sequence++),
            email: input.email.toLowerCase(),
        };
        this.usersByEmail.set(user.email, user);
        return user;
    }
}
exports.InMemoryAuthStore = InMemoryAuthStore;
exports.authStore = new InMemoryAuthStore();
