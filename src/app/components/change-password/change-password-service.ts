import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {LoginService} from '../../services/login-service';
import {Observable} from 'rxjs';


export interface TokenValidationResponse{
    valid: boolean;
    message: string;

}

@Injectable({
  providedIn: 'root',
})
export class ChangePasswordService {
    private http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}/`;
    private readonly loginService = inject(LoginService);

    private authHeaders(): HttpHeaders {
        const token = this.loginService.token?.() ?? '';
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    public validateToken(uuid_token: string): Observable<TokenValidationResponse>{
        return this.http.get<TokenValidationResponse>(`${this.apiUrl}reset-token/${uuid_token}`);
    }
    public changePassword(uuid_token: string, password: string): Observable<any>{
        const payload = {
            new_password: password
        }
        return this.http.patch<any>(`${this.apiUrl}/users/${uuid_token}/cpwd`, payload);
    }

}
