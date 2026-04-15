import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from 'environments/environment';
import { User, Role } from 'app/auth/models';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  //public
  public currentUser: Observable<User>;

  //private
  private currentUserSubject: BehaviorSubject<User>;

  /**
   *
   * @param {HttpClient} _http
   * @param {ToastrService} _toastrService
   */
  constructor(private _http: HttpClient, private _toastrService: ToastrService) {
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // getter: currentUserValue
  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  /**
   *  Confirms if user is admin
   */
  get isAdmin() {
    return this.currentUser && this.currentUserSubject.value.role === Role.Admin;
  }

  /**
   *  Confirms if user is client
   */
  get isClient() {
    return this.currentUser && this.currentUserSubject.value.role === Role.Client;
  }

  /**
   * User login
   *
   * @param email
   * @param password
   * @returns user
   */
  login(email: string, password: string) {
    return this._http
      .post<any>(`${environment.api}/users/authenticate`, { email, password })
      .pipe(
        map(user => {
          // login successful if there's a jwt token in the response
          if (user && user.token) {
            // store user details and jwt token in local storage to keep user logged in between page refreshes
            localStorage.setItem('currentUser', JSON.stringify(user));

            // Display welcome toast!
            setTimeout(() => {
              this._toastrService.success(
                'You have successfully logged in as an ' +
                  user.role +
                  ' user to Vuexy. Now you can start to explore. Enjoy! 🎉',
                '👋 Welcome, ' + user.firstName + '!',
                { toastClass: 'toast ngx-toastr', closeButton: true }
              );
            }, 2500);

            // notify
            this.currentUserSubject.next(user);
          }

          return user;
        })
      );
  }

  loginWithGoogle(credential: string) {
    return this._http
      .post<any>(`http://localhost:3000/api/auth/google`, { credential })
      .pipe(
        map(data => {
          console.log('Resposta Google login:', JSON.stringify(data));
          if (data && data.token) {
            const googleUser = data.user || {};
            const jwtPayload = this.decodeJwtPayload(credential) || {};
            const fullName = googleUser.name || jwtPayload.name || '';
            const user: User = {
              id: googleUser.id || 0,
              email: googleUser.email || jwtPayload.email || '',
              password: '',
              firstName: fullName.split(' ')[0] || googleUser.firstName || jwtPayload.given_name || '',
              lastName: fullName.split(' ').slice(1).join(' ') || googleUser.lastName || jwtPayload.family_name || '',
              avatar: googleUser.picture || googleUser.avatar || jwtPayload.picture || 'avatar-s-11.jpg',
              role: googleUser.role || Role.Client,
              token: data.token
            };
            localStorage.setItem('currentUser', JSON.stringify(user));

            setTimeout(() => {
              this._toastrService.success(
                'Login realizado com sucesso via Google!',
                'Bem-vindo, ' + user.firstName + '!',
                { toastClass: 'toast ngx-toastr', closeButton: true }
              );
            }, 2500);

            this.currentUserSubject.next(user);
          }
          return data;
        })
      );
  }

  private decodeJwtPayload(token: string): any {
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch (e) {
      console.warn('Não foi possível decodificar o JWT do Google', e);
      return null;
    }
  }

  /**
   * User logout
   *
   */
  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    // notify
    this.currentUserSubject.next(null);
  }
}
