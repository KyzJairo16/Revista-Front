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
   * Guarda el token, el rol y capturamos el nombre de usuario ingresado.
   */
  login(credenciales: any): Observable<any> {
    return this.http.post<any>(`${this.URL_API}/login`, credenciales).pipe(
      tap(respuesta => {
        if (respuesta && respuesta.token) {
          localStorage.setItem('token_revista', respuesta.token);
          localStorage.setItem('rol_revista', respuesta.rol);

          // Guardamos el username que se usó para loguearse con éxito
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
   * limpiando cualquier prefijo de Spring Security para evitar fallos de enrutamiento.
   */
  getRol(): string {
    const token = localStorage.getItem('token_revista');
    let rolDetectado = '';

    if (token) {
      try {
        const tokenDecodificado: any = jwtDecode(token);
        // Mapea claims comunes de Spring Security: 'role', 'roles' o 'authorities'
        rolDetectado = tokenDecodificado.role || tokenDecodificado.roles || tokenDecodificado.authorities || '';
      } catch (error) {
        console.warn('No se pudo decodificar el JWT, usando respaldo de localStorage.');
      }
    }

    // Si el token no tenía el rol o falló la decodificación, usamos el respaldo en texto plano
    if (!rolDetectado) {
      rolDetectado = localStorage.getItem('rol_revista') || 'SIN_AUTENTICAR';
    }

    // CONTROL DE DAÑOS: Si Spring Boot devuelve "ROLE_ADMINISTRADOR", le quitamos el "ROLE_"
    if (rolDetectado.startsWith('ROLE_')) {
      rolDetectado = rolDetectado.replace('ROLE_', '');
    }

    // Retornamos todo en mayúsculas y sin espacios fantasmas
    return rolDetectado.toUpperCase().trim();
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
