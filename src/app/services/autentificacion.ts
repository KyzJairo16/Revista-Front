import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AutentificacionService {
  private http = inject(HttpClient);

  // Endpoint de autenticación sincronizado con tu AuthController de Spring Boot
  private URL_API = 'http://localhost:8080/api/auth';

  public arrancarEnRegistro: boolean = false;

  /**
   * Envía las credenciales reales a Spring Boot.
   * Guarda el token, el rol unificado y el nombre de usuario ingresado.
   */
  login(credenciales: any): Observable<any> {
    return this.http.post<any>(`${this.URL_API}/login`, credenciales).pipe(
      tap(respuesta => {
        if (respuesta && respuesta.token) {
          localStorage.setItem('token_revista', respuesta.token);

          // Guardamos el rol limpio del backend directamente pasándolo a mayúsculas
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

  /**
   * Envía una solicitud de registro al endpoint de tu AuthController
   */
  registrar(datosRegistro: any): Observable<any> {
    return this.http.post(`${this.URL_API}/register`, datosRegistro, { responseType: 'text' });
  }

  /**
   * Extrae y decodifica el Rol guardado dentro del Token JWT o del localStorage,
   * garantizando consistencia limpia de texto.
   */
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

  /**
   * Retorna las cabeceras HTTP necesarias para las peticiones protegidas de Spring Boot
   */
  getHeaders() {
    const token = localStorage.getItem('token_revista');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Obtiene el nombre real guardado dinámicamente en el login
   */
  getUsuario(): string {
    return localStorage.getItem('nombre_usuario') || '';
  }

  estaAutenticado(): boolean {
    return localStorage.getItem('token_revista') !== null;
  }

  /**
   * Destrucción absoluta de credenciales y datos de sesión locales
   */
  logout(): void {
    localStorage.removeItem('token_revista');
    localStorage.removeItem('rol_revista');
    localStorage.removeItem('nombre_usuario');
  }
}
