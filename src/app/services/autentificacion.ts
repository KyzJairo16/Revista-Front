import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AutentificacionService {
  private http = inject(HttpClient);

  private URL_API = 'http://localhost:8080/api/auth';

  public arrancarEnRegistro: boolean = false;

  login(credenciales: any): Observable<any> {
    return this.http.post<any>(`${this.URL_API}/login`, credenciales).pipe(
      tap(respuesta => {
        if (respuesta && respuesta.token) {
          localStorage.setItem('token_revista', respuesta.token);


          let rolBackend = respuesta.rol ? respuesta.rol.toUpperCase().trim() : 'USUARIO';

          if (rolBackend.startsWith('ROLE_')) {
            rolBackend = rolBackend.replace('ROLE_', '');
          }

          if (rolBackend === 'ADMINISTRADOR') {
            rolBackend = 'ADMINISTRATIVO';
          }

          localStorage.setItem('rol_revista', rolBackend);
          localStorage.setItem('nombre_usuario', credenciales.username);
        }
      })
    );
  }

  registrar(datosRegistro: any): Observable<any> {
    return this.http.post(`${this.URL_API}/register`, datosRegistro, { responseType: 'text' });
  }

  getRol(): string {
    const token = localStorage.getItem('token_revista');
    let rolDetectado = '';

    if (token) {
      try {
        const tokenDecodificado: any = jwtDecode(token);
        rolDetectado = tokenDecodificado.role || tokenDecodificado.roles || tokenDecodificado.authorities || '';
      } catch (error) {
        console.warn('No se pudo decodificar el JWT, usando respaldo de localStorage.');
      }
    }

    if (!rolDetectado) {
      rolDetectado = localStorage.getItem('rol_revista') || 'USUARIO';
    }

    if (rolDetectado.startsWith('ROLE_')) {
      rolDetectado = rolDetectado.replace('ROLE_', '');
    }

    rolDetectado = rolDetectado.toUpperCase().trim();

    if (rolDetectado === 'ADMINISTRADOR') {
      rolDetectado = 'ADMINISTRATIVO';
    }

    return rolDetectado;
  }

  getHeaders() {
    const token = localStorage.getItem('token_revista');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }


  getUsuario(): string {
    return localStorage.getItem('nombre_usuario') || '';
  }

  estaAutenticado(): boolean {
    return localStorage.getItem('token_revista') !== null;
  }
  logout(): void {
    localStorage.removeItem('token_revista');
    localStorage.removeItem('rol_revista');
    localStorage.removeItem('nombre_usuario');
  }
}
