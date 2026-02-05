import {isPlatformBrowser} from '@angular/common';
import {computed, Inject, Injectable, PLATFORM_ID, signal} from '@angular/core';
import { environment } from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {catchError, Observable, tap, throwError} from 'rxjs';


type PersistedAuth = {
  token: string;
  currentUser: LoggedInUser;
}
export interface LoginRequest{
  email: string;
  password: string;
}

export interface LoginResponse{
  user_id: number;
  name: string;
  email: string;
  role_id: number;
  role_name: string;
  token: string;
}
export interface LoggedInUser{
  user_id: number;
  name: string;
  email: string;
  role_name: string;
}
const AUTH_KEY = 'dnc_login_v1';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private readonly isBrowser:boolean;
  private apiUrl = environment.apiUrl;

  // ---- state (signals) -------
  readonly currentUser = signal<LoggedInUser>({
    email: "",
    name: "",
    role_name: "",
    user_id: 0
  });
  readonly token =signal<string | null>(null);


  // ---- derived state -------
  readonly isLoggedIn = computed( ()=> !!this.token());

  constructor(@Inject(PLATFORM_ID)platformId: object, private httpClient: HttpClient ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser){
      this.restoreFromStorage();
    }

  }

  login(email:string, password:string):Observable<LoginResponse>{
    this.clearSessionState();

    const body: LoginRequest = {email, password};
    return this.httpClient.post<LoginResponse>(`${this.apiUrl}/login`, body).pipe(
      tap( response=> {
        let isValid = this.isValid(response);
        if (isValid){
          /* Successful Login()
           */
          const user:LoggedInUser = {
            user_id: response.user_id,
            name: response.name,
            email: response.email,
            role_name: response.role_name,
          }
          this.loginSuccess(response.token, user);

        }else{
          this.clearSessionState();
          console.log("In Service, Login Failed (invalid response)");
        }
      })
      ,catchError( err=> {
        this.clearSessionState();
        return throwError(()=>err);
      })
    )
  }

  loginSuccess(token: string, user:LoggedInUser){
    this.currentUser.set(user);
    this.token.set(token);
    this.persistToStorage();
  }

  // Check if the response is valid. If so, write it to the local storage.
  isValid(x: any):boolean {
    return (
      x &&
      typeof x === 'object' &&
      typeof x.user_id === 'number' &&
      x.user_id > 0 &&
      typeof x.role_id ===  'number' &&
      x.role_id > 0 &&
      typeof x.name === 'string' &&
      x.name.trim().length > 0 &&
      typeof x.email === 'string' &&
      x.email.includes('@') &&
      typeof x.role_name === 'string' &&
      x.role_name.trim().length > 0 &&
      looksLikeJwt(x.token) &&
      isRecordOfStrings(x.menu_activation_map)
    );
  }

  logout(){
    this.clearSessionState();
  }
  // ---------- persistence helpers ----------------------
  private clearStorage(){
    if (!this.isBrowser) return;
    localStorage.removeItem(AUTH_KEY);
  }

  private persistToStorage(){
    if (!this.isBrowser) return;

    const token = this.token();
    if (!token) return;

    const payLoad:PersistedAuth = {
      token,
      currentUser: this.currentUser()
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(payLoad));
  }

  private restoreFromStorage(){
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return;
    try{
      const parsed = JSON.parse(raw) as Partial<PersistedAuth>;
      if (typeof parsed.token === 'string' && parsed.token.length > 0){
        this.token.set(parsed.token);
      } else{
        this.token.set(null);
      }
      if (parsed.currentUser && typeof parsed.currentUser === 'object'){
        this.currentUser.set(parsed.currentUser);
      }else{
        this.currentUser.set({email: "", name: "", role_name: "", user_id: 0});
      }
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
  }
  // CHANGE: central helper to wipe session (memory + storage)
  private clearSessionState() {
    this.currentUser.set({ email: "", name: "", role_name: "", user_id: 0 });
    this.token.set(null);
    this.clearStorage();
  }
}

function looksLikeJwt(token: unknown): boolean{
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(p=>p.length > 0);
}
function isRecordOfStrings(x:unknown): boolean{
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false;
  return Object.values( x as Record<string, unknown>).every(v=>typeof v === 'string');

}
