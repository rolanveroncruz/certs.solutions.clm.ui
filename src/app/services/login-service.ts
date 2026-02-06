import {isPlatformBrowser} from '@angular/common';
import {computed, Inject, Injectable, PLATFORM_ID, signal} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {catchError, Observable, tap, throwError} from 'rxjs';


type PersistedAuth = {
    token: string;
    currentUser: LoggedInUser;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginUser {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    client_id: number;
}

export interface LoginClient {
    id: number;
    name: string;
}

export interface LoginResponse {
    token: string;
    token_type: string;
    expires_in: number;
    user: LoginUser;
    client: LoginClient;
}

export interface LoggedInUser {
    user_id: number;
    name: string;
    email: string;
    client_id: number;
    client_name: string;
}

const AUTH_KEY = 'clm_login_v1';

@Injectable({
    providedIn: 'root',
})
export class LoginService {
    private readonly isBrowser: boolean;
    private apiUrl = environment.apiBaseUrl;

    // ---- state (signals) -------
    readonly currentUser = signal<LoggedInUser>({
        user_id: 0,
        name: "",
        email: "",
        client_id: 0,
        client_name: "",
    });
    readonly token = signal<string | null>(null);


    // ---- derived state -------
    readonly isLoggedIn = computed(() => !!this.token());

    constructor(@Inject(PLATFORM_ID) platformId: object, private httpClient: HttpClient) {
        this.isBrowser = isPlatformBrowser(platformId);

        if (this.isBrowser) {
            this.restoreFromStorage();
        }

    }

    login(email: string, password: string): Observable<LoginResponse> {
        this.clearSessionState();

        const body: LoginRequest = {email, password};
        console.log("In Service, Login Request. Attempting login");
        return this.httpClient.post<LoginResponse>(`${this.apiUrl}/auth/login`, body).pipe(
            tap(response => {
                let isValid = this.isValid(response);
                if (isValid) {
                    /* Successful Login()
                     */
                    const user: LoggedInUser = {
                        user_id: response.user.id,
                        name: response.user.first_name + ' ' + response.user.last_name,
                        email: response.user.email,
                        client_id: response.client.id,
                        client_name: response.client.name
                    }
                    this.loginSuccess(response.token, user);

                } else {
                    this.clearSessionState();
                    console.log("In Service, Login Failed (invalid response)");
                }
            })
            , catchError(err => {
                this.clearSessionState();
                return throwError(() => err);
            })
        )
    }

    loginSuccess(token: string, user: LoggedInUser) {
        this.currentUser.set(user);
        this.token.set(token);
        this.persistToStorage();
    }

    // Check if the response is valid. If so, write it to the local storage.
    isValid(x: any): boolean {
        const x_check = x && typeof x === 'object';
        const valid_token = typeof x.access_token === 'string' && x.access_token.length > 0
            && looksLikeJwt(x.access_token);
        const valid_token_type =  x.token_type && typeof x.token_type==="string" && x.token_type === 'Bearer';
        const valid_expires_in = x.expires_in && typeof x.expires_in === 'number' && x.expires_in > 0;
        const valid_user = typeof x.user.id === 'number' && x.user.id > 0 &&
            x.user.first_name.trim().length > 0 &&
            typeof x.user.email === 'string' && x.user.email.trim().length > 0 && x.user.email.includes('@');
        const valid_client = typeof x.client.id === 'number' && x.client.id > 0 &&
            typeof x.client.name === 'string' && x.client.name.trim().length > 0;
        return x_check && valid_token_type && valid_expires_in && valid_user && valid_client;
    }

    logout() {
        this.clearSessionState();
    }

    // ---------- persistence helpers ----------------------
    private clearStorage() {
        if (!this.isBrowser) return;
        localStorage.removeItem(AUTH_KEY);
    }

    private persistToStorage() {
        if (!this.isBrowser) return;

        const token = this.token();
        if (!token) return;

        const payLoad: PersistedAuth = {
            token,
            currentUser: this.currentUser()
        };

        localStorage.setItem(AUTH_KEY, JSON.stringify(payLoad));
    }

    private restoreFromStorage() {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as Partial<PersistedAuth>;
            if (typeof parsed.token === 'string' && parsed.token.length > 0) {
                this.token.set(parsed.token);
            } else {
                this.token.set(null);
            }
            if (parsed.currentUser && typeof parsed.currentUser === 'object') {
                this.currentUser.set(parsed.currentUser);
            } else {
                this.currentUser.set({email: "", name: "", client_id: 0, client_name: "", user_id: 0});
            }
        } catch {
            localStorage.removeItem(AUTH_KEY);
        }
    }

    // CHANGE: central helper to wipe session (memory + storage)
    private clearSessionState() {
        this.currentUser.set({email: "", name: "", client_id:0, client_name: "", user_id: 0});
        this.token.set(null);
        this.clearStorage();
    }
}

function looksLikeJwt(token: unknown): boolean {
    if (typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(p => p.length > 0);
}

function isRecordOfStrings(x: unknown): boolean {
    if (!x || typeof x !== 'object' || Array.isArray(x)) return false;
    return Object.values(x as Record<string, unknown>).every(v => typeof v === 'string');

}
