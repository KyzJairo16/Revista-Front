import { Component, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AutentificacionService } from '../services/autentificacion';

@Component({
  selector: 'app-revista',
  standalone: false,
  templateUrl: './revista.html',
  styleUrl: './revista.css',
})
export class RevistaComponent {
  public autentificacionService = inject(AutentificacionService);
  private router = inject(Router);
  private zone = inject(NgZone);

  usuarioInput: string = '';
  contraseniaInput: string = '';

  /**
   * Captura las credenciales de acceso, valida con el AuthController de Spring Boot
   * y despacha inmediatamente al usuario a su panel correspondiente de forma segura.
   */
  ejecutarLogin(): void {
    if (!this.usuarioInput.trim() || !this.contraseniaInput.trim()) {
      alert('Por favor rellena todos los campos del inicio de sesión.');
      return;
    }

    const usuarioDTO = {
      username: this.usuarioInput.trim(),
      password: this.contraseniaInput,
    };

    this.autentificacionService.login(usuarioDTO).subscribe({
      next: () => {
        const rolCrudo = this.autentificacionService.getRol();
        const rolDetectado = rolCrudo ? rolCrudo.toUpperCase().trim() : 'USUARIO';

        alert(`¡Conexión Exitosa con Spring Boot!\nBienvenido. Rol activo: ${rolDetectado}`);

        // Forzamos a Angular a procesar la redirección en la zona principal
        this.zone.run(() => {
          switch (rolDetectado) {
            case 'EDITOR':
              this.router.navigate(['/perfil-editor']);
              break;

            case 'ADMINISTRADOR':
            case 'ADMINISTRATIVO':
              this.router.navigate(['/admin']);
              break;

            case 'COMENTADOR':
              this.router.navigate(['/comentador']);
              break;

            case 'USUARIO': // <-- Este es tu rol de Lector del backend
              this.router.navigate(['/lector']); // <-- Despachado directo a su nueva interfaz limpia
              break;

            default:
              this.router.navigate(['/']); // Fallback a la raíz en caso de cualquier otra inconsistencia
              break;
          }
        });
      },
      error: (err) => {
        console.error('Error de autenticación en el servidor:', err);
        alert(
          'Error de Autenticación: Nombre de usuario o contraseña incorrectos en el servidor central.',
        );
        this.limpiarFormularioAcceso();
      },
    });
  }

  limpiarFormularioAcceso(): void {
    this.usuarioInput = '';
    this.contraseniaInput = '';
  }

  irAlRegistro(): void {
    this.zone.run(() => this.router.navigate(['/login']));
  }
}
